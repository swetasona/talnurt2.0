import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import axios from 'axios';
import { FaUser, FaUserShield, FaUserTie, FaUserCheck, FaSearch, FaExclamationTriangle } from 'react-icons/fa';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string;
  created_at: string;
}

const UserManagementPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/super-admin/signin');
      return;
    }
    
    if (status !== 'loading' && session?.user?.role !== 'super_admin') {
      router.push('/auth/super-admin/signin');
      return;
    }
  }, [session, status, router]);
  
  // Fetch users when component mounts
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'super_admin') {
      fetchUsers();
    }
  }, [status, session]);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This API would need to be implemented
      // const response = await axios.get('/api/admin/super-admin/users');
      // setUsers(response.data);
      
      // For now using mock data
      setUsers([
        {
          id: '1',
          name: 'Super Admin',
          email: 'superadmin@example.com',
          role: 'super_admin',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Recruiter User',
          email: 'recruiter@example.com',
          role: 'recruiter',
          company: 'Acme Corp',
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Job Applicant',
          email: 'applicant@example.com',
          role: 'applicant',
          created_at: new Date().toISOString()
        }
      ]);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = search === '' || 
      user.name.toLowerCase().includes(search.toLowerCase()) || 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.company && user.company.toLowerCase().includes(search.toLowerCase()));
      
    const matchesRole = roleFilter === null || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  // Role badge component
  const RoleBadge = ({ role }: { role: string }) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <FaUserShield className="mr-1" /> Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FaUserTie className="mr-1" /> Admin
          </span>
        );
      case 'recruiter':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaUserCheck className="mr-1" /> Recruiter
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FaUser className="mr-1" /> Applicant
          </span>
        );
    }
  };
  
  // Format date function
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (isLoading || status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!session || session.user.role !== 'super_admin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center max-w-md">
            <FaExclamationTriangle className="mr-2" />
            <span>Access denied. Super admin privileges required.</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>User Management | Super Admin Dashboard</title>
      </Head>
      
      <div className="py-8 px-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
        
        {/* Search and filter controls */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                placeholder="Search users by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Filter by role:</span>
              <div className="inline-flex shadow-sm rounded-md">
                <button
                  type="button"
                  onClick={() => setRoleFilter(null)}
                  className={`relative inline-flex items-center px-3 py-2 rounded-l-md border ${
                    roleFilter === null 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('super_admin')}
                  className={`relative inline-flex items-center px-3 py-2 border-t border-b ${
                    roleFilter === 'super_admin'
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('admin')}
                  className={`relative inline-flex items-center px-3 py-2 border-t border-b ${
                    roleFilter === 'admin'
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('recruiter')}
                  className={`relative inline-flex items-center px-3 py-2 border-t border-b ${
                    roleFilter === 'recruiter'
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  Recruiter
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('applicant')}
                  className={`relative inline-flex items-center px-3 py-2 rounded-r-md border ${
                    roleFilter === 'applicant'
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  Applicant
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Users table */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Users ({filteredUsers.length})
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              A comprehensive list of all registered users in the system.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="font-medium text-gray-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Edit
                      </button>
                      {user.id !== session.user.id && user.role !== 'super_admin' && (
                        <button className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      No users found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagementPage; 