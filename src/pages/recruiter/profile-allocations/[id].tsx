import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaUserPlus, FaFileAlt, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBriefcase, FaGraduationCap, FaUsers, FaTimes, FaArrowLeft, FaEdit, FaTrash, FaUser } from 'react-icons/fa';
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
  skills: string[];
  experience?: string;
  education?: string;
  resume?: string;
  status: string;
  createdAt: string;
  profileAllocationId: string;
}

const ProfileAllocationDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [allocation, setAllocation] = useState<ProfileAllocation | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    
    const fetchCandidates = async () => {
      try {
        const response = await fetch(`/api/recruiter/profile-allocations/${id}/candidates`);
        
        if (response.ok) {
          const data = await response.json();
          setCandidates(data.candidates || []);
        } else {
          console.error('Failed to fetch candidates');
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };
    
    fetchAllocationDetails();
    fetchCandidates();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recruiter/candidates/${candidateId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Candidate deleted successfully');
        // Update the candidates list
        setCandidates(candidates.filter(candidate => candidate.id !== candidateId));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete candidate');
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast.error('Error deleting candidate');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(null);
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
        {/* Back button */}
        <div className="mb-6">
          <Link href="/recruiter/profile-allocations" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <FaArrowLeft className="mr-2" /> Back to Profile Allocations
          </Link>
        </div>
        
        {/* Profile Allocation Details */}
        {allocation && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h1 className="text-2xl font-bold mb-4">{allocation.jobTitle}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-700"><FaMapMarkerAlt className="inline mr-2" /> Location: {allocation.location || 'Not specified'}</p>
                <p className="text-gray-700"><FaBriefcase className="inline mr-2" /> Experience: {allocation.experience || 'Not specified'}</p>
                <p className="text-gray-700"><FaUsers className="inline mr-2" /> Job Type: {allocation.jobType}</p>
              </div>
              <div>
                <p className="text-gray-700">Remote Status: {allocation.remoteStatus}</p>
                <p className="text-gray-700">Priority: <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadgeColor(allocation.priority)}`}>{allocation.priority}</span></p>
                {allocation.deadline && <p className="text-gray-700">Deadline: {formatDate(allocation.deadline)}</p>}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Job Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{allocation.jobDescription}</p>
            </div>
            <div className="text-sm text-gray-500">
              <p>Created by: {allocation.createdBy.name}</p>
              <p>Created at: {formatDate(allocation.createdAt)}</p>
            </div>
          </div>
        )}
        
        {/* Candidates Section */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Candidates</h2>
            <Link 
              href={`/recruiter/profile-allocations/${id}/add-candidate`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <FaUserPlus className="mr-2" /> Add Candidate
            </Link>
          </div>
          
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No candidates added yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted On
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidates.map(candidate => (
                    <tr key={candidate.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaUser className="text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                            {candidate.phone && <div className="text-sm text-gray-500">{candidate.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {candidate.skills && candidate.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.slice(0, 3).map((skill, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  +{candidate.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">No skills listed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{candidate.experience || 'Not specified'}</div>
                        <div className="text-sm text-gray-500">{candidate.education || 'Education not specified'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(candidate.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(candidate.status)}`}>
                          {candidate.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          {candidate.resume && (
                            <a
                              href={candidate.resume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                              title="View Resume"
                            >
                              <FaFileAlt />
                            </a>
                          )}
                          <div className="flex space-x-2">
                            {/* Only show edit button if status is pending */}
                            {(!candidate.status || candidate.status === 'pending') && (
                              <Link 
                                href={`/recruiter/profile-allocations/${id}/edit-candidate/${candidate.id}`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Candidate"
                              >
                                <FaEdit />
                              </Link>
                            )}
                            <button
                              onClick={() => setDeleteConfirmation(candidate.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Candidate"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        {/* Delete Confirmation Dialog */}
                        {deleteConfirmation === candidate.id && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-xs text-red-800 mb-2">Are you sure you want to delete this candidate?</p>
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-2 py-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                                disabled={isDeleting}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteCandidate(candidate.id)}
                                className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RecruiterLayout>
  );
};

function getPriorityBadgeColor(priority: string) {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusBadgeColor(status: string) {
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
}

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

export default ProfileAllocationDetailPage; 