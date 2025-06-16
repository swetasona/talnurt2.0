import React, { useState, useRef } from 'react';
import { FaUpload, FaFile, FaSpinner, FaCheck, FaSave, FaUserPlus, FaArrowLeft, FaCloudUploadAlt, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import Head from 'next/head';
import AdminLayout from '@/components/Layout/AdminLayout';
import { v4 as uuidv4 } from 'uuid';
import { Candidate, EducationEntry, ExperienceEntry } from '@/types';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';

const UploadResumePage: React.FC = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [candidateData, setCandidateData] = useState<Candidate | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingStartTime, setParsingStartTime] = useState<number | null>(null);
  const [parsingTime, setParsingTime] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add support for drag and drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    multiple: false,
    onDrop: async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        // Reset states
        setError(null);
        setParsedData(null);
        setCandidateData(null);
        setSuccess(null);
        setUploadProgress(0);
        setUploadStatus('idle');
        
        const selectedFile = acceptedFiles[0];
        
        // Check file size (5MB limit)
        if (selectedFile.size > 5 * 1024 * 1024) {
          setError('File size should be less than 5MB');
          return;
        }
        
        setFile(selectedFile);
      }
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setParsedData(null);
    setCandidateData(null);
    setSuccess(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    
    if (!selectedFile) {
      return;
    }
    
    // Check file type
    const fileType = selectedFile.type;
    if (fileType !== 'application/pdf' && 
        fileType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setError('Please upload a PDF or DOCX file');
      return;
    }
    
    // Check file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setParsedData(null);
    setCandidateData(null);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setParsingStartTime(Date.now());
    
    // Start a timer to track parsing time
    const timerInterval = setInterval(() => {
      if (parsingStartTime) {
        const elapsedSeconds = Math.floor((Date.now() - parsingStartTime) / 1000);
        setParsingTime(elapsedSeconds);
      }
    }, 1000);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('resume', file);
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Start tracking upload progress
      const uploadStartTime = Date.now();
      const simulateUploadProgress = setInterval(() => {
        const elapsed = Date.now() - uploadStartTime;
        // Simulate progress up to 90% (leaving 10% for server processing)
        const progress = Math.min(90, Math.floor((elapsed / 1000) * 30)); // ~3% per second
        setUploadProgress(progress);
        
        // When we reach ~90%, switch to parsing status
        if (progress >= 90 && uploadStatus === 'uploading') {
          clearInterval(simulateUploadProgress);
          setUploadStatus('parsing');
        }
      }, 100);
      
      // Use the deepseek-resume-parser endpoint
      const endpoint = '/api/deepseek-resume-parser';
      console.log(`Using endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      // Clear intervals
      clearInterval(simulateUploadProgress);
      clearInterval(timerInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse resume');
      }
      
      const data = await response.json();
      setUploadProgress(100);
      
      // Log complete response for debugging
      console.log('Complete parser result:', data);
      
      // Basic validation of response data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from parser');
      }
      
      // Check if data is valid despite success status (following deepseek implementation)
      const hasValidData = Boolean(
        (data.name && data.name.trim() !== '') || 
        (data.education && data.education.length > 0) ||
        (data.experience && data.experience.length > 0) ||
        (data.technical_skills && data.technical_skills.length > 0) ||
        (data.skills && data.skills.length > 0) ||
        (data.skill && typeof data.skill === 'object')
      );
      
      // If we have valid data, forcibly set success to true
      if (hasValidData) {
        data.success = true;
        console.log('Found valid resume data. Overriding success status to true.');
      }
      
      // Ensure arrays exist to prevent UI errors
      ['education', 'experience', 'skills', 'technical_skills', 'soft_skills', 'language_skills', 'tools'].forEach(field => {
        if (!data[field]) data[field] = [];
      });
      
      setParsedData(data);
      setUploadStatus('success');
      
      // Convert the parsed data to candidate format
      const candidateId = uuidv4();
      const candidateObj: Candidate = {
        id: candidateId,
        name: data.name || 'Unknown',
        email: data.email || data.contact_info?.email || '',
        phone: data.phone || data.contact_info?.phone || '',
        skills: processSkills(data),
        education: processEducation(data),
        experience: processExperience(data),
        resumeUrl: data.fileInfo?.filePath || '',
      };
      
      setCandidateData(candidateObj);
      setSuccess('Resume parsed successfully! Review the data and click "Save Candidate" to add to database.');
      
    } catch (error: any) {
      setUploadStatus('error');
      setError(error.message || 'Failed to parse resume');
      console.error('Error parsing resume:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const processSkills = (data: any): string[] => {
    if (!data) return [];
    
    const skills: string[] = [];
    
    // Check if skills are in the 'skill' object (deepseek format)
    if (data.skill && typeof data.skill === 'object') {
      // Technical skills
      if (Array.isArray(data.skill.technical_skills)) {
        skills.push(...data.skill.technical_skills);
      }
      
      // Soft skills
      if (Array.isArray(data.skill.soft_skills)) {
        skills.push(...data.skill.soft_skills);
      }
      
      // Tools
      if (Array.isArray(data.skill.tools)) {
        skills.push(...data.skill.tools);
      }
    }
    
    // Regular skills array
    if (Array.isArray(data.skills)) {
      skills.push(...data.skills);
    }
    
    // Technical skills at top level
    if (Array.isArray(data.technical_skills)) {
      skills.push(...data.technical_skills);
    }
    
    // Soft skills at top level
    if (Array.isArray(data.soft_skills)) {
      skills.push(...data.soft_skills);
    }
    
    // Remove duplicates without using Set conversion
    return skills.filter((skill, index) => skills.indexOf(skill) === index);
  };
  
  const processEducation = (data: any): EducationEntry[] => {
    if (!data || !data.education || !Array.isArray(data.education)) return [];
    
    return data.education.map((edu: any) => {
      // Extract dates from date string
      let startDate = '';
      let endDate = '';
      
      if (edu.date) {
        const dateMatch = edu.date.match(/(\d{4})\s*-\s*(\d{4}|Present)/i);
        if (dateMatch) {
          startDate = dateMatch[1];
          endDate = dateMatch[2];
        } else {
          // If it's just a single year
          const yearMatch = edu.date.match(/(\d{4})/);
          if (yearMatch) {
            endDate = yearMatch[1];
          }
        }
      }
      
      return {
        institution: edu.institution || '',
        degree: edu.degree || '',
        field: edu.field || edu.major || '',
        startDate: startDate,
        endDate: endDate,
        description: edu.description || ''
      };
    });
  };
  
  const processExperience = (data: any): ExperienceEntry[] => {
    if (!data || !data.experience || !Array.isArray(data.experience)) return [];
    
    return data.experience.map((exp: any) => {
      // Extract dates from date string
      let startDate = '';
      let endDate = '';
      
      if (exp.date) {
        const dateMatch = exp.date.match(/(\d{4})\s*-\s*(\d{4}|Present)/i);
        if (dateMatch) {
          startDate = dateMatch[1];
          endDate = dateMatch[2];
        } else {
          // If it's just a single year
          const yearMatch = exp.date.match(/(\d{4})/);
          if (yearMatch) {
            startDate = yearMatch[1];
          }
        }
      }
      
      return {
        company: exp.company || '',
        title: exp.position || '',
        startDate: startDate,
        endDate: endDate,
        description: exp.description || ''
      };
    });
  };
  
  // Format time in mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  const saveCandidate = async () => {
    if (!candidateData) {
      setError('No candidate data to save');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Format dates properly for experience and education
      const formattedCandidate = {
        ...candidateData,
        experience: candidateData.experience.map(exp => ({
          ...exp,
          // Convert string dates to proper date format or null if invalid
          startDate: exp.startDate ? `${exp.startDate}-01-01` : null,
          endDate: exp.endDate && exp.endDate !== 'Present' ? `${exp.endDate}-01-01` : null
        })),
        education: candidateData.education.map(edu => ({
          ...edu,
          // Convert string dates to proper date format or null if invalid
          startDate: edu.startDate ? `${edu.startDate}-01-01` : null,
          endDate: edu.endDate ? `${edu.endDate}-01-01` : null
        }))
      };
      
      // Save the candidate to the database
      const saveResponse = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedCandidate),
      });
      
      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || 'Failed to save candidate to database');
      }
      
      const savedCandidate = await saveResponse.json();
      console.log('Successfully saved candidate:', savedCandidate);
      
      // Reset the form
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Show success message
      setSuccess('Candidate added successfully! Redirecting to My Talent...');
      
      // Redirect to My Talent page after a short delay with a cache-busting parameter
    setTimeout(() => {
        router.push(`/admin/my-talent?refresh=${Date.now()}`);
    }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Failed to save candidate. Please try again.');
      console.error('Error saving candidate:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Add new rendering functions for detailed candidate information display
  const renderDetailedCandidateInfo = () => {
    if (!parsedData) return null;
    
    return (
      <div className="space-y-6">
        {renderPersonalInfo()}
        {renderSummary()}
        {renderExperience()}
        {renderEducation()}
        {renderSkills()}
      </div>
    );
  };
  
  const renderPersonalInfo = () => {
    if (!parsedData) return null;
    
    // Safe string conversion for any properties that might be objects
    const safeString = (value: any, defaultValue: string = 'N/A') => {
      if (value === undefined || value === null) return defaultValue;
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    };
    
    // Get safe values
    const name = safeString(parsedData.name);
    const email = safeString(parsedData.email || (parsedData.contact_info && parsedData.contact_info.email));
    const phone = safeString(parsedData.phone || (parsedData.contact_info && parsedData.contact_info.phone));
    const linkedin = safeString(parsedData.linkedin || (parsedData.contact_info && parsedData.contact_info.linkedin), '');
    const github = safeString(parsedData.github || (parsedData.contact_info && parsedData.contact_info.github), '');
    const website = safeString(parsedData.website || (parsedData.contact_info && parsedData.contact_info.website), '');
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-blue-600 p-6">
          <h2 className="text-3xl font-bold text-white mb-1">{name}</h2>
          <p className="text-blue-100">
            {parsedData.highlights?.career_level || "Candidate"}
          </p>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {email && (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">EMAIL</p>
                  <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a>
                </div>
              </div>
            )}
            
            {phone && (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">PHONE</p>
                  <a href={`tel:${phone}`} className="text-green-600 hover:underline">{phone}</a>
                </div>
              </div>
            )}
            
            {linkedin && (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">LINKEDIN</p>
                  <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//i, '')}</a>
                </div>
              </div>
            )}
            
            {github && (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">GITHUB</p>
                  <a href={github} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:underline">{github.replace(/https?:\/\/(www\.)?github\.com\//i, '')}</a>
                </div>
              </div>
            )}
            
            {website && (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.572-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">WEBSITE</p>
                  <a href={website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{website.replace(/https?:\/\/(www\.)?/i, '')}</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderSummary = () => {
    if (!parsedData || !parsedData.summary) return null;
    
    // Safely handle summary that might be an object
    const summary = typeof parsedData.summary === 'object' 
      ? JSON.stringify(parsedData.summary) 
      : String(parsedData.summary);
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Summary
          </h3>
        </div>
        
        <div className="p-6">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-gray-700 italic leading-relaxed">{summary}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderExperience = () => {
    if (!parsedData || !parsedData.experience || parsedData.experience.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800">Work Experience</h3>
        </div>
        
        <div className="p-6">
          <div className="relative pl-6 border-l-2 border-blue-200">
            {parsedData.experience.map((exp: any, index: number) => {
              // Safe string conversion for any properties that might be objects
              const position = typeof exp.position === 'object' ? JSON.stringify(exp.position) : (exp.position || exp.title || 'Position Not Specified');
              const company = typeof exp.company === 'object' ? JSON.stringify(exp.company) : (exp.company || 'Company Not Specified');
              const date = typeof exp.date === 'object' ? JSON.stringify(exp.date) : (exp.date || '');
              const startDate = exp.startDate || '';
              const endDate = exp.endDate || '';
              const description = typeof exp.description === 'object' ? JSON.stringify(exp.description) : (exp.description || '');
              
              // Format display date nicely
              let displayDate = date;
              if (!displayDate && (startDate || endDate)) {
                displayDate = `${startDate}${startDate && endDate ? ' - ' : ''}${endDate}`;
              }
              
              // Parse date formats for better display if they follow standard patterns
              const formatDateIfPossible = (dateStr: string) => {
                if (!dateStr) return '';
                const match = dateStr.match(/(\d{2})\/(\d{4})/);
                if (match) {
                  const month = parseInt(match[1]);
                  const year = match[2];
                  return `${month}/${year}`;
                }
                return dateStr;
              };
              
              if (!displayDate && exp.date_start && exp.date_end) {
                displayDate = `${formatDateIfPossible(exp.date_start)} - ${formatDateIfPossible(exp.date_end)}`;
              }
              
              // Safely handle responsibilities and achievements arrays
              const responsibilities = exp.responsibilities ? 
                exp.responsibilities.map((r: any) => typeof r === 'object' ? JSON.stringify(r) : r) : [];
              const achievements = exp.achievements ? 
                exp.achievements.map((a: any) => typeof a === 'object' ? JSON.stringify(a) : a) : [];
              
              return (
                <div key={index} className="mb-8 last:mb-0 relative">
                  {/* Timeline dot */}
                  <div className="absolute w-4 h-4 bg-blue-500 rounded-full -left-8 top-1.5 border-2 border-white shadow"></div>
                  
                  <div className="pl-4">
                    <div className="flex flex-wrap justify-between items-start mb-1">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">
                          {position}
                        </h4>
                        <h5 className="font-medium text-blue-600">
                          {company}
                        </h5>
                      </div>
                      {displayDate && (
                        <div className="text-gray-500 text-sm mt-1 md:mt-0">
                          {displayDate}
                        </div>
                      )}
                    </div>
                    
                    {description && (
                      <div className="mt-2 text-gray-600">
                        <p>{description}</p>
                      </div>
                    )}
                    
                    {/* Responsibilities */}
                    {responsibilities && responsibilities.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Responsibilities
                        </h5>
                        <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1 ml-2">
                          {responsibilities.map((responsibility: any, respIndex: number) => (
                            <li key={respIndex}>{responsibility}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Achievements */}
                    {achievements && achievements.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                          </svg>
                          Achievements
                        </h5>
                        <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1 ml-2">
                          {achievements.map((achievement: any, achIndex: number) => (
                            <li key={achIndex}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  const renderEducation = () => {
    if (!parsedData || !parsedData.education || parsedData.education.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800">Education</h3>
        </div>
        
        <div className="p-6">
          <div className="relative pl-6 border-l-2 border-indigo-200">
            {parsedData.education.map((edu: any, index: number) => {
              // Safe string conversion for any properties that might be objects
              const institution = typeof edu.institution === 'object' ? JSON.stringify(edu.institution) : (edu.institution || 'Institution Not Specified');
              const degree = typeof edu.degree === 'object' ? JSON.stringify(edu.degree) : (edu.degree || 'Degree Not Specified');
              const field = typeof edu.field === 'object' ? JSON.stringify(edu.field) : (edu.field || '');
              const date = typeof edu.date === 'object' ? JSON.stringify(edu.date) : (edu.date || '');
              const startDate = edu.startDate || '';
              const endDate = edu.endDate || '';
              const description = typeof edu.description === 'object' ? JSON.stringify(edu.description) : (edu.description || '');
              
              // Format display date
              let displayDate = date;
              if (!displayDate && (startDate || endDate)) {
                displayDate = `${startDate}${startDate && endDate ? ' - ' : ''}${endDate}`;
              }
              
              return (
                <div key={index} className="mb-8 last:mb-0 relative">
                  {/* Timeline dot */}
                  <div className="absolute w-4 h-4 bg-indigo-500 rounded-full -left-8 top-1.5 border-2 border-white shadow"></div>
                  
                  <div className="pl-4">
                    <div className="mb-1">
                      <h4 className="font-bold text-lg text-gray-800 uppercase">
                        {degree}
                      </h4>
                      <h5 className="font-medium text-indigo-600 uppercase">
                        {institution}
                      </h5>
                    </div>
                    
                    {field && <p className="text-gray-700">{field}</p>}
                    
                    {displayDate && (
                      <div className="text-gray-500 text-sm mt-1">
                        {displayDate}
                      </div>
                    )}
                    
                    {description && (
                      <div className="mt-2 text-gray-600">
                        <p>{description}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  const renderSkills = () => {
    if (!parsedData) return null;
    
    // Helper function to safely get skill arrays
    const safeSkillArray = (skillArray: any[] | undefined) => {
      if (!skillArray) return [];
      return skillArray.map(skill => 
        typeof skill === 'object' ? JSON.stringify(skill) : skill
      );
    };
    
    // Get skills from various possible structures
    let skills: string[] = [];
    let technicalSkills: string[] = [];
    let softSkills: string[] = [];
    let tools: string[] = [];
    
    // Direct skills array
    if (Array.isArray(parsedData.skills)) {
      skills = safeSkillArray(parsedData.skills);
    }
    
    // Skills object format
    if (parsedData.skill && typeof parsedData.skill === 'object') {
      technicalSkills = safeSkillArray(parsedData.skill.technical_skills);
      softSkills = safeSkillArray(parsedData.skill.soft_skills);
      tools = safeSkillArray(parsedData.skill.tools);
    }
    
    // Top-level skill categories
    if (Array.isArray(parsedData.technical_skills)) {
      technicalSkills = [...technicalSkills, ...safeSkillArray(parsedData.technical_skills)];
    }
    
    if (Array.isArray(parsedData.soft_skills)) {
      softSkills = [...softSkills, ...safeSkillArray(parsedData.soft_skills)];
    }
    
    if (Array.isArray(parsedData.tools)) {
      tools = [...tools, ...safeSkillArray(parsedData.tools)];
    }
    
    // If we have no skills in any category, don't render this section
    if (
      skills.length === 0 && 
      technicalSkills.length === 0 && 
      softSkills.length === 0 && 
      tools.length === 0
    ) {
      return null;
    }
    
    // Remove duplicates from each category
    technicalSkills = [...new Set(technicalSkills)];
    softSkills = [...new Set(softSkills)];
    tools = [...new Set(tools)];
    
    // If there are general skills but no technical skills, add them to technical
    if (skills.length > 0 && technicalSkills.length === 0) {
      technicalSkills = skills;
    }
    
    return (
      <div className="grid grid-cols-1 gap-8 mb-6">
        {/* Technical Skills */}
        {technicalSkills.length > 0 && (
          <div>
            <h3 className="flex items-center mb-4 font-semibold text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600 mr-2">
                <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
              </svg>
              Technical Skills <span className="text-gray-500 ml-2">({technicalSkills.length})</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {technicalSkills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Soft Skills */}
        {softSkills.length > 0 && (
          <div>
            <h3 className="flex items-center mb-4 font-semibold text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-600 mr-2">
                <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
              </svg>
              Soft Skills <span className="text-gray-500 ml-2">({softSkills.length})</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {softSkills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Tools */}
        {tools.length > 0 && (
          <div>
            <h3 className="flex items-center mb-4 font-semibold text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-600 mr-2">
                <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75zM4.117 19.125a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z" clipRule="evenodd" />
              </svg>
              Tools <span className="text-gray-500 ml-2">({tools.length})</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {tools.map((tool, index) => (
                <span key={index} className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <Head>
          <title>Upload & Parse Resume | Talnurt</title>
        </Head>

        <div className="mb-6 flex items-center">
          <Link href="/admin/my-talent" className="text-blue-600 hover:text-blue-800 flex items-center">
            <FaArrowLeft className="mr-2" />
            <span>Back to My Talent</span>
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Upload & Parse Resume</h1>
          <p className="text-gray-600 mt-2">
            Upload a resume in PDF or DOCX format to extract candidate information using AI.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Success: </strong>
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Resume (PDF or DOCX)
            </label>
            
            {/* Drag and drop area */}
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <input {...getInputProps()} />
              <FaCloudUploadAlt className="mx-auto text-4xl text-gray-400 mb-3" />
              <p className="text-base text-gray-700">
                {isDragActive ? 'Drop the resume here' : 'Drag & drop a resume, or click to select file'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Supported formats: PDF, DOCX</p>
              
              {file && (
                <div className="flex items-center justify-center mt-4 bg-blue-50 px-3 py-2 rounded-md inline-block">
                  <FaFile className="text-blue-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{file.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-between mt-6">
            <button
              type="button"
              onClick={handleUpload}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading || !file ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading || !file}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                'Parse Resume'
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold mb-4">Parsing Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{uploadStatus === 'uploading' ? 'Uploading...' : 'AI Processing...'}</span>
              <span>{uploadProgress}%</span>
            </div>
            
            {uploadStatus === 'parsing' && (
              <div className="mt-4 text-center text-sm text-gray-600">
                <FaClock className="inline-block mr-2" />
                Processing time: {formatTime(parsingTime)}
                <span className="text-xs ml-2 text-gray-500">(AI processing may take 1-2 minutes)</span>
              </div>
            )}
          </div>
        )}

        {/* Special rendering for JSON parsing errors */}
        {uploadStatus === 'error' && 
          (error?.includes('JSON') || 
           error?.includes('json') ||
           error?.includes('parse')) && (
          <div className="mt-4 p-4 border border-purple-300 rounded-md bg-purple-50">
            <div className="flex items-center text-purple-700 font-semibold mb-2">
              <FaExclamationTriangle className="mr-2" />
              <span>JSON Parsing Error</span>
            </div>
            <p className="text-purple-700 mb-3">
              The AI model returned a response that couldn't be properly parsed as JSON.
            </p>
            <ul className="list-disc ml-5 text-purple-700 mb-3">
              <li>This is usually a temporary issue with the AI model</li>
              <li>Try parsing the resume again</li>
              <li>If the problem persists, try a different resume file</li>
              <li>Make sure you have all required dependencies installed</li>
            </ul>
          </div>
        )}

        {/* Results */}
        {parsedData && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Parsed Resume</h2>
              <button
                onClick={saveCandidate}
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isSaving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2 h-4 w-4" />
                    Save Candidate
                  </>
                )}
              </button>
            </div>

            {/* Detailed Candidate Information */}
            {renderDetailedCandidateInfo()}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UploadResumePage; 