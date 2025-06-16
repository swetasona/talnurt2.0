import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaArrowLeft, FaUser, FaFileAlt, FaEnvelope, FaPhone, FaGraduationCap, FaBriefcase, FaCheck, FaTimes, FaCommentAlt } from 'react-icons/fa';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Define interfaces for type safety
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience?: string;
  education?: string;
  resumeUrl?: string;
  status: string;
  createdAt: string;
  submittedBy: {
    id: string;
    name: string;
    email: string;
  };
  notes?: string;
  profileAllocationId: string;
}

interface ProfileAllocation {
  id: string;
  jobTitle: string;
}

const CandidateDetailPage: React.FC = () => {
  const router = useRouter();
  const { id, employeeId, candidateId } = router.query;
  const { data: session } = useSession();
  
  // State
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [profileAllocation, setProfileAllocation] = useState<ProfileAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch candidate data
  useEffect(() => {
    if (candidateId && session?.user?.id) {
      fetchCandidateData();
    }
  }, [candidateId, session]);
  
  const fetchCandidateData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch candidate details
      const candidateResponse = await fetch(`/api/recruiter/employer/candidates/${candidateId}`);
      if (!candidateResponse.ok) {
        throw new Error('Failed to fetch candidate details');
      }
      const candidateData = await candidateResponse.json();
      setCandidate(candidateData);
      
      // Fetch profile allocation details
      const allocationResponse = await fetch(`/api/recruiter/employer/profile-allocations/${id}`);
      if (!allocationResponse.ok) {
        throw new Error('Failed to fetch profile allocation details');
      }
      const allocationData = await allocationResponse.json();
      setProfileAllocation(allocationData);
    } catch (err: any) {
      console.error('Error fetching candidate data:', err);
      setError(err.message || 'An error occurred while fetching candidate data');
      toast.error('Failed to load candidate data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Handle candidate status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!candidate) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/recruiter/employer/candidates/${candidateId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          feedback: feedback.trim() || undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update candidate status');
      }
      
      // Update local state
      setCandidate(prev => prev ? { ...prev, status: newStatus } : null);
      
      toast.success(`Candidate ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`);
      
      // Go back to candidates list after a short delay
      setTimeout(() => {
        router.push(`/recruiter/employer/profile-management/candidates/${id}/employee/${employeeId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error updating candidate status:', err);
      toast.error(err.message || 'Failed to update candidate status');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (error || !candidate || !profileAllocation) {
    return (
      <RecruiterLayout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || 'Failed to load candidate data'}</p>
              </div>
              <div className="mt-4">
                <Link href={`/recruiter/employer/profile-management/candidates/${id}/employee/${employeeId}`} className="text-sm font-medium text-red-800 hover:text-red-900">
                  &larr; Go back to candidates list
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="space-y-6">
        {/* Back button */}
        <div className="mb-6">
          <Link href={`/recruiter/employer/profile-management/candidates/${id}/employee/${employeeId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <FaArrowLeft className="mr-2" /> Back to Candidates List
          </Link>
        </div>
        
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">{candidate.name}</h1>
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(candidate.status)}`}>
                  {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                </span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  Applied for: <span className="font-medium">{profileAllocation.jobTitle}</span>
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-gray-600">
              Submitted on: {formatDate(candidate.createdAt)}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidate Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h2 className="text-lg font-bold mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <FaUser className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{candidate.name}</p>
                    <p className="text-sm text-gray-600">Candidate</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <FaEnvelope className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm">{candidate.email}</p>
                  </div>
                </div>
                
                {candidate.phone && (
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FaPhone className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm">{candidate.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h2 className="text-lg font-bold mb-4">Skills</h2>
              
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            {(candidate.experience || candidate.education) && (
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h2 className="text-lg font-bold mb-4">Background</h2>
                
                {candidate.experience && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <FaBriefcase className="text-gray-600 mr-2" />
                      <h3 className="font-medium">Experience</h3>
                    </div>
                    <p className="text-gray-700 pl-7">{candidate.experience}</p>
                  </div>
                )}
                
                {candidate.education && (
                  <div>
                    <div className="flex items-center mb-2">
                      <FaGraduationCap className="text-gray-600 mr-2" />
                      <h3 className="font-medium">Education</h3>
                    </div>
                    <p className="text-gray-700 pl-7">{candidate.education}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h2 className="text-lg font-bold mb-4">Submitted By</h2>
              
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <FaUser className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{candidate.submittedBy.name}</p>
                  <p className="text-sm text-gray-600">{candidate.submittedBy.email}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resume and Decision */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resume Viewer */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center">
                  <FaFileAlt className="mr-2 text-blue-600" /> Resume
                </h2>
                
                {candidate.resumeUrl && (
                  <a 
                    href={candidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                  >
                    Open in New Tab
                  </a>
                )}
              </div>
              
              <div className="h-[500px] w-full">
                {candidate.resumeUrl ? (
                  <iframe 
                    src={candidate.resumeUrl} 
                    className="w-full h-full"
                    title={`${candidate.name}'s resume`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-600">No resume available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notes Section */}
            {candidate.notes && (
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <FaCommentAlt className="mr-2 text-blue-600" /> Recruiter Notes
                </h2>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-line">{candidate.notes}</p>
                </div>
              </div>
            )}
            
            {/* Decision Section */}
            {candidate.status === 'pending' && (
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h2 className="text-lg font-bold mb-4">Make a Decision</h2>
                
                <div className="mb-4">
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback (optional)
                  </label>
                  <textarea
                    id="feedback"
                    rows={4}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="Add your feedback or notes about this candidate..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-red-300 bg-white text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <FaTimes className="mr-2" /> Reject Candidate
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <FaCheck className="mr-2" /> Approve Candidate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default CandidateDetailPage; 