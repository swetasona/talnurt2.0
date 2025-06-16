import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaUserTie, FaTrash, FaPlus, FaEnvelope, FaExclamationTriangle, FaSearch, FaSort, FaSortUp, FaSortDown, FaFilter } from 'react-icons/fa';
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
  updated_at: string;
}

type SortField = 'name' | 'email' | 'company' | 'created_at';
type SortDirection = 'asc' | 'desc';

const RecruitersPage: React.FC = () => {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search, sort and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [uniqueCompanies, setUniqueCompanies] = useState<string[]>([]);
  const [uniqueRoles, setUniqueRoles] = useState<string[]>([]);
  
  // Alert state
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });
  
  // Store the ID of the recruiter to be deleted
  const [recruiterToDelete, setRecruiterToDelete] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecruiter, setNewRecruiter] = useState({ 
    name: '', 
    email: '', 
    password: '',
    confirmPassword: '',
    company: '' 
  });
  
  // Fetch recruiters from API on component mount
  useEffect(() => {
    fetchRecruiters();
    checkAuthStatus();
  }, []);
  
  // Verify admin authentication
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/admin/auth/verify');
      console.log('Authentication status:', response.data);
      
      if (!response.data.authenticated) {
        console.error('Not authenticated. Redirecting to login page...');
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Authentication Error',
          message: 'You are not authenticated. Redirecting to login page...'
        });
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      }
    } catch (error) {
      console.error('Error verifying authentication:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Authentication Error',
        message: 'Failed to verify authentication status. Please try logging in again.'
      });
    }
  };
  
  // Extract unique companies and roles for filtering
  useEffect(() => {
    const companies = recruiters
      .map(recruiter => recruiter.company || 'Unspecified')
      .filter((company, index, self) => self.indexOf(company) === index)
      .sort();
    
    setUniqueCompanies(companies);

    const roles = recruiters
      .map(recruiter => recruiter.role)
      .filter((role, index, self) => self.indexOf(role) === index)
      .sort();
    
    setUniqueRoles(roles);
  }, [recruiters]);
  
  // Function to fetch recruiters from API
  const fetchRecruiters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching recruiters from API...');
      const response = await axios.get('/api/admin/recruiters');
      console.log('Recruiters API response:', response.data);
      setRecruiters(response.data);
    } catch (error: any) {
      console.error('Error fetching recruiters:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load recruiters. Please try again later.';
      const statusCode = error.response?.status;
      console.error(`API Error (${statusCode}):`, errorMessage);
      
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
  
  // Function to add a new recruiter
  const handleAddRecruiter = async () => {
    // Validate form
    if (!newRecruiter.name || !newRecruiter.email || !newRecruiter.password || !newRecruiter.company) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'All fields are required.'
      });
      return;
    }
    
    if (newRecruiter.password !== newRecruiter.confirmPassword) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Passwords do not match.'
      });
      return;
    }
    
    if (newRecruiter.password.length < 8) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Password must be at least 8 characters long.'
      });
      return;
    }
    
    try {
      console.log('Adding new recruiter:', { ...newRecruiter, password: '********' });
      const response = await axios.post('/api/admin/recruiters', {
        name: newRecruiter.name,
        email: newRecruiter.email,
        password: newRecruiter.password,
        company: newRecruiter.company
      });
      
      console.log('Add recruiter response:', response.data);
      setRecruiters(prev => [response.data, ...prev]);
      setShowAddForm(false);
      setNewRecruiter({ name: '', email: '', password: '', confirmPassword: '', company: '' });
      
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Recruiter added successfully.'
      });
    } catch (error: any) {
      console.error('Error adding recruiter:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add recruiter.';
      console.error('API Error:', errorMessage, error.response?.data?.details || '');
      
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    }
  };
  
  // Function to initiate deletion of a recruiter
  const handleDeleteRecruiter = (id: string) => {
    const recruiterToDelete = recruiters.find(r => r.id === id);
    const isEmployer = recruiterToDelete?.role === 'employer';
    const hasCompany = !!recruiterToDelete?.company;
    
    setRecruiterToDelete(id);
    
    if (isEmployer && hasCompany) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'WARNING: Confirm Cascading Deletion',
        message: 'This user is an EMPLOYER. Deleting them will also delete their company, all employees, managers, teams, jobs, and all associated data. This action CANNOT be undone.'
      });
    } else if (isEmployer && !hasCompany) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Confirm Employer Deletion',
        message: 'This user is an EMPLOYER without a company. Deleting them will remove all their job postings and associated data. This action cannot be undone.'
      });
    } else {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete this recruiter? This action cannot be undone.'
      });
    }
  };
  
  // Function to confirm and actually delete a recruiter
  const performDeleteRecruiter = async () => {
    if (!recruiterToDelete) return;
    
    try {
      console.log('Starting recruiter deletion process for ID:', recruiterToDelete);
      
      // First, check if this is an employer
      const recruiterToDeleteObj = recruiters.find(r => r.id === recruiterToDelete);
      const isEmployer = recruiterToDeleteObj?.role === 'employer';
      const hasCompany = !!recruiterToDeleteObj?.company;
      
      console.log(`Is this recruiter an employer? ${isEmployer}, Has company? ${hasCompany}`);
      
      let response;
      
      if (isEmployer) {
        // Use the cascading deletion endpoint for employers
        console.log('Using cascading deletion for employer');
        response = await axios.post('/api/admin/delete-employer', {
          employerId: recruiterToDelete
        }, {
          withCredentials: true
        });
        
        console.log('Employer deletion response:', response.data);
      } else {
        // Use the standard deletion endpoint for other recruiters
        console.log('Using standard deletion for recruiter');
        response = await axios.delete(`/api/admin/recruiters/${recruiterToDelete}`, {
          withCredentials: true
        });
        
        console.log('Recruiter deletion response:', response.data);
      }
      
      // Update the UI after successful deletion
      setRecruiters(prev => prev.filter(recruiter => recruiter.id !== recruiterToDelete));
      
      // Show success message with additional details for employers
      if (isEmployer && response.data.data) {
        const { stats } = response.data.data;
        
        if (hasCompany) {
          setAlert({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: `Employer deleted successfully along with ${stats.users} users, ${stats.jobs} jobs, ${stats.teams} teams, and all associated data.`
          });
        } else {
          setAlert({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: `Employer deleted successfully along with ${stats.jobs} jobs, ${stats.savedCandidates} saved candidates, and other associated data.`
          });
        }
      } else {
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Recruiter deleted successfully.'
        });
      }
    } catch (error: any) {
      console.error('Error deleting recruiter:', error);
      
      // Extract more specific error message if available
      let errorMessage = 'Failed to delete recruiter.';
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          errorMessage = 'Authentication error. Please try logging out and logging back in.';
          setTimeout(() => window.location.href = '/admin/login', 2000);
        } else if (error.response.status === 403) {
          errorMessage = 'Insufficient permissions to delete this recruiter.';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = 'No response received from server. Please check your network connection.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    }
  };
  
  // Function to handle alert close/confirm actions
  const handleAlertClose = (confirm = false) => {
    if (confirm && recruiterToDelete) {
      performDeleteRecruiter();
    } else {
      setRecruiterToDelete(null);
    }
    
    setAlert(prev => ({ ...prev, isOpen: false }));
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sort icon based on current state
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <FaSortUp className="ml-1 text-indigo-600" /> : 
      <FaSortDown className="ml-1 text-indigo-600" />;
  };
  
  // Filter and sort recruiters for display
  const filteredAndSortedRecruiters = recruiters
    .filter(recruiter => {
      // Apply company filter
      if (companyFilter !== 'all') {
        const recruiterCompany = recruiter.company || 'Unspecified';
        if (recruiterCompany !== companyFilter) return false;
      }
      
      // Apply role filter
      if (roleFilter !== 'all' && recruiter.role !== roleFilter) {
        return false;
      }
      
      // Apply search filter
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        recruiter.name.toLowerCase().includes(query) ||
        recruiter.email.toLowerCase().includes(query) ||
        (recruiter.company && recruiter.company.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      // Apply sorting
      let valueA, valueB;
      
      switch (sortField) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'email':
          valueA = a.email.toLowerCase();
          valueB = b.email.toLowerCase();
          break;
        case 'company':
          valueA = (a.company || '').toLowerCase();
          valueB = (b.company || '').toLowerCase();
          break;
        case 'created_at':
        default:
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
      }
      
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  
  return (
    <AdminLayout>
      <Head>
        <title>Recruiters Management | Talnurt Recruitment Portal</title>
      </Head>
      
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Recruiters Management
          </h1>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Add a Recruiter
          </button>
        </div>
        
        {/* Debug Info */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-xs">
            <p className="font-semibold">Debug Information:</p>
            <p>Environment: {process.env.NODE_ENV}</p>
            <p>Access Level: Admin (No Authentication Required)</p>
            <p>Admin Email: admin@talnurt.com</p>
          </div>
        )}
        
        {/* Add Recruiter Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-800">Add New Recruiter</h2>
              <p className="text-sm text-gray-600 mt-1">
                Fill out the form below to create a new recruiter account.
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={newRecruiter.name}
                    onChange={(e) => setNewRecruiter({ ...newRecruiter, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter recruiter's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email"
                    value={newRecruiter.email}
                    onChange={(e) => setNewRecruiter({ ...newRecruiter, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter recruiter's email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="password"
                    value={newRecruiter.password}
                    onChange={(e) => setNewRecruiter({ ...newRecruiter, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Create a strong password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="password"
                    value={newRecruiter.confirmPassword}
                    onChange={(e) => setNewRecruiter({ ...newRecruiter, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Confirm password"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={newRecruiter.company}
                    onChange={(e) => setNewRecruiter({ ...newRecruiter, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter company name"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewRecruiter({ name: '', email: '', password: '', confirmPassword: '', company: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRecruiter}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Recruiter
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or company..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="w-full md:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFilter className="text-gray-400" />
                </div>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="all">All Companies</option>
                  {uniqueCompanies.map(company => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="w-full md:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserTie className="text-gray-400" />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="all">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recruiters List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Recruiters List</h2>
            <span className="text-sm text-gray-500">
              {filteredAndSortedRecruiters.length} {filteredAndSortedRecruiters.length === 1 ? 'recruiter' : 'recruiters'} found
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center">
                      Company {getSortIcon('company')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      Role
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Registered On {getSortIcon('created_at')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Loading recruiters...</p>
                    </td>
                  </tr>
                ) : filteredAndSortedRecruiters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchQuery || companyFilter !== 'all' ? 
                        'No recruiters match your search criteria.' : 
                        'No recruiters found. Create your first recruiter to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedRecruiters.map((recruiter) => (
                    <tr key={recruiter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <FaUserTie />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{recruiter.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <FaEnvelope className="mr-2 text-gray-400" />
                          {recruiter.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {recruiter.company || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${recruiter.role === 'employer' ? 'bg-purple-100 text-purple-800' : 
                            recruiter.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                            recruiter.role === 'admin' ? 'bg-red-100 text-red-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {recruiter.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(recruiter.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteRecruiter(recruiter.id)}
                          className={`text-red-500 hover:text-red-600 ${recruiter.role === 'employer' ? 'relative group' : ''}`}
                          title={recruiter.role === 'employer' ? 'Delete (will cascade to all company data)' : 'Delete'}
                        >
                          <FaTrash size={18} />
                          {recruiter.role === 'employer' && (
                            <span className="hidden group-hover:block absolute right-0 -top-10 bg-red-100 text-red-800 text-xs rounded py-1 px-2 whitespace-nowrap">
                              Cascading Delete
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Alert Box */}
        {alert.isOpen && (
          <AlertBox
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => handleAlertClose()}
            onConfirm={() => handleAlertClose(true)}
            showConfirm={alert.type === 'warning'}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default RecruitersPage; 