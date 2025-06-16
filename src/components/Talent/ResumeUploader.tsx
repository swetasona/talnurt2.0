import React, { useState, useRef } from 'react';
import { FaUpload, FaFile, FaSpinner, FaEdit, FaCheck } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { Candidate } from '@/types';
import { useRouter } from 'next/router';

// Enable debug mode to use test endpoints
const DEBUG_MODE = false;

// AI provider options (consolidated to use the transformer parser)
const AI_PROVIDERS = {
  TRANSFORMER: 'transformer'
};

interface ResumeUploaderProps {
  onUpload?: (candidate: Candidate) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onUpload }) => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [candidateData, setCandidateData] = useState<Candidate | null>(null);
  const [aiProvider, setAiProvider] = useState(AI_PROVIDERS.TRANSFORMER); // Default to transformer
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingStartTime, setParsingStartTime] = useState<number | null>(null);
  const [parsingTime, setParsingTime] = useState(0);
  const [editableFields, setEditableFields] = useState<{
    name: boolean;
    email: boolean;
    phone: boolean;
  }>({
    name: false,
    email: false,
    phone: false
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setSuccess(null);
    setParsedData(null);
    setCandidateData(null);
    setUploadProgress(0);
    
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
      
      // Upload the resume first to get its path
      try {
        setUploadProgress(10);
        
        const uploadResponse = await fetch('/api/upload-resume', {
          method: 'POST',
          body: formData,
        });
        
        setUploadProgress(40);
        
        // Check if the upload response is valid JSON
        const uploadContentType = uploadResponse.headers.get('content-type');
        console.log('Upload response content type:', uploadContentType);
        
        if (!uploadContentType || !uploadContentType.includes('application/json')) {
          console.error('Server returned non-JSON response for upload');
          throw new Error(`Server error: Invalid response format from upload service (${uploadContentType || 'unknown content type'}).`);
        }
        
        // Parse the JSON response
        const uploadResult = await uploadResponse.json();
        console.log('Upload response data:', uploadResult);
        
        if (!uploadResponse.ok || !uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload resume file');
        }
        
        setUploadProgress(60);
        
        // Now parse the resume using the Transformer parser
        const parseResponse = await fetch('/api/parse-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath: uploadResult.filePath }),
        });
        
        setUploadProgress(90);
        
        // Check if the parse response is valid JSON
        const parseContentType = parseResponse.headers.get('content-type');
        console.log('Parse response content type:', parseContentType);
        
        if (!parseContentType || !parseContentType.includes('application/json')) {
          console.error('Server returned non-JSON response for parsing');
          throw new Error(`Server error: Invalid response format from parsing service (${parseContentType || 'unknown content type'}).`);
        }
        
        // Parse the JSON response
        const responseData = await parseResponse.json();
        console.log('Parse response data:', responseData);
        
        if (!parseResponse.ok || !responseData.success) {
          throw new Error(responseData.error || 'Failed to parse resume');
        }
        
        setUploadProgress(100);
        clearInterval(timerInterval);
        
        // If in debug mode, use mock data
        if (DEBUG_MODE) {
          const mockData = {
            name: "Test User",
            email: "test@example.com",
            phone: "123-456-7890",
            skills: ["JavaScript", "React", "Node.js"],
            education: [{ description: "Test Degree", institution: "Test University", date: "2020" }],
            experience: [{ position: "Test Position", company: "Test Company", date: "2020 - Present", description: "Test description" }],
            id: uuidv4(),
            fileUrl: "/uploads/test.pdf",
            success: true
          };
          
          setParsedData(mockData);
          setSuccess('Debug mode: Resume parsed successfully! Review the data and click "Save Candidate" to add to database.');
          
          // Create a candidate object from the mock data
          const candidateId = uuidv4();
          const extractedCandidate: Candidate = {
            id: candidateId,
            name: mockData.name || '',
            email: mockData.email || '',
            phone: mockData.phone || '',
            skills: mockData.skills || [],
            experience: (mockData.experience || []).map((exp: any) => {
              // Parse duration into start and end dates
              let startDate = '';
              let endDate = 'Present';
              
              if (exp.date) {
                const durationParts = exp.date.split(/\s*[-–]\s*/);
                if (durationParts.length >= 1) {
                  startDate = durationParts[0].trim();
                }
                if (durationParts.length >= 2) {
                  endDate = durationParts[1].trim();
                }
              }
              
              return {
                company: exp.company || '',
                title: exp.position || '',
                startDate,
                endDate,
                description: exp.description || '',
              };
            }),
            education: (mockData.education || []).map((edu: any) => {
              // Parse year into start and end dates
              let startDate = '';
              let endDate = '';
              
              if (edu.date) {
                const yearParts = edu.date.split(/\s*[-–]\s*/);
                if (yearParts.length >= 1) {
                  // If it's just one year, use it as the end date
                  endDate = yearParts[0].trim();
                }
                if (yearParts.length >= 2) {
                  startDate = yearParts[0].trim();
                  endDate = yearParts[1].trim();
                }
              }
              
              return {
                institution: edu.institution || '',
                degree: edu.description || '',
                field: edu.description?.split(' in ')?.[1] || '',
                startDate,
                endDate,
              };
            }),
            resumeUrl: mockData.fileUrl,
          };
          
          setCandidateData(extractedCandidate);
          return;
        }
        
        // Set the parsed data
        setParsedData(responseData);
        
        // Create a candidate object from the parsed data
        const candidateId = uuidv4();
        
        // Generate the file URL from the upload result
        const fileUrl = uploadResult.filePath;
        
        // Check if we have missing data and set appropriate message
        let successMessage = 'Resume parsed successfully! Review the data and click "Save Candidate" to add to database.';
        
        // Check for warnings
        if (responseData.warnings && responseData.warnings.length > 0) {
          successMessage += ' Note: ' + responseData.warnings.join('. ');
        }
        
        // Specific check for missing name
        if (!responseData.name || responseData.name.trim() === '') {
          successMessage += ' Warning: Name could not be extracted. Please enter it manually.';
        }
        
        // Map the parsed data to a Candidate object
        const extractedCandidate: Candidate = {
          id: candidateId,
          name: responseData.name || '',
          email: responseData.email || '',
          phone: responseData.phone || '',
          skills: responseData.skills || [],
          experience: (responseData.experience || []).map((exp: any) => {
            // Parse duration into start and end dates
            let startDate = '';
            let endDate = 'Present';
            
            if (exp.date) {
              const durationParts = exp.date.split(/\s*[-–]\s*/);
              if (durationParts.length >= 1) {
                startDate = durationParts[0].trim();
              }
              if (durationParts.length >= 2) {
                endDate = durationParts[1].trim();
              }
            }
            
            return {
              company: exp.company || '',
              title: exp.position || '',
              startDate,
              endDate,
              description: exp.description || '',
            };
          }),
          education: (responseData.education || []).map((edu: any) => {
            // Parse year into start and end dates
            let startDate = '';
            let endDate = '';
            
            if (edu.date) {
              const yearParts = edu.date.split(/\s*[-–]\s*/);
              if (yearParts.length >= 1) {
                // If it's just one year, use it as the end date
                endDate = yearParts[0].trim();
              }
              if (yearParts.length >= 2) {
                startDate = yearParts[0].trim();
                endDate = yearParts[1].trim();
              }
            }
            
            return {
              institution: edu.institution || '',
              degree: edu.description || '',
              field: edu.description?.split(' in ')?.[1] || '',
              startDate,
              endDate,
            };
          }),
          resumeUrl: fileUrl,
        };
        
        setCandidateData(extractedCandidate);
        
        // Show success message
        setSuccess(successMessage);
        
      } catch (parseError: any) {
        console.error('Resume parsing error:', parseError);
        throw parseError;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process the resume. Please try again.';
      
      // Check for specific error patterns
      if (errorMessage.includes('timed out')) {
        setError(`${errorMessage} This may happen if the file is complex or if this is the first time running the parser.`);
      } else if (errorMessage.includes('Failed to parse resume')) {
        setError(`${errorMessage} The resume format may be difficult to process. Try a simpler format or a different file.`);
      } else {
        setError(errorMessage);
      }
      
      console.error('Resume upload error:', err);
    } finally {
      clearInterval(timerInterval);
      setIsLoading(false);
    }
  };

  const saveCandidate = async (candidate: Candidate) => {
    setIsSaving(true);
    try {
      // Format dates properly for experience and education
      const formattedCandidate = {
        ...candidate,
        experience: candidate.experience.map(exp => ({
          ...exp,
          // Convert string dates to proper date format or null if invalid
          startDate: exp.startDate ? formatDateString(exp.startDate) : null,
          endDate: exp.endDate && exp.endDate !== 'Present' ? formatDateString(exp.endDate) : null
        })),
        education: candidate.education.map(edu => ({
          ...edu,
          // Convert string dates to proper date format or null if invalid
          startDate: edu.startDate ? formatDateString(edu.startDate) : null,
          endDate: edu.endDate ? formatDateString(edu.endDate) : null
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
      setSuccess('Resume parsed and candidate added successfully! Redirecting to My Talent...');
      
      // Call the onUpload callback if provided
      if (onUpload) {
        onUpload(savedCandidate);
      }
      
      // Redirect to My Talent page after a short delay with a cache-busting parameter
      setTimeout(() => {
        router.push(`/admin/my-talent?refresh=${Date.now()}`);
      }, 1500);
      
      return savedCandidate;
    } catch (err: any) {
      setError(err.message || 'Failed to save candidate. Please try again.');
      console.error('Error saving candidate:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to format date strings into valid dates
  const formatDateString = (dateStr: string): string | null => {
    // Try to parse the date string into a proper date format
    try {
      // Check if it's just a year
      if (/^\d{4}$/.test(dateStr)) {
        return `${dateStr}-01-01`; // January 1st of that year
      }
      
      // Check if it's a month year format (e.g., "May 2020")
      const monthYearMatch = /^([A-Za-z]+)\s+(\d{4})$/.exec(dateStr);
      if (monthYearMatch) {
        const month = new Date(`${monthYearMatch[1]} 1, 2000`).getMonth() + 1;
        return `${monthYearMatch[2]}-${month.toString().padStart(2, '0')}-01`;
      }
      
      // Try to parse with Date object
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      // If all parsing attempts fail
      return null;
    } catch (e) {
      console.error('Error parsing date string:', dateStr, e);
      return null;
    }
  };

  const handleSaveCandidate = async () => {
    if (!candidateData) {
      setError('No candidate data to save');
      return;
    }
    
    try {
      const savedCandidate = await saveCandidate(candidateData);
      console.log('Candidate saved successfully:', savedCandidate);
    } catch (err: any) {
      console.error('Error in handleSaveCandidate:', err);
    }
  };

  // Format time in mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // New function to handle editing of fields
  const handleEditField = (field: string, value: string) => {
    if (!candidateData || !parsedData) return;
    
    // Update candidate data
    setCandidateData({
      ...candidateData,
      [field]: value
    });
    
    // Also update parsed data for display
    setParsedData({
      ...parsedData,
      [field]: value
    });
  };
  
  // Toggle field edit mode
  const toggleEditMode = (field: 'name' | 'email' | 'phone') => {
    setEditableFields({
      ...editableFields,
      [field]: !editableFields[field]
    });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 w-full overflow-hidden">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Resume</h2>
      
      {error && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
          <p className="font-medium">Success</p>
          <p>{success}</p>
        </div>
      )}
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Resume (PDF or DOCX)
        </label>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="sr-only"
            id="resume-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="resume-upload"
            className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FaUpload className="mr-2 h-4 w-4" />
            {file ? 'Change File' : 'Select File'}
          </label>
          {file && (
            <div className="flex items-center bg-blue-50 px-3 py-1 rounded-md">
              <FaFile className="text-blue-500 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="mt-4 mb-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  {uploadProgress < 100 ? 'Processing...' : 'Complete'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {uploadProgress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div 
                style={{ width: `${uploadProgress}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {uploadProgress < 40 ? 'Uploading file...' :
               uploadProgress < 90 ? 'Parsing resume with AI models...' :
               uploadProgress < 100 ? 'Finalizing...' :
               'Processing complete!'}
            </p>
            {parsingTime > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Time elapsed: {formatTime(parsingTime)}
                {parsingTime > 30 && ' - AI models may take longer on first run'}
              </p>
            )}
          </div>
        </div>
      )}
      
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
        
        {candidateData && (
          <button
            type="button"
            onClick={handleSaveCandidate}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              'Save Candidate'
            )}
          </button>
        )}
      </div>
      
      {parsedData && (
        <div className="mt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Parsed Resume Data
          </h3>
          
          <div className="bg-gray-50 border rounded-md p-4 mb-4">
            <h4 className="text-md font-medium text-gray-800 mb-2">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <div className="flex items-center">
                  {editableFields.name ? (
                    <input
                      type="text"
                      value={parsedData.name || ''}
                      onChange={(e) => handleEditField('name', e.target.value)}
                      className="font-medium border border-blue-300 rounded-md px-2 py-1 mr-2 flex-grow"
                      autoFocus
                    />
                  ) : (
                    <p className="font-medium mr-2">{parsedData.name || 'Not detected'}</p>
                  )}
                  <button
                    onClick={() => toggleEditMode('name')}
                    className="text-blue-500 hover:text-blue-700"
                    title={editableFields.name ? "Save" : "Edit name"}
                  >
                    {editableFields.name ? <FaCheck size={14} /> : <FaEdit size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <div className="flex items-center">
                  {editableFields.email ? (
                    <input
                      type="email"
                      value={parsedData.email || ''}
                      onChange={(e) => handleEditField('email', e.target.value)}
                      className="font-medium border border-blue-300 rounded-md px-2 py-1 mr-2 flex-grow"
                      autoFocus
                    />
                  ) : (
                    <p className="font-medium mr-2">{parsedData.email || 'Not detected'}</p>
                  )}
                  <button
                    onClick={() => toggleEditMode('email')}
                    className="text-blue-500 hover:text-blue-700"
                    title={editableFields.email ? "Save" : "Edit email"}
                  >
                    {editableFields.email ? <FaCheck size={14} /> : <FaEdit size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <div className="flex items-center">
                  {editableFields.phone ? (
                    <input
                      type="text"
                      value={parsedData.phone || ''}
                      onChange={(e) => handleEditField('phone', e.target.value)}
                      className="font-medium border border-blue-300 rounded-md px-2 py-1 mr-2 flex-grow"
                      autoFocus
                    />
                  ) : (
                    <p className="font-medium mr-2">{parsedData.phone || 'Not detected'}</p>
                  )}
                  <button
                    onClick={() => toggleEditMode('phone')}
                    className="text-blue-500 hover:text-blue-700"
                    title={editableFields.phone ? "Save" : "Edit phone"}
                  >
                    {editableFields.phone ? <FaCheck size={14} /> : <FaEdit size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border rounded-md p-4 mb-4">
            <h4 className="text-md font-medium text-gray-800 mb-2">Skills</h4>
            {parsedData.skills && parsedData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.map((skill: string, index: number) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No skills detected</p>
            )}
          </div>
          
          <div className="bg-gray-50 border rounded-md p-4 mb-4">
            <h4 className="text-md font-medium text-gray-800 mb-2">Education</h4>
            {parsedData.education && parsedData.education.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {parsedData.education.map((edu: any, index: number) => (
                  <div key={index} className="py-3">
                    <p className="font-medium">{edu.description || 'Degree not specified'}</p>
                    <p className="text-sm">{edu.institution || 'Institution not specified'}</p>
                    <p className="text-xs text-gray-500">{edu.date || 'Date not specified'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No education history detected</p>
            )}
          </div>
          
          <div className="bg-gray-50 border rounded-md p-4 mb-4">
            <h4 className="text-md font-medium text-gray-800 mb-2">Experience</h4>
            {parsedData.experience && parsedData.experience.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {parsedData.experience.map((exp: any, index: number) => (
                  <div key={index} className="py-3">
                    <p className="font-medium">{exp.position || 'Title not specified'}</p>
                    <p className="text-sm">{exp.company || 'Company not specified'}</p>
                    <p className="text-xs text-gray-500">{exp.date || 'Date not specified'}</p>
                    <p className="text-sm mt-1">{exp.description || 'No description available'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No work experience detected</p>
            )}
          </div>
          
          <div className="bg-gray-50 border rounded-md p-4">
            <h4 className="text-md font-medium text-gray-800 mb-2">Raw JSON Data</h4>
            <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto max-h-96">
              <pre className="text-xs sm:text-sm whitespace-pre-wrap">{JSON.stringify(parsedData, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUploader; 