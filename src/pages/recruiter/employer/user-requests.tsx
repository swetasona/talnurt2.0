import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaUser, FaEnvelope, FaUserTie, FaPlus, FaTimes, FaSpinner, FaCheck, FaClock, FaExclamationTriangle, FaSearch, FaSort, FaSortUp, FaSortDown, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { loadAllPasswordsFromDatabase } from '@/utils/passwordStorage';

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface UserCreationRequest {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  password?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
}

interface UserRequestsProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || !session.user?.id) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // Check if user has employer access
  if (session.user.role !== 'employer') {
    return {
      redirect: {
        destination: '/recruiter/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.user.id,
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: session.user.role || 'employer',
      },
    },
  };
};

const UserRequests: React.FC<UserRequestsProps> = ({ user }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [requests, setRequests] = useState<UserCreationRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [passwordVisibility, setPasswordVisibility] = useState<{[key: string]: boolean}>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    manager_id: ''
  });

  useEffect(() => {
    // Load passwords from database and then fetch data
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Load approved request passwords from database
        await loadAllPasswordsFromDatabase();
        
        // Then fetch user requests data
        await fetchData();
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Error loading data');
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch available managers
      const managersResponse = await fetch('/api/recruiter/employer/managers');
      if (managersResponse.ok) {
        const managersData = await managersResponse.json();
        setManagers(managersData.managers || []);
      }

      // Fetch existing requests
      const requestsResponse = await fetch('/api/recruiter/employer/user-creation-requests');
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setRequests(requestsData.requests || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
      throw error; // Re-throw so the caller can handle it
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!formData.role) {
      toast.error('Role is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/recruiter/employer/user-creation-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setFormData({
          name: '',
          email: '',
          role: 'employee',
          manager_id: ''
        });
        setShowForm(false);
        fetchData(); // Refresh the requests list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Error submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'approved':
        return <FaCheck className="text-green-500" />;
      case 'rejected':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get pending requests
  const pendingRequests = requests.filter(req => req.status === 'pending');

  // Filter and sort requests for the table
  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.name.toLowerCase().includes(query) ||
      req.email.toLowerCase().includes(query) ||
      req.role.toLowerCase().includes(query) ||
      req.status.toLowerCase().includes(query) ||
      (req.manager?.name.toLowerCase().includes(query))
    );
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let valA, valB;

    switch (sortField) {
      case 'name':
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case 'email':
        valA = a.email.toLowerCase();
        valB = b.email.toLowerCase();
        break;
      case 'role':
        valA = a.role.toLowerCase();
        valB = b.role.toLowerCase();
        break;
      case 'status':
        valA = a.status.toLowerCase();
        valB = b.status.toLowerCase();
        break;
      case 'manager':
        valA = a.manager?.name?.toLowerCase() || '';
        valB = b.manager?.name?.toLowerCase() || '';
        break;
      case 'created_at':
      default:
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
        break;
    }

    if (sortDirection === 'asc') {
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    } else {
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    }
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400 inline" />;
    return sortDirection === 'asc' ? 
      <FaSortUp className="ml-1 text-indigo-600 inline" /> : 
      <FaSortDown className="ml-1 text-indigo-600 inline" />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const togglePasswordVisibility = (requestId: string) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <Head>
          <title>User Creation Requests | Talnurt Recruitment Portal</title>
        </Head>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <Head>
        <title>User Creation Requests | Talnurt Recruitment Portal</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <FaUserTie className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">User Creation Requests</h1>
                <p className="text-indigo-100 mt-1">
                  Request creation of manager and employee accounts
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
            >
              <FaPlus className="h-4 w-4" />
              New Request
            </button>
          </div>
        </div>

        {/* Pending Requests Cards */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <FaClock className="mr-3 text-yellow-500" />
            Pending Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <FaClock className="mx-auto text-4xl text-gray-300 mb-2" />
              <p className="text-gray-500">No pending requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-3 flex items-center justify-between bg-yellow-50">
                    <div className="flex items-center">
                      <span className="p-1.5 rounded-full bg-yellow-100">
                        <FaClock className="text-yellow-500" />
                      </span>
                      <span className="ml-2 font-medium capitalize text-gray-800">Pending</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900">{request.name}</h3>
                      <p className="text-gray-600 text-sm flex items-center">
                        <FaEnvelope className="mr-1 text-gray-400" size={12} />
                        {request.email}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium capitalize">
                        {request.role}
                      </span>
                      {request.manager && (
                        <span className="text-xs text-gray-500">
                          Manager: {request.manager.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Requests Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FaUser className="mr-3 text-indigo-600" />
              All Requests
            </h2>
            
            <div className="mt-2 sm:mt-0 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search requests..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <FaUserTie className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Requests Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You haven't submitted any user creation requests yet. Click the "New Request" button to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      Name {getSortIcon('name')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      Email {getSortIcon('email')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('role')}
                    >
                      Role {getSortIcon('role')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('manager')}
                    >
                      Manager {getSortIcon('manager')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      Date {getSortIcon('created_at')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Password
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{request.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 capitalize">{request.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {request.manager ? request.manager.name : 'None'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.status === 'approved' && request.password ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">
                              {passwordVisibility[request.id] ? request.password : '••••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(request.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {passwordVisibility[request.id] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(request.password || '')}
                              className="text-blue-500 hover:text-blue-700"
                              title="Copy password"
                            >
                              <FaKey size={14} />
                            </button>
                          </div>
                        ) : request.status === 'approved' ? (
                          <span className="text-gray-400 text-sm">Not available</span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedRequests.length === 0 && searchQuery && (
                <div className="text-center py-4 text-gray-500">
                  No results match your search
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Request New User Account
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaUser className="inline mr-1" />
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaEnvelope className="inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaUserTie className="inline mr-1" />
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, manager_id: e.target.value === 'manager' ? '' : formData.manager_id })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              {formData.role === 'employee' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manager (Optional)
                  </label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a manager (optional)</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RecruiterLayout>
  );
};

export default UserRequests; 