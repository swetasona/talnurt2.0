import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaUsers, FaUserTie, FaUser, FaBuilding, FaSearch, FaEnvelope, FaHistory } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  deactivated_at: string;
  team?: {
    id: string;
    name: string;
  };
}

interface PastEmployeesProps {
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
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role || '',
      },
    },
  };
};

const PastEmployees: React.FC<PastEmployeesProps> = ({ user }) => {
  const [pastEmployees, setPastEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchPastEmployees();
  }, []);

  const fetchPastEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/recruiter/employer/past-employees');
      if (response.ok) {
        const data = await response.json();
        setPastEmployees(data.employees || []);
        setCompanyName(data.company?.name || 'Your Company');
      } else {
        toast.error('Failed to load past employees');
      }
    } catch (error) {
      console.error('Error fetching past employees:', error);
      toast.error('Error loading past employees');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter employees based on search term and role filter
  const filteredEmployees = pastEmployees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Group employees by role for summary
  const roleSummary = {
    total: pastEmployees.length,
    manager: pastEmployees.filter(e => e.role === 'manager').length,
    employee: pastEmployees.filter(e => e.role === 'employee').length,
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <Head>
          <title>Past Employees | Talnurt Recruitment Portal</title>
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
        <title>Past Employees | Talnurt Recruitment Portal</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <FaHistory className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Past Employees</h1>
                <p className="text-gray-100 mt-1">
                  View historical employee data for {companyName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Past Employees</p>
                <h3 className="text-2xl font-bold text-gray-800">{roleSummary.total}</h3>
              </div>
              <FaUsers className="text-gray-400 text-2xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Past Managers</p>
                <h3 className="text-2xl font-bold text-gray-800">{roleSummary.manager}</h3>
              </div>
              <FaUserTie className="text-blue-400 text-2xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Past Employees</p>
                <h3 className="text-2xl font-bold text-gray-800">{roleSummary.employee}</h3>
              </div>
              <FaUser className="text-green-400 text-2xl" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter by role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="all">All Roles</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employees List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <FaUser className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Employees Found</h3>
              <p className="text-gray-500">
                {searchTerm || roleFilter !== 'all' 
                  ? 'No past employees match your search criteria. Try adjusting your filters.'
                  : 'No employees have been removed from your company yet.'}
              </p>
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
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Former Team
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deactivated On
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <FaEnvelope className="mr-1 h-3 w-3" />
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(employee.role)}`}>
                          {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.team ? employee.team.name : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(employee.deactivated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
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

export default PastEmployees; 