import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaArrowLeft, FaUpload, FaFilePdf } from 'react-icons/fa';
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
}

// Define interface for additional data from feedback
interface AdditionalCandidateData {
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
}

const EditCandidatePage = () => {
  const router = useRouter();
  const { id, candidateId } = router.query;
  
  const [allocation, setAllocation] = useState<ProfileAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state with all the required fields
  const [formData, setFormData] = useState({
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

  // Fetch candidate and profile allocation details
  useEffect(() => {
    if (!id || !candidateId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch profile allocation
        const allocationResponse = await fetch(`/api/recruiter/profile-allocations/${id}`);
        
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
        
        // Store the resume URL if available
        if (candidateData.resumeUrl || candidateData.resume_url) {
          const resumeUrl = candidateData.resumeUrl || candidateData.resume_url;
          console.log('Found resume URL:', resumeUrl);
          setExistingResumeUrl(resumeUrl);
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
        
        // Map candidate data to form fields - now using direct properties that were added at the top level
        const newFormData = {
          fullName: candidateData.name || '',
          email: candidateData.email || '',
          phone: candidateData.phone || '',
          companyName: candidateData.companyName || '',
          dateOfBirth: candidateData.dateOfBirth || '',
          clientName: candidateData.clientName || '',
          positionApplied: candidateData.positionApplied || '',
          totalExperience: candidateData.totalExperience || '',
          relevantExperience: candidateData.relevantExperience || '',
          currentOrganization: candidateData.currentOrganization || '',
          currentDesignation: candidateData.currentDesignation || '',
          duration: candidateData.duration || '',
          reasonOfLeaving: candidateData.reasonOfLeaving || '',
          reportingTo: candidateData.reportingTo || '',
          numberOfDirectReportees: candidateData.numberOfDirectReportees || '',
          currentSalary: candidateData.currentSalary || '',
          expectedSalary: candidateData.expectedSalary || '',
          education: candidateData.education || '',
          maritalStatus: candidateData.maritalStatus || 'Select',
          passportAvailable: candidateData.passportAvailable || 'Select',
          currentLocation: candidateData.currentLocation || '',
          medicalIssues: candidateData.medicalIssues || '',
          skills: skillsString,
        };
        
        console.log('Setting form data to:', newFormData);
        setFormData(newFormData);
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
        router.push(`/recruiter/profile-allocations/${id}`);
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
            <Link href={`/recruiter/profile-allocations/${id}`} className="mr-4 text-blue-600 hover:text-blue-800">
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
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Edit Candidate Details</h2>
          
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
                
                {existingResumeUrl && (
                  <div className="mb-2 flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Current resume:</span>
                    <a 
                      href={existingResumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <FaFilePdf className="mr-1" /> View Resume
                    </a>
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
            
            <div className="flex justify-end space-x-3 mt-6">
              <Link
                href={`/recruiter/profile-allocations/${id}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
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
  
  return {
    props: { session },
  };
};

export default EditCandidatePage; 