import React, { useState, useRef, useEffect } from 'react';
import ResumeParserResult from './ResumeParserResult';

const ResumeUploader = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [parserResult, setParserResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const processingTimerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
      }
    };
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file type
      const fileType = selectedFile.type;
      if (!fileType.includes('pdf') && !fileType.includes('word') && !fileType.includes('document')) {
        setError('Please upload a PDF or DOCX file');
        return;
      }
      
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size should be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('resume', file);
      
      // Upload the file
      const uploadResponse = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const uploadResult = await uploadResponse.json();
      
      // Parse the resume
      setIsUploading(false);
      setIsProcessing(true);
      setProcessingTime(0);
      
      // Start a timer to track processing time
      processingTimerRef.current = setInterval(() => {
        setProcessingTime(prev => prev + 1);
      }, 1000);
      
      // Set up abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout
      
      try {
        const parseResponse = await fetch('/api/parse-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath: uploadResult.filePath }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Stop the processing timer
        if (processingTimerRef.current) {
          clearInterval(processingTimerRef.current);
          processingTimerRef.current = null;
        }
        
        if (!parseResponse.ok) {
          const errorData = await parseResponse.json();
          throw new Error(errorData.error || 'Failed to parse resume');
        }
        
        const parseResult = await parseResponse.json();
        setParserResult(parseResult);
      } catch (parseErr) {
        // Check if this is an abort error (timeout)
        if (parseErr.name === 'AbortError') {
          throw new Error('Request timed out. The resume parsing is taking too long. Try a simpler resume format or try again later.');
        }
        throw parseErr;
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred');
      
      // Stop the processing timer
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }
      
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    // Stop any ongoing timers
    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    setFile(null);
    setParserResult(null);
    setError(null);
    setProcessingTime(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format processing time nicely
  const formatProcessingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Function to get appropriate processing message
  const getProcessingMessage = () => {
    if (processingTime < 15) {
      return 'Processing resume with AI...';
    } else if (processingTime < 30) {
      return 'Loading AI models from Hugging Face (this may take a moment)...';
    } else if (processingTime < 60) {
      return 'Still processing... Parsing complex resumes may take up to a minute.';
    } else if (processingTime < 120) {
      return 'This is taking longer than usual. Processing complex documents with AI models can take time...';
    } else {
      return 'Still working... If this continues for much longer, you may want to try again with a simpler resume format.';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Upload & Parse Resume</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Upload Resume (PDF or DOCX)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={isUploading || isProcessing}
          />
        </div>
        
        {file && (
          <div className="mb-4 p-3 bg-blue-50 rounded flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
            </svg>
            <span className="text-sm">{file.name}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading || isProcessing}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              (!file || isUploading || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? 'Uploading...' : isProcessing ? 'Parsing...' : 'Parse Resume'}
          </button>
          
          <button
            onClick={resetForm}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isUploading || isProcessing}
          >
            Reset
          </button>
        </div>
        
        {(isUploading || isProcessing) && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm text-gray-600">
                {isUploading ? 'Uploading file...' : getProcessingMessage()}
              </p>
              {isProcessing && (
                <p className="text-sm font-medium text-gray-600">
                  {formatProcessingTime(processingTime)}
                </p>
              )}
            </div>
            
            {processingTime >= 45 && (
              <p className="text-xs text-amber-600 mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                First-time parsing may take longer as AI models need to be downloaded and cached.
              </p>
            )}
          </div>
        )}
      </div>
      
      {parserResult && <ResumeParserResult parserResult={parserResult} />}
    </div>
  );
};

export default ResumeUploader; 