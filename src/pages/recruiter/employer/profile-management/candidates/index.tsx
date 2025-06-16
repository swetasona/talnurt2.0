import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaSearch, FaFilter, FaEye, FaDownload, FaUserPlus, FaSort, FaSortUp, FaSortDown, FaListAlt, FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import toast from 'react-hot-toast';
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
    name: string;
    email: string;
  };
}

const CandidateManagementPage: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  
  // State for profile allocations
  const [profileAllocations, setProfileAllocations] = useState<ProfileAllocation[]>([]);
  const [filteredAllocations, setFilteredAllocations] = useState<ProfileAllocation[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  
  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    allocationId: '',
    allocationTitle: ''
  });
  
  // Fetch profile allocations
  const fetchProfileAllocations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/recruiter/employer/profile-allocations');
      
      if (response.ok) {
        const data = await response.json();
        setProfileAllocations(data.allocations || []);
        setFilteredAllocations(data.allocations || []);
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
  
  // Initial data fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileAllocations();
    }
  }, [session]);
  
  // Handle search and filtering
  useEffect(() => {
    // Filter profile allocations
    let result = [...profileAllocations];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        allocation => 
          allocation.jobTitle.toLowerCase().includes(term) ||
          allocation.jobDescription.toLowerCase().includes(term) ||
          allocation.location?.toLowerCase().includes(term) ||
          allocation.allocatedEmployees.some(ae => 
            ae.employee.name.toLowerCase().includes(term) ||
            ae.employee.email.toLowerCase().includes(term)
          )
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(allocation => allocation.status === statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let fieldA: any = a[sortField as keyof ProfileAllocation];
      let fieldB: any = b[sortField as keyof ProfileAllocation];
      
      if (fieldA === undefined) fieldA = '';
      if (fieldB === undefined) fieldB = '';
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      return sortDirection === 'asc' 
        ? (fieldA > fieldB ? 1 : -1) 
        : (fieldB > fieldA ? 1 : -1);
    });
    
    setFilteredAllocations(result);
  }, [searchTerm, statusFilter, sortField, sortDirection, profileAllocations]);
  
  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort className="ml-1" />;
    return sortDirection === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />;
  };
  
  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (e: React.MouseEvent, allocation: ProfileAllocation) => {
    e.stopPropagation();
    setDeleteConfirmation({
      isOpen: true,
      allocationId: allocation.id,
      allocationTitle: allocation.jobTitle
    });
  };

  // Close delete confirmation modal
  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      allocationId: '',
      allocationTitle: ''
    });
  };
  
  // Handle profile allocation deletion
  const handleDelete = async () => {
    const id = deleteConfirmation.allocationId;
    
    try {
      setDeletingIds(prev => [...prev, id]);
      
      const response = await fetch(`/api/recruiter/employer/profile-allocation/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Profile allocation deleted successfully');
        // Remove the deleted allocation from both state arrays
        setProfileAllocations(prevAllocations => 
          prevAllocations.filter(allocation => allocation.id !== id)
        );
        setFilteredAllocations(prevAllocations => 
          prevAllocations.filter(allocation => allocation.id !== id)
        );
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete profile allocation');
      }
    } catch (error) {
      console.error('Error deleting profile allocation:', error);
      toast.error('An error occurred while deleting the profile allocation');
    } finally {
      setDeletingIds(prev => prev.filter(item => item !== id));
      closeDeleteConfirmation();
    }
  };

  return (
    <RecruiterLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Candidate Management</h1>
        
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="flex gap-4">
            <select
              className="px-4 py-2 border rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
            
            <Link href="/recruiter/employer/profile-allocation" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Create Allocation
            </Link>
          </div>
        </div>
        
        {/* Profile Allocations Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Loading profile allocations...</div>
          ) : filteredAllocations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No profile allocations found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('jobTitle')}
                    >
                      <div className="flex items-center">
                        Job Title {getSortIcon('jobTitle')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allocated Employees
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('location')}
                    >
                      <div className="flex items-center">
                        Location {getSortIcon('location')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center">
                        Priority {getSortIcon('priority')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('deadline')}
                    >
                      <div className="flex items-center">
                        Deadline {getSortIcon('deadline')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAllocations.map((allocation) => (
                    <tr key={allocation.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/recruiter/employer/profile-management/candidates/${allocation.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{allocation.jobTitle}</div>
                        <div className="text-sm text-gray-500">Created: {formatDate(allocation.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {allocation.allocatedEmployees.length} employee(s)
                        </div>
                        <div className="text-xs text-gray-500">
                          {allocation.allocatedEmployees.slice(0, 2).map(ae => ae.employee.name).join(', ')}
                          {allocation.allocatedEmployees.length > 2 && `, +${allocation.allocatedEmployees.length - 2} more`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {allocation.location || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${allocation.priority === 'high' ? 'bg-red-100 text-red-800' : 
                            allocation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {allocation.priority.charAt(0).toUpperCase() + allocation.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(allocation.deadline)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${allocation.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                            allocation.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {allocation.status.charAt(0).toUpperCase() + allocation.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/recruiter/employer/profile-management/candidates/${allocation.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                          <FaEye className="inline mr-1" /> View
                        </Link>
                                            <button
                      onClick={(e) => openDeleteConfirmation(e, allocation)}
                      disabled={deletingIds.includes(allocation.id)}
                      className="text-red-600 hover:text-red-900 focus:outline-none ml-2 border border-red-300 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Delete profile allocation"
                    >
                      {deletingIds.includes(allocation.id) ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1"></span> Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrash className="inline mr-1" /> Delete
                        </>
                      )}
                    </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Delete Profile Allocation"
        message={
          <div>
            <p>Are you sure you want to delete the profile allocation for <span className="font-semibold">{deleteConfirmation.allocationTitle}</span>?</p>
            <p className="mt-2 text-sm text-gray-500">This action cannot be undone. All data associated with this allocation will be permanently removed.</p>
          </div>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonType="danger"
        onConfirm={handleDelete}
        onCancel={closeDeleteConfirmation}
      />
    </RecruiterLayout>
  );
};

export default CandidateManagementPage; 