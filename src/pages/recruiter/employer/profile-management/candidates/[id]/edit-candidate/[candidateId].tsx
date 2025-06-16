import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaArrowLeft, FaUpload, FaFilePdf, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ProfileAllocation {
  id: string;
  jobTitle: string;
  jobDescription: string;
  location?: string;
  experience?: string;
  remoteStatus: string;
  jobType: string;
  priority: string;
  deadline?: string;
  status: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  dateOfBirth?: string;
  clientName?: string;
  positionApplied?: string;
  totalExperience?: string;
  relevantExperience?: string;
  currentOrganization?: string;
  currentDesignation?: string;
  duration?: string;
  reasonOfLeaving?: string;
  reportingTo?: string;
  numberOfDirectReportees?: string;
  currentSalary?: string;
  expectedSalary?: string;
  education?: string;
  maritalStatus?: string;
  passportAvailable?: string;
  currentLocation?: string;
  medicalIssues?: string;
  skills: string[];
  resumeUrl?: string;
  status: string;
  createdAt: string;
  profileAllocationId: string;
  feedbackData?: any;
}

// Define interface for additional data from feedback
interface FeedbackData {
  companyName?: string;
  dateOfBirth?: string;
  clientName?: string;
  positionApplied?: string;
  totalExperience?: string;
  relevantExperience?: string;
  currentOrganization?: string;
  currentDesignation?: string;
  duration?: string;
  reasonOfLeaving?: string;
  reportingTo?: string;
  numberOfDirectReportees?: string;
  currentSalary?: string;
  expectedSalary?: string;
  education?: string;
  maritalStatus?: string;
  passportAvailable?: string;
  currentLocation?: string;
  medicalIssues?: string;
  [key: string]: any; // Allow for additional fields
}

// Define the interface for form data
interface FormData {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  dateOfBirth: string;
  clientName: string;
  positionApplied: string;
  totalExperience: string;
  relevantExperience: string;
  currentOrganization: string;
  currentDesignation: string;
  duration: string;
  reasonOfLeaving: string;
  reportingTo: string;
  numberOfDirectReportees: string;
  currentSalary: string;
  expectedSalary: string;
  education: string;
  maritalStatus: string;
  passportAvailable: string;
  currentLocation: string;
  medicalIssues: string;
  skills: string;
}

