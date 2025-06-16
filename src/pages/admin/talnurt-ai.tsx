import React, { useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaUpload, FaFileAlt, FaSpinner, FaCheck, FaTimes, FaDatabase, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';

interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
}

const TalNurtAI = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || 
          droppedFile.name.endsWith('.docx') || 
          droppedFile.name.endsWith('.doc')) {
        setFile(droppedFile);
        setError(null);
        // Reset states when a new file is dropped
        setParsedData(null);
        setRawText('');
        setSaveSuccess(false);
        setCandidateId(null);
      } else {
        setError('Please upload a PDF, DOC, or DOCX file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || 
          selectedFile.name.endsWith('.docx') || 
          selectedFile.name.endsWith('.doc')) {
        setFile(selectedFile);
        setError(null);
        // Reset states when a new file is selected
        setParsedData(null);
        setRawText('');
        setSaveSuccess(false);
        setCandidateId(null);
      } else {
        setError('Please upload a PDF, DOC, or DOCX file');
      }
    }
  };

  const handleParseResume = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Send the file to our API endpoint
      const response = await axios.post('/api/parse-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Set the parsed data
      setParsedData(response.data);
      
      // Extract raw text if available in the response
      if (response.data.rawText) {
        setRawText(response.data.rawText);
      }
      
      // Log the parsed data to console
      console.log('Parsed resume data:', response.data);
      
    } catch (err: any) {
      console.error('Error parsing resume:', err);
      setError(err.response?.data?.error || 'Failed to parse resume. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!file || !parsedData) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Prepare data to save
      const dataToSave = {
        originalFilename: file.name,
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone || null,
        skills: parsedData.skills || [],
        rawResumeText: rawText,
        parsedData: parsedData
      };
      
      // Send data to the save API endpoint
      const response = await axios.post('/api/save-parsed-resume', dataToSave);
      
      // Set success state and candidate ID
      setSaveSuccess(true);
      setCandidateId(response.data.candidateId);
      
      console.log('Resume saved to database:', response.data);
      
    } catch (err: any) {
      console.error('Error saving resume to database:', err);
      setError(err.response?.data?.error || 'Failed to save resume data. Please try again.');
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedData(null);
    setRawText('');
    setError(null);
    setSaveSuccess(false);
    setCandidateId(null);
  };

  const handleViewCandidate = () => {
    if (candidateId) {
      // Navigate to the candidate detail page
      window.location.href = `/admin/my-talent?view=${candidateId}`;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">TalNurt AI</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Resume Parser</h2>
          <p className="text-gray-600 mb-6">
            Upload a resume (PDF, DOC, or DOCX) to automatically extract candidate information using AI.
          </p>
          
          {!parsedData ? (
            <>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                <FaUpload className="mx-auto text-gray-400 text-3xl mb-4" />
                <p className="text-gray-600 mb-2">
                  {file ? file.name : 'Drag and drop your resume here or click to browse'}
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: PDF, DOC, DOCX
                </p>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                  <FaTimes className="mr-2" />
                  {error}
                </div>
              )}
              
              {file && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleParseResume}
                    disabled={isProcessing}
                    className={`px-6 py-2 rounded-md text-white font-medium flex items-center ${
                      isProcessing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaFileAlt className="mr-2" />
                        Parse Resume with AI
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4">
              {saveSuccess ? (
                <div className="bg-green-50 p-4 rounded-md mb-6 flex items-center">
                  <FaCheck className="text-green-600 mr-2" />
                  <span className="text-green-700">Resume successfully saved to database!</span>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-md mb-6 flex items-center">
                  <FaCheck className="text-green-600 mr-2" />
                  <span className="text-green-700">Resume successfully parsed with AI!</span>
                </div>
              )}
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <h3 className="font-medium">Extracted Information</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Basic Information</h4>
                    <p className="font-medium">{parsedData.name}</p>
                    <p>{parsedData.email}</p>
                    <p>{parsedData.phone}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.skills.map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Experience</h4>
                    <div className="space-y-3">
                      {parsedData.experience.map((exp, index) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-3">
                          <p className="font-medium">{exp.title}</p>
                          <p className="text-gray-600">{exp.company}</p>
                          <p className="text-sm text-gray-500">{exp.duration}</p>
                          <p className="text-sm mt-1">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Education</h4>
                    <div className="space-y-3">
                      {parsedData.education.map((edu, index) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-3">
                          <p className="font-medium">{edu.degree}</p>
                          <p className="text-gray-600">{edu.institution}</p>
                          <p className="text-sm text-gray-500">{edu.year}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={handleClear}
                  className="px-6 py-2 rounded-md bg-gray-200 hover:bg-gray-300 font-medium"
                >
                  Upload Another Resume
                </button>
                
                {!saveSuccess ? (
                  <button
                    onClick={handleSaveToDatabase}
                    disabled={isSaving}
                    className={`px-6 py-2 rounded-md text-white font-medium flex items-center ${
                      isSaving ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaDatabase className="mr-2" />
                        Save to Database
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleViewCandidate}
                    className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center"
                  >
                    <FaUserPlus className="mr-2" />
                    View Candidate Profile
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TalNurtAI; 