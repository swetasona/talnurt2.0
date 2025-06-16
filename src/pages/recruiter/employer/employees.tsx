import React, { useEffect, useState, ReactNode } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaUsers, FaUserTie, FaUser, FaBuilding, FaSpinner, FaEnvelope, FaPhone, FaUserTag, FaSearch, FaTrash, FaExchangeAlt, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

interface CompanyEmployeesProps {
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

const CompanyEmployees: React.FC<CompanyEmployeesProps> = ({ user }) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Add state for deletion request
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<User | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Add state variables for role change
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [employeeToChangeRole, setEmployeeToChangeRole] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [isChangingRole, setIsChangingRole] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/recruiter/employer/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
        setCompanyName(data.company?.name || 'Your Company');
      } else {
        toast.error('Failed to load employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Error loading employees');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter employees based on search term and role filter
  const filteredEmployees = employees
    .filter(employee => employee.role !== 'employer') // Filter out employers
    .filter(employee => {
      const matchesSearch = 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        employee.email.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });

  // Group employees by role for summary (excluding employers from total)
  const roleSummary = {
    total: employees.filter(e => e.role !== 'employer').length,
    employer: employees.filter(e => e.role === 'employer').length,
    manager: employees.filter(e => e.role === 'manager').length,
    employee: employees.filter(e => e.role === 'employee').length,
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'employer':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to handle opening deletion request modal
  const handleRequestDeletion = (employee: User) => {
    setEmployeeToDelete(employee);
    setDeletionReason('');
    setShowDeletionModal(true);
  };
  
  // Function to submit deletion request
  const submitDeletionRequest = async () => {
    if (!employeeToDelete || !deletionReason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }
    
    setIsSubmittingRequest(true);
    try {
      const response = await fetch('/api/recruiter/employer/deletion-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeToDelete.id,
          reason: deletionReason
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Deletion request for ${employeeToDelete.name} has been submitted for admin approval`);
        setShowDeletionModal(false);
        setEmployeeToDelete(null);
        setDeletionReason('');
      } else {
        toast.error(data.error || 'Failed to submit deletion request');
      }
    } catch (error) {
      console.error('Error submitting deletion request:', error);
      toast.error('An error occurred while submitting the request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Function to handle opening role change modal
  const handleChangeRole = (employee: User) => {
    setEmployeeToChangeRole(employee);
    setNewRole(employee.role === 'employee' ? 'manager' : 'employee');
    setShowRoleChangeModal(true);
  };

  // Function to submit role change
  const submitRoleChange = async () => {
    if (!employeeToChangeRole) return;
    
    setIsChangingRole(true);
    try {
      const response = await fetch('/api/employer/change-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: employeeToChangeRole.id,
          newRole
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowRoleChangeModal(false);
        
        // If teams were deleted, show additional message
        if (data.teamsDeleted > 0) {
          toast.success(`${data.teamsDeleted} team(s) managed by this user were automatically deleted.`);
        }
        
        // Refresh the employee list
        fetchEmployees();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to change role');
      }
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Error changing role');
    } finally {
      setIsChangingRole(false);
    }
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <Head>
          <title>Company Employees | Talnurt Recruitment Portal</title>
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
        <title>Company Employees | Talnurt Recruitment Portal</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <FaUsers className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Company Employees</h1>
                <p className="text-green-100 mt-1">
                  View and manage employees at {companyName}
                </p>
              </div>
            </div>
            <Link 
              href="/recruiter/employer/user-requests" 
              className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
            >
              <FaUserTie className="h-4 w-4" />
              Request New User
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Employees</p>
                <h3 className="text-2xl font-bold text-gray-800">{roleSummary.total}</h3>
              </div>
              <FaUsers className="text-gray-400 text-2xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Employers</p>
                <h3 className="text-2xl font-bold text-gray-800">{roleSummary.employer}</h3>
              </div>
              <FaBuilding className="text-purple-400 text-2xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Managers</p>
                <h3 className="text-2xl font-bold text-gray-800">{roleSummary.manager}</h3>
              </div>
              <FaUserTie className="text-blue-400 text-2xl" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Employees</p>
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
                className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter by role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Roles</option>
                <option value="employer">Employer</option>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
              <p className="text-gray-500">
                {searchTerm || roleFilter !== 'all' 
                  ? 'No employees match your search criteria. Try adjusting your filters.'
                  : 'No employees have been added to your company yet.'}
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
                      Team
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                        {employee.manager ? (
                          <div>
                            <div className="text-gray-900">{employee.manager.name}</div>
                            <div className="text-xs text-gray-500">{employee.manager.email}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleChangeRole(employee)}
                            className="text-blue-600 hover:text-blue-800 px-2 py-1 flex items-center space-x-1 border border-blue-200 rounded hover:bg-blue-50"
                          >
                            <FaExchangeAlt className="h-3 w-3" />
                            <span>Change Role</span>
                          </button>
                          <button
                            onClick={() => handleRequestDeletion(employee)}
                            className="text-red-600 hover:text-red-800 px-2 py-1 flex items-center space-x-1 border border-red-200 rounded hover:bg-red-50"
                          >
                            <FaTrash className="h-3 w-3" />
                            <span>Request Deletion</span>
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

      {/* Deletion Request Modal */}
      <ConfirmationModal
        isOpen={showDeletionModal}
        title="Request Employee Deletion"
        message={
          <div className="space-y-4">
            <p>
              You are requesting to delete <span className="font-semibold">{employeeToDelete?.name}</span>.
              This request will be sent to an administrator for approval.
            </p>
            <div>
              <label htmlFor="deletionReason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Deletion (Required)
              </label>
              <textarea
                id="deletionReason"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Please provide a reason for this deletion request"
              />
            </div>
          </div>
        }
        confirmText="Submit Request"
        cancelText="Cancel"
        confirmButtonType="danger"
        onConfirm={submitDeletionRequest}
        onCancel={() => {
          setShowDeletionModal(false);
          setEmployeeToDelete(null);
          setDeletionReason('');
        }}
      />

      {/* Role Change Modal */}
      <ConfirmationModal
        isOpen={showRoleChangeModal}
        title="Change Employee Role"
        message={
          <div className="space-y-4">
            <p>
              You are about to change <span className="font-semibold">{employeeToChangeRole?.name}</span>'s role from <span className="font-semibold">{employeeToChangeRole?.role}</span> to <span className="font-semibold">{newRole}</span>.
            </p>
            {employeeToChangeRole?.role === 'manager' && newRole === 'employee' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Warning:</strong> Changing a manager to an employee will delete any teams they manage. Team members will be kept but removed from the team.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>
        }
        confirmText={isChangingRole ? "Processing..." : "Change Role"}
        cancelText="Cancel"
        confirmButtonType="danger"
        onConfirm={!isChangingRole ? submitRoleChange : () => {}}
        onCancel={() => {
          setShowRoleChangeModal(false);
          setEmployeeToChangeRole(null);
        }}
      />
    </RecruiterLayout>
  );
};

export default CompanyEmployees; 