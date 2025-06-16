import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaUserCog, FaSave, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import Head from 'next/head';
import AlertBox from '@/components/shared/AlertBox';
import axios from 'axios';
import { format } from 'date-fns';

interface Recruiter {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: string;
  created_at: string;
}

const AVAILABLE_ROLES = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'employer', label: 'Employer' },
  { value: 'admin', label: 'Admin' }
];

type TabType = 'all' | 'unassigned' | 'employees' | 'managers' | 'employers';

const AssignRolePage: React.FC = () => {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  // Alert state
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });
  
  // Fetch recruiters from API on component mount
  useEffect(() => {
    fetchRecruiters();
  }, []);
  
  // Function to fetch recruiters from API
  const fetchRecruiters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/admin/recruiters');
      // Use all recruiters returned from the API, as it now filters by role
      setRecruiters(response.data);
    } catch (error: any) {
      console.error('Error fetching recruiters:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load recruiters. Please try again later.';
      setError(errorMessage);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to update recruiter role
  const updateRecruiterRole = async (recruiterId: string, newRole: string) => {
    try {
      await axios.put(`/api/admin/recruiters/role/${recruiterId}`, { role: newRole });
      
      // Update the local state
      setRecruiters(prev => 
        prev.map(recruiter => 
          recruiter.id === recruiterId ? { ...recruiter, role: newRole } : recruiter
        )
      );
      
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Role updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update role.';
      
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    }
  };
  
  // Function to handle alert close
  const handleAlertClose = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };
  
  // Filter recruiters based on search term and active tab
  const filteredRecruiters = recruiters.filter(recruiter => {
    // Search filter
    const matchesSearch = 
      recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      recruiter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recruiter.company && recruiter.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Tab filter
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'unassigned' ? recruiter.role === 'unassigned' :
      activeTab === 'employees' ? recruiter.role === 'employee' :
      activeTab === 'managers' ? recruiter.role === 'manager' :
      activeTab === 'employers' ? recruiter.role === 'employer' :
      true;
    
    return matchesSearch && matchesTab;
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  

  
  return (
    <AdminLayout>
      <Head>
        <title>Assign Roles | Talnurt Recruitment Portal</title>
      </Head>
      
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="mb-6 bg-[#4154ef] py-4 px-6 rounded-lg">
          <h1 className="text-2xl font-bold text-white">
            Assign Role to Recruiters
          </h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-600 mb-4">
            Manage recruiter roles by assigning appropriate permissions. Recruiters can be classified as Employees, Employers, Managers or Unassigned with different access levels.
          </p>
          
          <div className="flex items-center bg-gray-50 p-4 rounded-lg mb-6">
            <FaExclamationTriangle className="text-amber-500 mr-3" />
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Important:</span> Changing a recruiter's role will immediately affect their permissions and access to the system. Please ensure you are assigning the appropriate role.
            </p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <div className="flex flex-wrap gap-2">
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'all' 
                  ? 'bg-[#4154ef] text-white' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'unassigned' 
                  ? 'bg-[#4154ef] text-white' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('unassigned')}
            >
              Un-Assigned
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'employees' 
                  ? 'bg-[#4154ef] text-white' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('employees')}
            >
              Employees
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'managers' 
                  ? 'bg-[#4154ef] text-white' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('managers')}
            >
              Managers
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'employers' 
                  ? 'bg-[#4154ef] text-white' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('employers')}
            >
              Employers
            </button>
          </div>
        </div>
        
        {/* Search Box */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              className="block w-full pl-4 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#4154ef] focus:border-[#4154ef] sm:text-sm"
              placeholder="Search recruiters by email, role, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Alert Box */}
        <AlertBox
          isOpen={alert.isOpen}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={handleAlertClose}
        />
        
        {/* Recruiters Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <button 
                  onClick={fetchRecruiters}
                  className="mt-4 px-4 py-2 bg-[#4154ef] text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredRecruiters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No recruiters found{searchTerm ? ' matching your search' : ''}.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#4154ef]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Sr
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecruiters.map((recruiter, index) => (
                    <tr key={recruiter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{recruiter.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{recruiter.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{recruiter.company || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#4154ef] focus:border-[#4154ef] sm:text-sm rounded-md uppercase"
                          value={recruiter.role}
                          onChange={(e) => updateRecruiterRole(recruiter.id, e.target.value)}
                        >
                          {AVAILABLE_ROLES.map((role) => (
                            <option key={role.value} value={role.value} className="uppercase">
                              {role.label.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
      </div>
    </AdminLayout>
  );
};

export default AssignRolePage; 