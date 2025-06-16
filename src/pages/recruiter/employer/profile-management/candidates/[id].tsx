import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaArrowLeft, FaUser, FaBriefcase, FaMapMarkerAlt, FaUsers, FaCalendarAlt, FaUserCheck, FaUserPlus, FaTrash, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SessionRefreshButton from '@/components/SessionRefreshButton';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

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

interface CompanyEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ProfileAllocationDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  
  // State
  const [allocation, setAllocation] = useState<ProfileAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for employee assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<CompanyEmployee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  
  // State for employee removal
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState<{id: string, name: string} | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
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
  
  // Fetch available employees for assignment
  const fetchAvailableEmployees = async () => {
    if (!id) return;
    
    try {
      setIsLoadingEmployees(true);
      const response = await fetch(`/api/recruiter/employer/employees/available?profileAllocationId=${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch available employees');
      }
      
      const data = await response.json();
      setAvailableEmployees(data.employees || []);
    } catch (err: any) {
      console.error('Error fetching available employees:', err);
      toast.error('Failed to load available employees');
    } finally {
      setIsLoadingEmployees(false);
    }
  };
  
  // Open assign modal
  const openAssignModal = () => {
    fetchAvailableEmployees();
    setSelectedEmployees([]);
    setShowAssignModal(true);
  };
  
  // Close assign modal
  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedEmployees([]);
  };
  
  // Toggle employee selection
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };
  
  // Assign selected employees
  const assignEmployees = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee to assign');
      return;
    }
    
    try {
      setIsAssigning(true);
      
      const response = await fetch(`/api/recruiter/employer/profile-allocations/${id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeIds: selectedEmployees }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign employees');
      }
      
      toast.success('Employees assigned successfully');
      closeAssignModal();
      fetchAllocationDetails(); // Refresh the allocation details
    } catch (err: any) {
      console.error('Error assigning employees:', err);
      toast.error(err.message || 'Failed to assign employees');
    } finally {
      setIsAssigning(false);
    }
  };
  
  // Open remove confirmation modal
  const openRemoveModal = (e: React.MouseEvent, employee: { id: string, name: string }) => {
    e.stopPropagation();
    setEmployeeToRemove(employee);
    setShowRemoveModal(true);
  };
  
  // Close remove confirmation modal
  const closeRemoveModal = () => {
    setShowRemoveModal(false);
    setEmployeeToRemove(null);
  };
  
  // Remove employee from allocation
  const removeEmployee = async () => {
    if (!employeeToRemove || !id) return;
    
    try {
      setIsRemoving(true);
      
      const response = await fetch(`/api/recruiter/employer/profile-allocations/${id}/unassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId: employeeToRemove.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove employee');
      }
      
      toast.success(`${employeeToRemove.name} removed successfully`);
      closeRemoveModal();
      
      // Update allocation state by removing the employee
      if (allocation) {
        setAllocation({
          ...allocation,
          allocatedEmployees: allocation.allocatedEmployees.filter(
            ae => ae.employee.id !== employeeToRemove.id
          )
        });
      }
    } catch (err: any) {
      console.error('Error removing employee:', err);
      toast.error(err.message || 'Failed to remove employee');
    } finally {
      setIsRemoving(false);
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Allocated Employees/Managers</h2>
            <button
              onClick={openAssignModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FaUserPlus className="mr-2" /> Assign Employees
            </button>
          </div>
          
          {allocation.allocatedEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No employees or managers have been allocated to this profile yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allocation.allocatedEmployees.map((ae) => (
                    <tr key={ae.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{ae.employee.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{ae.employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {ae.employee.role && ae.employee.role.charAt(0).toUpperCase() + ae.employee.role.slice(1) || 'Employee'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button 
                            onClick={() => handleEmployeeClick(ae.employee.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <FaUserCheck className="mr-1" /> 
                            <span>View Candidates</span>
                          </button>
                          <button
                            onClick={(e) => openRemoveModal(e, { id: ae.employee.id, name: ae.employee.name })}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <FaTrash className="mr-1" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Assign Employees Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaUserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Assign Employees/Managers
                    </h3>
                    <div className="mt-4">
                      {isLoadingEmployees ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : availableEmployees.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No available employees found.</p>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          {availableEmployees.map(employee => (
                            <div 
                              key={employee.id} 
                              className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50"
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <FaUser className="text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                                  <p className="text-xs text-gray-500">{employee.email}</p>
                                </div>
                              </div>
                              <div>
                                <input 
                                  type="checkbox" 
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  checked={selectedEmployees.includes(employee.id)}
                                  onChange={() => toggleEmployeeSelection(employee.id)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={assignEmployees}
                  disabled={isAssigning || selectedEmployees.length === 0}
                >
                  {isAssigning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Assigning...
                    </>
                  ) : 'Assign Selected'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeAssignModal}
                  disabled={isAssigning}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Remove Employee Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveModal}
        title="Remove Employee"
        message={
          <div>
            <p>Are you sure you want to remove <span className="font-semibold">{employeeToRemove?.name}</span> from this profile allocation?</p>
            <p className="mt-2 text-sm text-gray-500">This will unassign the employee from this profile allocation.</p>
          </div>
        }
        confirmText={isRemoving ? "Removing..." : "Remove"}
        cancelText="Cancel"
        confirmButtonType="danger"
        onConfirm={removeEmployee}
        onCancel={closeRemoveModal}
      />
    </RecruiterLayout>
  );
};

export default ProfileAllocationDetailPage; 