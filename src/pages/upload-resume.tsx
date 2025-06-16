import React, { useState } from 'react';
import { FaUpload, FaFile, FaSpinner, FaCheck } from 'react-icons/fa';
import Head from 'next/head';

const UploadResumePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setParsedData(null);
    setSuccess(false);
    
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
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload and parse the resume
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse resume');
      }
      
      // Get the parsed resume data
      const data = await response.json();
      setParsedData(data);
      setSuccess(true);
      
      // Reset file input
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process the resume. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Head>
        <title>Upload Resume | TalNurt</title>
      </Head>
      
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">Resume Parser</h1>
          <p className="mt-3 text-gray-600">
            Upload your resume and we'll automatically extract your information
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="mb-4">
              <FaUpload className="mx-auto text-gray-400" size={36} />
              <p className="mt-3 text-gray-600">
                Upload a PDF or DOCX file to automatically extract your information
              </p>
            </div>
            
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            
            <div className="mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </button>
            </div>
            
            {file && (
              <div className="mt-4 flex items-center justify-center space-x-2 p-2 bg-gray-50 rounded">
                <FaFile className="text-blue-600" />
                <span className="font-medium">{file.name}</span>
              </div>
            )}
            
            {error && (
              <div className="mt-4 text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:bg-blue-400"
              disabled={!file || isLoading}
              onClick={handleUpload}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Parse Resume'
              )}
            </button>
          </div>
        </div>
        
        {/* Results Section */}
        {success && parsedData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-4 text-green-600">
              <FaCheck className="mr-2" />
              <h2 className="text-xl font-semibold">Resume Parsed Successfully</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Personal Information</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p><strong>Name:</strong> {parsedData.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {parsedData.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {parsedData.phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Skills</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="flex flex-wrap gap-2">
                      {parsedData.skills && parsedData.skills.length > 0 ? (
                        parsedData.skills.map((skill: string, index: number) => (
                          <span 
                            key={index} 
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No skills detected</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Education</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    {parsedData.education && parsedData.education.length > 0 ? (
                      <div className="space-y-3">
                        {parsedData.education.map((edu: any, index: number) => (
                          <div key={index}>
                            <p className="font-medium">{edu.degree || 'Degree not specified'}</p>
                            <p className="text-sm">{edu.institution || 'Institution not specified'}</p>
                            <p className="text-xs text-gray-500">{edu.year || 'Year not specified'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No education history detected</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Experience</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    {parsedData.experience && parsedData.experience.length > 0 ? (
                      <div className="space-y-3">
                        {parsedData.experience.map((exp: any, index: number) => (
                          <div key={index}>
                            <p className="font-medium">{exp.title || 'Title not specified'}</p>
                            <p className="text-sm">{exp.company || 'Company not specified'}</p>
                            <p className="text-xs text-gray-500">{exp.duration || 'Duration not specified'}</p>
                            {exp.description && (
                              <p className="text-sm mt-1">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No work experience detected</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadResumePage; 