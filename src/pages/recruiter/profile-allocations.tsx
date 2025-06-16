import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaUsers, FaClipboardList, FaCalendarAlt, FaBriefcase, FaMapMarkerAlt, FaDollarSign, FaGraduationCap, FaClock, FaEnvelope, FaBell, FaUserCheck, FaCheck, FaTimes, FaEye, FaExclamationTriangle, FaUser, FaUserPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

interface ProfileAllocation {
  id: string;
  jobTitle: string;
  jobDescription: string;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  education?: string;
  experience?: string;
  skills: string[];
  hiringTimeline?: string;
  location?: string;
  remoteStatus: string;
  jobType: string;
  deadline?: string;
  priority: string;
  notes?: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  employeeStatus?: {
    id: string;
    status: string;
    response?: string;
    responseAt?: string;
    notifiedAt: string;
  };
}

interface ProfileAllocationProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const ProfileAllocationsPage: React.FC<ProfileAllocationProps> = ({ user }) => {
  const router = useRouter();
  const [allocations, setAllocations] = useState<ProfileAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAllocation, setSelectedAllocation] = useState<ProfileAllocation | null>(null);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded' | 'overdue'>('all');

  // Fetch profile allocations
  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const response = await fetch('/api/recruiter/profile-allocations');
        if (response.ok) {
          const data = await response.json();
          setAllocations(data.allocations || []);
        } else {
          console.error('Failed to fetch profile allocations');
          toast.error('Failed to load profile allocations');
        }
      } catch (error) {
        console.error('Error fetching profile allocations:', error);
        toast.error('Error loading profile allocations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllocations();
  }, []);

  const handleResponse = async (allocationId: string, status: 'accepted' | 'declined' | 'needs_clarification') => {
    if (!response.trim() && status !== 'accepted') {
      toast.error('Please provide a response');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const apiResponse = await fetch(`/api/recruiter/profile-allocations/${allocationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          response: response.trim()
        }),
      });

      if (apiResponse.ok) {
        toast.success('Response submitted successfully!');
        setSelectedAllocation(null);
        setResponse('');
        
        // Refresh allocations
        const refreshResponse = await fetch('/api/recruiter/profile-allocations');
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setAllocations(data.allocations || []);
        }
      } else {
        const errorData = await apiResponse.json();
        toast.error(errorData.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Error submitting response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToDetailPage = (allocationId: string) => {
    router.push(`/recruiter/profile-allocations/${allocationId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'declined':
        return 'text-red-600 bg-red-100';
      case 'needs_clarification':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredAllocations = allocations.filter(allocation => {
    if (filter === 'all') return true;
    if (filter === 'pending') return allocation.employeeStatus?.status === 'pending';
    if (filter === 'responded') return allocation.employeeStatus?.status !== 'pending';
    if (filter === 'overdue') return allocation.employeeStatus?.status === 'pending' && isOverdue(allocation.deadline);
    return true;
  });

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
      <Head>
        <title>Profile Allocations | Employee Dashboard</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Allocations</h1>
                <p className="text-gray-600">View and respond to assigned job profiles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({allocations.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({allocations.filter(a => a.employeeStatus?.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('responded')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'responded'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Responded ({allocations.filter(a => a.employeeStatus?.status !== 'pending').length})
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overdue ({allocations.filter(a => a.employeeStatus?.status === 'pending' && isOverdue(a.deadline)).length})
            </button>
          </div>
        </div>

        {/* Allocations List */}
        <div className="space-y-4">
          {filteredAllocations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
              <FaUsers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No profile allocations found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'You have no profile allocations at the moment.'
                  : `No ${filter} profile allocations found.`
                }
              </p>
            </div>
          ) : (
            filteredAllocations.map((allocation) => (
              <div 
                key={allocation.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigateToDetailPage(allocation.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{allocation.jobTitle}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(allocation.employeeStatus?.status || 'pending')}`}>
                          {allocation.employeeStatus?.status?.replace('_', ' ') || 'Pending'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(allocation.priority)}`}>
                          {allocation.priority} priority
                        </span>
                        {isOverdue(allocation.deadline) && allocation.employeeStatus?.status === 'pending' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100 flex items-center">
                            <FaExclamationTriangle className="h-3 w-3 mr-1" />
                            Overdue
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaUser className="h-4 w-4 mr-2" />
                          Assigned by: {allocation.createdBy.name}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FaCalendarAlt className="h-4 w-4 mr-2" />
                          Created: {formatDate(allocation.createdAt)}
                        </div>
                        {allocation.deadline && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FaClock className="h-4 w-4 mr-2" />
                            Deadline: {formatDate(allocation.deadline)}
                          </div>
                        )}
                        {allocation.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                            {allocation.location} ({allocation.remoteStatus})
                          </div>
                        )}
                      </div>

                      {allocation.budgetMin && allocation.budgetMax && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <FaDollarSign className="h-4 w-4 mr-2" />
                          Budget: {allocation.currency} {allocation.budgetMin} - {allocation.budgetMax}
                        </div>
                      )}

                      {allocation.skills && allocation.skills.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Required Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {allocation.skills.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {allocation.employeeStatus?.response && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Your Response:</p>
                          <p className="text-sm text-gray-600">{allocation.employeeStatus.response}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted on {formatDate(allocation.employeeStatus.responseAt!)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToDetailPage(allocation.id);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex items-center"
                      >
                        <FaUserPlus className="h-4 w-4 mr-2" />
                        Manage Candidates
                      </button>
                      {allocation.employeeStatus?.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAllocation(allocation);
                            setResponse('');
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm flex items-center"
                        >
                          <FaCheck className="h-4 w-4 mr-2" />
                          Respond
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAllocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{selectedAllocation.jobTitle}</h2>
                <button
                  onClick={() => setSelectedAllocation(null)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedAllocation.priority)}`}>
                    {selectedAllocation.priority} priority
                  </span>
                  {selectedAllocation.deadline && (
                    <span className="flex items-center text-sm text-gray-600">
                      <FaClock className="h-4 w-4 mr-1" />
                      Deadline: {formatDate(selectedAllocation.deadline)}
                    </span>
                  )}
                </div>
                
                <div className="prose max-w-none mb-6">
                  <h3 className="text-lg font-medium mb-2">Job Description</h3>
                  <p className="whitespace-pre-line">{selectedAllocation.jobDescription}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {selectedAllocation.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                      Location: {selectedAllocation.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <FaBriefcase className="h-4 w-4 mr-2" />
                    Job Type: {selectedAllocation.jobType}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUser className="h-4 w-4 mr-2" />
                    Remote: {selectedAllocation.remoteStatus}
                  </div>
                  {selectedAllocation.experience && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FaBriefcase className="h-4 w-4 mr-2" />
                      Experience: {selectedAllocation.experience}
                    </div>
                  )}
                  {selectedAllocation.education && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FaGraduationCap className="h-4 w-4 mr-2" />
                      Education: {selectedAllocation.education}
                    </div>
                  )}
                </div>

                {selectedAllocation.skills && selectedAllocation.skills.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAllocation.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAllocation.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Additional Notes</h3>
                    <p className="text-gray-700 whitespace-pre-line">{selectedAllocation.notes}</p>
                  </div>
                )}

                <div className="text-sm text-gray-500 mt-6">
                  <p>Created by: {selectedAllocation.createdBy.name} ({selectedAllocation.createdBy.email})</p>
                  <p>Created on: {formatDate(selectedAllocation.createdAt)}</p>
                </div>
              </div>

              {selectedAllocation.employeeStatus?.status === 'pending' && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-4">Your Response</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
                        Comments (optional for accepting, required for other responses)
                      </label>
                      <textarea
                        id="response"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add any comments or questions about this profile allocation..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleResponse(selectedAllocation.id, 'accepted')}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleResponse(selectedAllocation.id, 'declined')}
                        disabled={isSubmitting || !response.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-300"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleResponse(selectedAllocation.id, 'needs_clarification')}
                        disabled={isSubmitting || !response.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                      >
                        Need Clarification
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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

  // Check if user is authorized (employee, manager, or employer)
  if (!['employee', 'manager', 'employer'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
    },
  };
};

export default ProfileAllocationsPage;
