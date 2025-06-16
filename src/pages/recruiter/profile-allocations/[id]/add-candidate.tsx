import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaArrowLeft, FaUpload } from 'react-icons/fa';
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

const AddCandidatePage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [allocation, setAllocation] = useState<ProfileAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Fetch profile allocation details
  useEffect(() => {
    if (!id) return;
    
    const fetchAllocationDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/recruiter/profile-allocations/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          setAllocation(data.allocation);
          
          // Pre-fill position applied with job title
          if (data.allocation && data.allocation.jobTitle) {
            setFormData(prev => ({
              ...prev,
              positionApplied: data.allocation.jobTitle
            }));
          }
        } else {
          toast.error('Failed to load profile allocation details');
        }
      } catch (error) {
        console.error('Error fetching allocation details:', error);
        toast.error('Error loading allocation details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllocationDetails();
  }, [id]);

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
      // Create FormData object for multipart/form-data submission
      const formDataToSend = new FormData();
      
      // Append all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });
      
      // Append the profile allocation ID
      formDataToSend.append('profileAllocationId', id as string);
      
      // Append resume file if available
      if (resumeFile) {
        console.log('Appending resume file:', resumeFile.name);
        formDataToSend.append('resume', resumeFile);
      }
      
      console.log('Sending form data with resume file:', resumeFile ? 'Yes' : 'No');
      
      // Use the add-simple API endpoint with FormData
      const response = await fetch('/api/recruiter/candidates/add-simple', {
        method: 'POST',
        body: formDataToSend, // No Content-Type header for FormData
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        console.log('Candidate added successfully:', responseData);
        toast.success('Candidate added successfully');
        // Redirect back to profile allocation page
        router.push(`/recruiter/profile-allocations/${id}`);
      } else {
        console.error('Failed to add candidate:', responseData);
        toast.error(responseData.error || 'Failed to add candidate');
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast.error('Error adding candidate');
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
            <h1 className="text-2xl font-bold">Add New Candidate</h1>
          </div>
        </div>
        
        {allocation && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="font-medium">Adding candidate for: {allocation.jobTitle}</p>
            <p className="text-sm text-gray-600">
              {allocation.jobType} • {allocation.location || 'No location specified'} • 
              {allocation.remoteStatus === 'remote' ? 'Remote' : allocation.remoteStatus === 'hybrid' ? 'Hybrid' : 'On-site'}
            </p>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Fill the Candidate Details</h2>
          
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
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
                  <span className="ml-3 text-sm text-gray-500">
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
                {isSubmitting ? 'Adding...' : 'Add Candidate'}
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

export default AddCandidatePage;
