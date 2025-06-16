import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { EnhancedResumeParserResponse, EducationEntry } from '@/types/resume';
import Head from 'next/head';
import { FaCloudUploadAlt, FaSpinner, FaCheck, FaExclamationTriangle, FaFileAlt, FaClock } from 'react-icons/fa';

// Extended education entry with optional field property for display
interface ExtendedEducationEntry extends EducationEntry {
  field?: string;
}

// Export the DeepSeekResumeParserPage component so it can be used in the admin version
const DeepSeekResumeParserPage: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parserResult, setParserResult] = useState<EnhancedResumeParserResponse | null>(null);
  const [parsingStartTime, setParsingStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [parserType, setParserType] = useState('deepseek');
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  
  // Update elapsed time if actively parsing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (uploadStatus === 'parsing' && parsingStartTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - parsingStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [uploadStatus, parsingStartTime]);
  
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
        handleResumeUpload(acceptedFiles[0]);
      }
    }
  });
  
  // Format elapsed time as MM:SS
  const formatElapsedTime = useCallback(() => {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, [elapsedTime]);
  
  const handleResumeUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('uploading');
    setErrorMessage(null);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
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
          setParsingStartTime(Date.now());
        }
      }, 100);
      
      const endpoint = '/api/deepseek-resume-parser';
      console.log(`Using endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      // Clear the upload progress interval
      clearInterval(simulateUploadProgress);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse resume');
      }
      
      const data = await response.json();
      
      // Log complete response for debugging
      console.log('Complete parser result:', data);
      
      // Basic validation of response data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from parser');
      }
      
      // Most important change: Check if data is valid despite success status
      const hasValidData = Boolean(
        (data.name && data.name.trim() !== '') || 
        (data.education && data.education.length > 0) ||
        (data.experience && data.experience.length > 0) ||
        (data.technical_skills && data.technical_skills.length > 0) ||
        (data.skills && data.skills.length > 0)
      );
      
      // If we have valid data, forcibly set success to true
      if (hasValidData) {
        data.success = true;
        console.log('Found valid resume data. Overriding success status to true.');
      }
      
      // Set success status if missing but required fields are present
      if (data.success === undefined) {
        data.success = hasValidData;
      }
      
      // Ensure arrays exist to prevent UI errors
      ['education', 'experience', 'skills', 'technical_skills', 'soft_skills', 'language_skills', 'tools'].forEach(field => {
        if (!data[field]) data[field] = [];
      });
      
      // Update the parser result state with validated data
      setParserResult(data);
      setUploadProgress(100);
      setUploadStatus('success');
    } catch (error: any) {
      console.error('Resume parsing error:', error);
      setErrorMessage(error.message || 'An error occurred while parsing the resume');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
      setParsingStartTime(null);
    }
  };
  
  const renderDropzone = () => {
    return (
      <>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <FaCloudUploadAlt className="mx-auto text-5xl text-gray-400 mb-4" />
        <p className="text-lg text-gray-700">
          {isDragActive ? 'Drop the resume here' : 'Drag & drop a resume, or click to select file'}
        </p>
        <p className="text-sm text-gray-500 mt-2">Supported formats: PDF, DOCX, TXT</p>
        </div>
      </>
    );
  };
  
  const renderProgressBar = () => {
    if (uploadStatus === 'idle' || uploadStatus === 'success' || uploadStatus === 'error') {
      return null;
    }
    
    return (
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{uploadStatus === 'uploading' ? 'Uploading...' : 'AI Processing...'}</span>
          <span>{uploadProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
        {uploadStatus === 'parsing' && (
          <div className="mt-2 flex items-center justify-center text-sm text-gray-600">
            <FaClock className="mr-1" /> Processing time: {formatElapsedTime()}
            <span className="text-xs ml-2 text-gray-500">(AI processing may take 1-2 minutes)</span>
          </div>
        )}
      </div>
    );
  };
  
  const renderUploadStatus = () => {
    if (uploadStatus === 'idle') return null;
    if (uploadStatus === 'uploading' || uploadStatus === 'parsing') {
      return renderProgressBar();
    }
    
    // Special case for successful parsing but frontend display issues
    if (uploadStatus === 'success' && parserResult && parserResult.success && !parserResult.error) {
      // Ensure the page recognizes successful parsing even if UI elements don't update correctly
      return (
        <div className="mt-4 p-3 border rounded-md flex items-center bg-green-50 border-green-300 text-green-700">
          <FaCheck className="mr-2" />
          <span>Resume parsed successfully!</span>
        </div>
      );
    }
    
    const statusClasses = {
      success: 'bg-green-50 border-green-300 text-green-700',
      error: 'bg-red-50 border-red-300 text-red-700'
    };
    
    const StatusIcon = {
      success: <FaCheck className="mr-2" />,
      error: <FaExclamationTriangle className="mr-2" />
    };
    
    const statusMessages = {
      success: 'Resume parsed successfully!',
      error: errorMessage || 'Failed to parse resume'
    };
    
    // Special rendering for JSON parsing errors
    if (uploadStatus === 'error' && 
        (errorMessage?.includes('JSON') || 
         errorMessage?.includes('json') ||
         errorMessage?.includes('parse'))) {
      return (
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
      );
    }
    
    return (
      <div className={`mt-4 p-3 border rounded-md flex items-center ${statusClasses[uploadStatus]}`}>
        {StatusIcon[uploadStatus]}
        <span>{statusMessages[uploadStatus]}</span>
      </div>
    );
  };
  
  const renderPersonalInfo = () => {
    if (!parserResult) return null;
    
    // Safe string conversion for any properties that might be objects
    const safeString = (value: any, defaultValue: string = 'N/A') => {
      if (value === undefined || value === null) return defaultValue;
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    };
    
    // Get safe values
    const name = safeString(parserResult.name);
    const email = safeString(parserResult.email);
    const phone = safeString(parserResult.phone);
    const linkedin = safeString(parserResult.linkedin, '');
    const github = safeString(parserResult.github, '');
    const website = safeString(parserResult.website, '');
    
    // Contact info from the original format if available
    const contactInfo = (parserResult as any).contact_info || {};
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
          <h2 className="text-3xl font-bold text-white mb-1">{name}</h2>
          <p className="text-blue-100 text-lg">
            {parserResult.highlights?.career_level || "Candidate"}
          </p>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    if (!parserResult || !parserResult.summary) return null;
    
    // Safely handle summary that might be an object
    const summary = typeof parserResult.summary === 'object' 
      ? JSON.stringify(parserResult.summary) 
      : String(parserResult.summary);
    
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
    if (!parserResult || !parserResult.experience || parserResult.experience.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Work Experience
          </h3>
        </div>
        
        <div className="p-6">
          <div className="relative pl-8 border-l-2 border-blue-200">
            {parserResult.experience.map((exp, index) => {
              // Safe string conversion for any properties that might be objects
              const position = typeof exp.position === 'object' ? JSON.stringify(exp.position) : (exp.position || 'Position Not Specified');
              const company = typeof exp.company === 'object' ? JSON.stringify(exp.company) : (exp.company || 'Company Not Specified');
              const date = typeof exp.date === 'object' ? JSON.stringify(exp.date) : (exp.date || 'Date Not Specified');
              const description = typeof exp.description === 'object' ? JSON.stringify(exp.description) : (exp.description || '');
              
              // Safely handle responsibilities and achievements arrays
              const responsibilities = exp.responsibilities ? 
                exp.responsibilities.map(r => typeof r === 'object' ? JSON.stringify(r) : r) : [];
              const achievements = exp.achievements ? 
                exp.achievements.map(a => typeof a === 'object' ? JSON.stringify(a) : a) : [];
              
              return (
                <div key={index} className="mb-8 last:mb-0 relative">
                  {/* Timeline dot */}
                  <div className="absolute w-4 h-4 bg-blue-500 rounded-full -left-10 top-1.5 border-2 border-white shadow"></div>
                  
                  <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex flex-wrap justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800">{position}</h4>
                        <div className="text-blue-600 font-medium">{company}</div>
                      </div>
                      <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm mt-1 md:mt-0">
                        {date}
                      </div>
                    </div>
                    
                    {description && (
                      <div className="mt-3 text-gray-600">
                        <p>{description}</p>
                      </div>
                    )}
                    
                    {/* Responsibilities */}
                    {responsibilities && responsibilities.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Responsibilities
                        </h5>
                        <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1 ml-2">
                          {responsibilities.map((responsibility, respIndex) => (
                            <li key={respIndex}>{responsibility}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Achievements */}
                    {achievements && achievements.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                          </svg>
                          Achievements
                        </h5>
                        <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1 ml-2">
                          {achievements.map((achievement, achIndex) => (
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
    if (!parserResult || !parserResult.education || parserResult.education.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
            Education
          </h3>
        </div>
        
        <div className="p-6">
          <div className="relative pl-8 border-l-2 border-indigo-200">
            {parserResult.education.map((edu, index) => {
              // Cast to extended education entry type that may have field property
              const extendedEdu = edu as ExtendedEducationEntry;
              // Safe string conversion for any properties that might be objects
              const institution = typeof edu.institution === 'object' ? JSON.stringify(edu.institution) : (edu.institution || 'Institution Not Specified');
              const degree = typeof edu.degree === 'object' ? JSON.stringify(edu.degree) : (edu.degree || '');
              const field = typeof extendedEdu.field === 'object' ? JSON.stringify(extendedEdu.field) : (extendedEdu.field || '');
              const date = typeof edu.date === 'object' ? JSON.stringify(edu.date) : (edu.date || 'Date Not Specified');
              const description = typeof edu.description === 'object' ? JSON.stringify(edu.description) : (edu.description || '');
              
              return (
                <div key={index} className="mb-8 last:mb-0 relative">
                  {/* Timeline dot */}
                  <div className="absolute w-4 h-4 bg-indigo-500 rounded-full -left-10 top-1.5 border-2 border-white shadow"></div>
                  
                  <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex flex-wrap justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800">{degree} {field ? `in ${field}` : ''}</h4>
                        <div className="text-indigo-600 font-medium">{institution}</div>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm mt-1 md:mt-0">
                        {date}
                      </div>
                    </div>
                    {description && <p className="mt-2 text-gray-600">{description}</p>}
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
    if (!parserResult) return null;
    
    // Check for skill object first (new format)
    const hasSkillObject = parserResult.skill && typeof parserResult.skill === 'object';
    
    // Make sure we check for all possible skill arrays
    const hasAnySkills = hasSkillObject || (
      (parserResult.technical_skills && parserResult.technical_skills.length > 0) ||
      (parserResult.soft_skills && parserResult.soft_skills.length > 0) ||
      (parserResult.language_skills && parserResult.language_skills.length > 0) ||
      (parserResult.tools && parserResult.tools.length > 0) ||
      (parserResult.skills && parserResult.skills.length > 0)
    );
    
    if (!hasAnySkills) return null;
    
    // Safely convert any object values in skills arrays to strings
    const safeSkillArray = (skillArray: any[] | undefined) => {
      if (!skillArray || !Array.isArray(skillArray)) return [];
      return skillArray.map(skill => 
        typeof skill === 'object' ? JSON.stringify(skill) : String(skill)
      );
    };
    
    // Get skills from the nested structure first (new format) or fallback to top-level arrays
    const technicalSkills = hasSkillObject && parserResult.skill
      ? safeSkillArray(parserResult.skill.technical_skills)
      : safeSkillArray(parserResult.technical_skills);
      
    const softSkills = hasSkillObject && parserResult.skill
      ? safeSkillArray(parserResult.skill.soft_skills)
      : safeSkillArray(parserResult.soft_skills);
      
    const tools = hasSkillObject && parserResult.skill
      ? safeSkillArray(parserResult.skill.tools)
      : safeSkillArray(parserResult.tools);
    
    const languageSkills = safeSkillArray(parserResult.language_skills);
    
    const generalSkills = (!technicalSkills.length && !softSkills.length && !languageSkills.length) 
      ? safeSkillArray(parserResult.skills) 
      : [];
      
    // Get all skill categories
    const categories = [
      { 
        title: 'Technical Skills', 
        skills: technicalSkills,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        ),
        colorClass: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      { 
        title: 'Soft Skills', 
        skills: softSkills,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        ),
        colorClass: 'bg-green-100 text-green-800 border-green-200'
      },
      { 
        title: 'Languages', 
        skills: languageSkills,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
          </svg>
        ),
        colorClass: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      { 
        title: 'Tools', 
        skills: tools,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        ),
        colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      { 
        title: 'Other Skills', 
        skills: generalSkills,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        ),
        colorClass: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    ].filter(category => category.skills.length > 0);
    
    if (categories.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Skills
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <span className="mr-2 text-indigo-600">{category.icon}</span>
                  {category.title}
                  <span className="ml-2 text-gray-500 text-sm font-normal">({category.skills.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, skillIndex) => (
                    <span 
                      key={skillIndex} 
                      className={`px-3 py-1 rounded-full text-sm border ${category.colorClass}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderHighlights = () => {
    if (!parserResult || !parserResult.highlights) return null;
    
    const { highlights } = parserResult;
    
    // Safely convert potential object values to strings
    const safeString = (value: any) => {
      if (value === undefined || value === null) return '';
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    };
    
    // Safely convert array items
    const safeArray = (arr: any[] | undefined) => {
      if (!arr || !Array.isArray(arr)) return [];
      return arr.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item));
    };
    
    // Get safe values
    const years_experience = safeString(highlights.years_experience);
    const highest_education = safeString(highlights.highest_education);
    const career_level = safeString(highlights.career_level);
    const leadership_experience = highlights.leadership_experience === true;
    const top_skills = safeArray(highlights.top_skills);
    const industries = safeArray(highlights.industries);
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Career Highlights
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Stats */}
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <h4 className="font-medium text-gray-700 mb-4 flex items-center text-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Key Statistics
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                {highlights.years_experience !== undefined && (
                  <div className="border border-blue-100 rounded-lg p-3 bg-blue-50">
                    <p className="text-blue-600 text-sm font-medium">YEARS OF EXPERIENCE</p>
                    <p className="text-gray-800 font-bold text-2xl mt-1">{years_experience}</p>
                  </div>
                )}
                
                {highlights.career_level && (
                  <div className="border border-purple-100 rounded-lg p-3 bg-purple-50">
                    <p className="text-purple-600 text-sm font-medium">CAREER LEVEL</p>
                    <p className="text-gray-800 font-bold text-xl mt-1">{career_level}</p>
                  </div>
                )}
                
                {highlights.highest_education && (
                  <div className="border border-green-100 rounded-lg p-3 bg-green-50">
                    <p className="text-green-600 text-sm font-medium">HIGHEST EDUCATION</p>
                    <p className="text-gray-800 font-bold text-lg mt-1">{highest_education}</p>
                  </div>
                )}
                
                {highlights.leadership_experience !== undefined && (
                  <div className="border border-yellow-100 rounded-lg p-3 bg-yellow-50">
                    <p className="text-yellow-600 text-sm font-medium">LEADERSHIP EXPERIENCE</p>
                    <p className="text-gray-800 font-bold text-2xl mt-1">{leadership_experience ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Skills & Industries */}
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              {top_skills.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Top Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {top_skills.map((skill, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm border border-green-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {industries.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                    Industries
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {industries.map((industry, index) => (
                      <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm border border-purple-200">
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderAdditionalInfo = () => {
    if (!parserResult) return null;
    
    // Helper to safely process items that might be objects or arrays of objects
    const safeItems = (items: any) => {
      if (!items) return null;
      
      if (Array.isArray(items)) {
        if (items.length === 0) return null;
        return items.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item));
      } else if (typeof items === 'object') {
        return [JSON.stringify(items)];
      } else if (typeof items === 'string' && items.trim() !== '') {
        return [items];
      }
      
      return null;
    };
    
    // Use type assertion to tell TypeScript that items will never be null at this point
    type SafeSection = {
      title: string;
      items: string[];
      icon: string;
    };
    
    const additionalSections = [
      { title: 'Certifications', items: safeItems(parserResult.certifications), icon: '🏆' },
      { title: 'Projects', items: safeItems(parserResult.projects), icon: '💻' },
      { title: 'Publications', items: safeItems(parserResult.publications), icon: '📝' },
      { title: 'Awards', items: safeItems(parserResult.awards), icon: '🏅' },
      { title: 'Organizations', items: safeItems(parserResult.organizations), icon: '🏢' },
      { title: 'Interests', items: safeItems(parserResult.interests), icon: '⭐' }
    ].filter((section): section is SafeSection => section.items !== null);
    
    if (additionalSections.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Additional Information
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {additionalSections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <span className="mr-2 text-xl">{section.icon}</span>
                  {section.title}
                  <span className="ml-2 text-gray-500 text-sm font-normal">({section.items.length})</span>
                </h4>
                <ul className="list-disc list-inside text-gray-600 ml-6 space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Add a reset function
  const resetParser = useCallback(() => {
    setParserResult(null);
    setUploadStatus('idle');
    setErrorMessage(null);
    setUploadProgress(0);
    setIsUploading(false);
    setParsingStartTime(null);
    setElapsedTime(0);
  }, []);
  
  // New function to show the raw DeepSeek output
  const renderRawDeepSeekOutput = () => {
    if (!parserResult) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Raw DeepSeek Output
            <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Debug Mode</span>
          </h3>
          <button 
            onClick={() => setIsOutputExpanded(!isOutputExpanded)}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center transition-colors duration-200"
          >
            {isOutputExpanded ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Collapse
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Expand
              </>
            )}
          </button>
        </div>
        
        <div className={`transition-all duration-300 ${isOutputExpanded ? 'max-h-[2000px]' : 'max-h-[400px]'} overflow-auto`}>
          <div className="p-4 bg-gray-800 text-white text-sm">
            <pre className="font-mono whitespace-pre-wrap">
              {JSON.stringify(parserResult, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <>
      <Head>
        <title>DeepSeek Resume Parser | Recruitment Portal</title>
        <meta name="description" content="Parse resumes using DeepSeek AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">DeepSeek Resume Parser</h1>
        <p className="text-gray-600 mb-6">Upload a resume in PDF, DOCX, or TXT format to extract detailed candidate information using our advanced AI parser.</p>
        
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Resume</h2>
          {renderDropzone()}
          {renderUploadStatus()}
        </div>
        
        {(parserResult && parserResult.success) && (
          <div className="space-y-6">
            {renderPersonalInfo()}
            {renderSummary()}
            {renderHighlights()}
            {renderExperience()}
            {renderEducation()}
            {renderSkills()}
            {renderAdditionalInfo()}
            {renderRawDeepSeekOutput()}
          </div>
        )}
        
        {(parserResult && !parserResult.success) && (
          <div className="space-y-6">
            {(parserResult.name || parserResult.email || parserResult.phone) && renderPersonalInfo()}
            {parserResult.summary && renderSummary()}
            {parserResult.highlights && renderHighlights()}
            {(parserResult.experience && parserResult.experience.length > 0) && renderExperience()}
            {(parserResult.education && parserResult.education.length > 0) && renderEducation()}
            {((parserResult.skills && parserResult.skills.length > 0) || 
              (parserResult.technical_skills && parserResult.technical_skills.length > 0) ||
              (parserResult.tools && parserResult.tools.length > 0)) && renderSkills()}
            {renderAdditionalInfo()}
            {renderRawDeepSeekOutput()}
          </div>
        )}
        
        {/* Add reset button when there's a result or error */}
        {(uploadStatus === 'success' || uploadStatus === 'error') && (
          <div className="mt-4">
            <button 
              onClick={resetParser}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Upload Another Resume
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Export both as default and named export
export { DeepSeekResumeParserPage };
export default DeepSeekResumeParserPage; 