const EditCandidatePage = () => {
  const router = useRouter();
  const { id, candidateId } = router.query;
  
  const [allocation, setAllocation] = useState<ProfileAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  
  // Form state with all the required fields
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    dateOfBirth: '',
    clientName: '',
    positionApplied: '',
    totalExperience: '',
    relevantExperience: '',
    currentOrganization: '',
    currentDesignation: '',
    duration: '',
    reasonOfLeaving: '',
    reportingTo: '',
    numberOfDirectReportees: '',
    currentSalary: '',
    expectedSalary: '',
    education: '',
    maritalStatus: 'Select',
    passportAvailable: 'Select',
    currentLocation: '',
    medicalIssues: '',
    skills: '',
  });
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);

  // Debug function to fetch raw database data
  const fetchDebugData = async () => {
    if (!candidateId) return;
    
    try {
      const response = await fetch(`/api/recruiter/debug-candidate?candidateId=${candidateId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('DEBUG - Raw database data:', data);
        
        // Try to extract and use the feedback data directly
        if (data.feedbackData) {
          const debugFormData = {
            ...formData,
            companyName: data.feedbackData.companyName || formData.companyName,
            dateOfBirth: data.feedbackData.dateOfBirth || formData.dateOfBirth,
            clientName: data.feedbackData.clientName || formData.clientName,
            positionApplied: data.feedbackData.positionApplied || formData.positionApplied,
            totalExperience: data.feedbackData.totalExperience || formData.totalExperience,
            relevantExperience: data.feedbackData.relevantExperience || formData.relevantExperience,
            currentOrganization: data.feedbackData.currentOrganization || formData.currentOrganization,
            currentDesignation: data.feedbackData.currentDesignation || formData.currentDesignation,
            duration: data.feedbackData.duration || formData.duration,
            reasonOfLeaving: data.feedbackData.reasonOfLeaving || formData.reasonOfLeaving,
            reportingTo: data.feedbackData.reportingTo || formData.reportingTo,
            numberOfDirectReportees: data.feedbackData.numberOfDirectReportees || formData.numberOfDirectReportees,
            currentSalary: data.feedbackData.currentSalary || formData.currentSalary,
            expectedSalary: data.feedbackData.expectedSalary || formData.expectedSalary,
            education: data.feedbackData.education || formData.education,
            maritalStatus: data.feedbackData.maritalStatus || formData.maritalStatus,
            passportAvailable: data.feedbackData.passportAvailable || formData.passportAvailable,
            currentLocation: data.feedbackData.currentLocation || formData.currentLocation,
            medicalIssues: data.feedbackData.medicalIssues || formData.medicalIssues,
          };
          
          console.log('Setting form data from debug endpoint:', debugFormData);
          setFormData(debugFormData);
          toast.success('Form data updated from debug endpoint');
        }
      }
    } catch (error) {
      console.error('Error fetching debug data:', error);
    }
  };
  
  // Function to fix the feedback data in the database
  const fixFeedbackData = async () => {
    if (!candidateId) return;
    
    try {
      // Create a clean feedback object with all the current form values
      const feedbackData = {
        companyName: formData.companyName,
        dateOfBirth: formData.dateOfBirth,
        clientName: formData.clientName,
        positionApplied: formData.positionApplied,
        totalExperience: formData.totalExperience,
        relevantExperience: formData.relevantExperience,
        currentOrganization: formData.currentOrganization,
        currentDesignation: formData.currentDesignation,
        duration: formData.duration,
        reasonOfLeaving: formData.reasonOfLeaving,
        reportingTo: formData.reportingTo,
        numberOfDirectReportees: formData.numberOfDirectReportees,
        currentSalary: formData.currentSalary,
        expectedSalary: formData.expectedSalary,
        education: formData.education,
        maritalStatus: formData.maritalStatus,
        passportAvailable: formData.passportAvailable,
        currentLocation: formData.currentLocation,
        medicalIssues: formData.medicalIssues,
      };
      
      // Send the feedback data to the debug endpoint to update the database
      const response = await fetch(`/api/recruiter/debug-candidate?candidateId=${candidateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback: feedbackData }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Feedback data fixed:', result);
        toast.success('Feedback data fixed in database');
        
        // Reload the page to show the updated data
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('Error fixing feedback data:', error);
        toast.error('Failed to fix feedback data');
      }
    } catch (error) {
      console.error('Error fixing feedback data:', error);
      toast.error('Error fixing feedback data');
    }
  };

  // Fetch candidate and profile allocation details
  useEffect(() => {
    if (!id || !candidateId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch profile allocation
        const allocationResponse = await fetch(`/api/recruiter/employer/profile-allocations/${id}`);
        
        if (!allocationResponse.ok) {
          throw new Error('Failed to fetch profile allocation');
        }
        
        const allocationData = await allocationResponse.json();
        setAllocation(allocationData);
        
        // Fetch candidate data
        const candidateResponse = await fetch(`/api/recruiter/candidates/${candidateId}`);
        
        if (!candidateResponse.ok) {
          throw new Error('Failed to fetch candidate data');
        }
        
        const candidateData = await candidateResponse.json();
        console.log('Candidate data received:', candidateData);
        
        // Save the raw API response for debugging
        setRawApiResponse(candidateData);
        
        // Log key fields to verify they're being received
        console.log('Key fields from API response:', {
          name: candidateData.name,
          email: candidateData.email,
          companyName: candidateData.companyName,
          dateOfBirth: candidateData.dateOfBirth,
          clientName: candidateData.clientName,
          totalExperience: candidateData.totalExperience,
          currentOrganization: candidateData.currentOrganization
        });
        
        // Store the resume URL if available
        if (candidateData.resumeUrl || candidateData.resume_url) {
          const resumeUrl = candidateData.resumeUrl || candidateData.resume_url;
          console.log('Found resume URL in response:', resumeUrl);
          
          // Make sure the URL is properly formatted
          if (resumeUrl && !resumeUrl.startsWith('http')) {
            // If it's a relative URL, make it absolute
            const baseUrl = window.location.origin;
            const absoluteUrl = `${baseUrl}${resumeUrl.startsWith('/') ? resumeUrl : `/${resumeUrl}`}`;
            console.log('Converted to absolute URL:', absoluteUrl);
            setExistingResumeUrl(absoluteUrl);
          } else {
            setExistingResumeUrl(resumeUrl);
          }
        } else {
          console.log('No resume URL found in candidate data');
        }
        
        // Process skills - ensure we handle both string and array formats
        let skillsString = '';
        if (candidateData.skills) {
          if (Array.isArray(candidateData.skills)) {
            skillsString = candidateData.skills.join(', ');
          } else if (typeof candidateData.skills === 'string') {
            // If it's already a string, use it directly
            skillsString = candidateData.skills;
          } else if (typeof candidateData.skills === 'object') {
            // If it's an object, convert values to a string
            skillsString = Object.values(candidateData.skills).join(', ');
          }
        }
        console.log('Processed skills string:', skillsString);
        
        // Get feedback data from various possible locations
        let feedbackData: FeedbackData = {};
        
        // 1. Try the dedicated feedbackData field first (our new approach)
        if (candidateData.feedbackData) {
          feedbackData = candidateData.feedbackData;
          console.log('Using feedbackData field:', feedbackData);
        }
        // 2. Then try the recruiterCandidate.feedback field
        else if (candidateData.recruiterCandidate?.feedback) {
          try {
            if (typeof candidateData.recruiterCandidate.feedback === 'string') {
              feedbackData = JSON.parse(candidateData.recruiterCandidate.feedback);
              console.log('Parsed feedback from recruiterCandidate:', feedbackData);
            } else if (typeof candidateData.recruiterCandidate.feedback === 'object') {
              feedbackData = candidateData.recruiterCandidate.feedback;
              console.log('Using object feedback from recruiterCandidate');
            }
          } catch (e) {
            console.error('Error parsing feedback:', e);
          }
        }
        
        console.log('Final feedback data:', feedbackData);
        
        // Map candidate data to form fields with multiple fallback options
        const newFormData = {
          fullName: candidateData.name || '',
          email: candidateData.email || '',
          phone: candidateData.phone || '',
          // Try direct properties first, then feedback data
          companyName: candidateData.companyName || feedbackData.companyName || '',
          dateOfBirth: candidateData.dateOfBirth || feedbackData.dateOfBirth || '',
          clientName: candidateData.clientName || feedbackData.clientName || '',
          positionApplied: candidateData.positionApplied || feedbackData.positionApplied || '',
          totalExperience: candidateData.totalExperience || feedbackData.totalExperience || '',
          relevantExperience: candidateData.relevantExperience || feedbackData.relevantExperience || '',
          currentOrganization: candidateData.currentOrganization || feedbackData.currentOrganization || '',
          currentDesignation: candidateData.currentDesignation || feedbackData.currentDesignation || '',
          duration: candidateData.duration || feedbackData.duration || '',
          reasonOfLeaving: candidateData.reasonOfLeaving || feedbackData.reasonOfLeaving || '',
          reportingTo: candidateData.reportingTo || feedbackData.reportingTo || '',
          numberOfDirectReportees: candidateData.numberOfDirectReportees || feedbackData.numberOfDirectReportees || '',
          currentSalary: candidateData.currentSalary || feedbackData.currentSalary || '',
          expectedSalary: candidateData.expectedSalary || feedbackData.expectedSalary || '',
          education: candidateData.education || feedbackData.education || '',
          maritalStatus: candidateData.maritalStatus || feedbackData.maritalStatus || 'Select',
          passportAvailable: candidateData.passportAvailable || feedbackData.passportAvailable || 'Select',
          currentLocation: candidateData.currentLocation || feedbackData.currentLocation || '',
          medicalIssues: candidateData.medicalIssues || feedbackData.medicalIssues || '',
          skills: skillsString,
        };
        
        console.log('Setting form data to:', newFormData);
        setFormData(newFormData);
        
        // Auto-fix feedback data if it's missing
        const autoFixFeedbackData = async () => {
          try {
            // Check if feedback data exists
            const debugResponse = await fetch(`/api/recruiter/debug-candidate?candidateId=${candidateId}`);
            if (debugResponse.ok) {
              const debugData = await debugResponse.json();
              console.log('Checking feedback data:', debugData);
              
              // If feedback is missing or empty, fix it automatically
              if (!debugData.rawFeedback || debugData.rawFeedback === '{}' || !Object.keys(debugData.feedbackData || {}).length) {
                console.log('Feedback data is missing or empty, auto-fixing...');
                
                // Create feedback data from form values
                const feedbackData = {
                  companyName: newFormData.companyName,
                  dateOfBirth: newFormData.dateOfBirth,
                  clientName: newFormData.clientName,
                  positionApplied: newFormData.positionApplied,
                  totalExperience: newFormData.totalExperience,
                  relevantExperience: newFormData.relevantExperience,
                  currentOrganization: newFormData.currentOrganization,
                  currentDesignation: newFormData.currentDesignation,
                  duration: newFormData.duration,
                  reasonOfLeaving: newFormData.reasonOfLeaving,
                  reportingTo: newFormData.reportingTo,
                  numberOfDirectReportees: newFormData.numberOfDirectReportees,
                  currentSalary: newFormData.currentSalary,
                  expectedSalary: newFormData.expectedSalary,
                  education: newFormData.education,
                  maritalStatus: newFormData.maritalStatus,
                  passportAvailable: newFormData.passportAvailable,
                  currentLocation: newFormData.currentLocation,
                  medicalIssues: newFormData.medicalIssues,
                };
                
                // Update the feedback data
                const fixResponse = await fetch(`/api/recruiter/debug-candidate?candidateId=${candidateId}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ feedback: feedbackData }),
                });
                
                if (fixResponse.ok) {
                  console.log('Feedback data auto-fixed successfully');
                  toast.success('Feedback data auto-fixed');
                }
              }
            }
          } catch (error) {
            console.error('Error auto-fixing feedback data:', error);
          }
        };
        
        // Run the auto-fix function
        autoFixFeedbackData();
      } catch (error) {
        console.error('Error fetching details:', error);
        setError('Failed to load details');
        toast.error('Error loading candidate details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, candidateId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email) {
      toast.error('Full name and email are required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });
      
      formDataToSend.append('profileAllocationId', id as string);
      
      if (resumeFile) {
        formDataToSend.append('resume', resumeFile);
      }
      
      const response = await fetch(`/api/recruiter/candidates/${candidateId}`, {
        method: 'PUT',
        body: formDataToSend,
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        toast.success('Candidate updated successfully');
        // Redirect back to profile allocation page
        router.push(`/recruiter/employer/profile-management/candidates/${id}/employee/${responseData.recruiterCandidate.recruiter_id}`);
      } else {
        console.error('Failed to update candidate:', responseData);
        toast.error(responseData.error || 'Failed to update candidate');
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast.error('Error updating candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href={`/recruiter/employer/profile-management/candidates/${id}`} className="mr-4 text-blue-600 hover:text-blue-800">
              <FaArrowLeft className="inline-block mr-1" /> Back to Profile Allocation
            </Link>
            <h1 className="text-2xl font-bold">Edit Candidate</h1>
          </div>
        </div>
        
        {allocation && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="font-medium">Editing candidate for: {allocation.jobTitle}</p>
            <p className="text-sm text-gray-600">
              {allocation.jobType} • {allocation.location || 'No location specified'} • 
              {allocation.remoteStatus === 'remote' ? 'Remote' : allocation.remoteStatus === 'hybrid' ? 'Hybrid' : 'On-site'}
            </p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Edit Candidate Details</h2>
          
          {/* Debug section - only shown in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-gray-100 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold">Debug Tools</h3>
                <div className="flex space-x-2">
                  <button 
                    type="button"
                    onClick={fetchDebugData}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Fetch Direct from DB
                  </button>
                  <button 
                    type="button"
                    onClick={fixFeedbackData}
                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    Fix This Candidate
                  </button>
                  <button 
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/recruiter/fix-all-feedback', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          }
                        });
                        
                        if (response.ok) {
                          const result = await response.json();
                          console.log('Fix all feedback results:', result);
                          toast.success(`Fixed ${result.results.fixed} candidates out of ${result.results.total}`);
                        } else {
                          const error = await response.json();
                          console.error('Error fixing all feedback:', error);
                          toast.error('Failed to fix all feedback data');
                        }
                      } catch (error) {
                        console.error('Error fixing all feedback:', error);
                        toast.error('Error fixing all feedback data');
                      }
                    }}
                    className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                  >
                    Fix All Candidates
                  </button>
                </div>
              </div>
              
              {rawApiResponse && (
                <>
                  <h4 className="text-sm font-semibold mt-3 mb-1">Form Data Values:</h4>
                  <div className="text-xs overflow-auto max-h-40">
                    <pre>{JSON.stringify({
                      companyName: formData.companyName,
                      dateOfBirth: formData.dateOfBirth,
                      clientName: formData.clientName,
                      totalExperience: formData.totalExperience,
                      currentOrganization: formData.currentOrganization,
                      currentDesignation: formData.currentDesignation
                    }, null, 2)}</pre>
                  </div>
                </>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Position Applied */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position Applied</label>
                <input
                  type="text"
                  name="positionApplied"
                  value={formData.positionApplied}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Total Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Experience (in years)</label>
                <input
                  type="text"
                  name="totalExperience"
                  value={formData.totalExperience}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Relevant Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relevant Experience (in years)</label>
                <input
                  type="text"
                  name="relevantExperience"
                  value={formData.relevantExperience}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Current Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Organization</label>
                <input
                  type="text"
                  name="currentOrganization"
                  value={formData.currentOrganization}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Current Designation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Designation</label>
                <input
                  type="text"
                  name="currentDesignation"
                  value={formData.currentDesignation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Reason of Leaving */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason of Leaving</label>
                <input
                  type="text"
                  name="reasonOfLeaving"
                  value={formData.reasonOfLeaving}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Reporting To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reporting To</label>
                <input
                  type="text"
                  name="reportingTo"
                  value={formData.reportingTo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Number of Direct Reportees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Direct Reportees</label>
                <input
                  type="text"
                  name="numberOfDirectReportees"
                  value={formData.numberOfDirectReportees}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Current Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Salary</label>
                <input
                  type="text"
                  name="currentSalary"
                  value={formData.currentSalary}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Expected Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary</label>
                <input
                  type="text"
                  name="expectedSalary"
                  value={formData.expectedSalary}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Education / Certification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education / Certification</label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Marital Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Select">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              
              {/* Passport Available */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Available?</label>
                <select
                  name="passportAvailable"
                  value={formData.passportAvailable}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Select">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              
              {/* Current Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                <input
                  type="text"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Medical Issues */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Any Medical / Health Related Issues?</label>
                <input
                  type="text"
                  name="medicalIssues"
                  value={formData.medicalIssues}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="e.g. JavaScript, React, Node.js"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Resume Upload */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                
                {existingResumeUrl ? (
                  <div className="mb-2 flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Current resume:</span>
                    <a 
                      href={existingResumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                      onClick={() => console.log('Opening resume URL:', existingResumeUrl)}
                    >
                      <FaFilePdf className="mr-1" /> View Resume
                    </a>
                    <span className="ml-2 text-xs text-gray-500">
                      ({existingResumeUrl.split('/').pop() || 'resume'})
                    </span>
                  </div>
                ) : (
                  <div className="mb-2 text-sm text-yellow-600">
                    <FaExclamationTriangle className="inline mr-1" /> No resume currently attached
                  </div>
                )}
                
                <div className="flex items-center">
                  <label className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-md border border-blue-500 cursor-pointer hover:bg-blue-50">
                    <FaUpload className="mr-2" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />
                  </label>
                  <span className="ml-3 text-sm text-gray-600">
                    {resumeFile ? resumeFile.name : 'No file chosen'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Link 
                href={`/recruiter/employer/profile-management/candidates/${id}`}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  
  // Only allow employer, manager, or employee roles
  if (!['employer', 'manager', 'employee'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      session,
    },
  };
};

export default EditCandidatePage; 