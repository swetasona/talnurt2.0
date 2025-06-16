import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaArrowLeft, FaUser, FaBriefcase, FaMapMarkerAlt, FaUsers, FaCalendarAlt, FaUserCheck, FaUserPlus } from 'react-icons/fa';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SessionRefreshButton from '@/components/SessionRefreshButton';

// Define interfaces for type safety
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
  createdById: string;
  createdBy?: {
    name: string;
    email: string;
  };
  allocatedEmployees: ProfileAllocationEmployee[];
}

interface ProfileAllocationEmployee {
  id: string;
  profileAllocationId: string;
  employeeId: string;
  status: string;
  notifiedAt: string;
  responseAt?: string;
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const ProfileAllocationDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  
  // State
  const [allocation, setAllocation] = useState<ProfileAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch profile allocation details
  useEffect(() => {
    if (id && session?.user?.id) {
      fetchAllocationDetails();
    }
  }, [id, session]);
  
  const fetchAllocationDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/recruiter/employer/profile-allocations/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile allocation details');
      }
      
      const data = await response.json();
      setAllocation(data);
    } catch (err: any) {
      console.error('Error fetching profile allocation details:', err);
      setError(err.message || 'An error occurred while fetching the profile allocation details');
      toast.error('Failed to load profile allocation details');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
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
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle employee click to view candidates
  const handleEmployeeClick = (employeeId: string) => {
    router.push(`/recruiter/employer/profile-management/candidates/${id}/employee/${employeeId}`);
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

  if (error || !allocation) {
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
                <p>{error || 'Failed to load profile allocation details'}</p>
                {error && error.includes('Access denied') && (
                  <p className="mt-2">
                    This could be due to a company ID mismatch. Try refreshing your session.
                  </p>
                )}
              </div>
              <div className="mt-4 flex space-x-4 items-center">
                <Link href="/recruiter/employer/profile-management/candidates" className="text-sm font-medium text-red-800 hover:text-red-900">
                  &larr; Go back to profile allocations
                </Link>
                {error && error.includes('Access denied') && <SessionRefreshButton />}
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
          <Link href="/recruiter/employer/profile-management/candidates" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <FaArrowLeft className="mr-2" /> Back to Profile Allocations
          </Link>
        </div>
        
        {/* Profile Allocation Details */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{allocation.jobTitle}</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-700"><FaMapMarkerAlt className="inline mr-2" /> Location: {allocation.location || 'Not specified'}</p>
              <p className="text-gray-700"><FaBriefcase className="inline mr-2" /> Experience: {allocation.experience || 'Not specified'}</p>
              <p className="text-gray-700"><FaUsers className="inline mr-2" /> Job Type: {allocation.jobType}</p>
            </div>
            <div>
              <p className="text-gray-700">Remote Status: {allocation.remoteStatus}</p>
              <p className="text-gray-700">Priority: <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadgeColor(allocation.priority)}`}>{allocation.priority}</span></p>
              {allocation.deadline && <p className="text-gray-700"><FaCalendarAlt className="inline mr-2" /> Deadline: {formatDate(allocation.deadline)}</p>}
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Job Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{allocation.jobDescription}</p>
          </div>
          <div className="text-sm text-gray-500">
            <p>Created by: {allocation.createdBy?.name || 'Unknown'}</p>
            <p>Created at: {formatDate(allocation.createdAt)}</p>
          </div>
        </div>
        
        {/* Allocated Employees Section */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-6">Allocated Employees/Managers</h2>
          
          {allocation.allocatedEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No employees or managers have been allocated to this profile yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allocation.allocatedEmployees.map((ae) => (
                <div 
                  key={ae.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleEmployeeClick(ae.employee.id)}
                >
                  <div className="flex items-center mb-2">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FaUser className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{ae.employee.name}</h3>
                      <p className="text-gray-600 text-sm">{ae.employee.email}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {ae.employee.role && ae.employee.role.charAt(0).toUpperCase() + ae.employee.role.slice(1) || 'Employee'}
                    </span>
                    <div className="flex items-center text-blue-600 text-sm">
                      <FaUserCheck className="mr-1" /> 
                      <span>View Candidates</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default ProfileAllocationDetailPage; 