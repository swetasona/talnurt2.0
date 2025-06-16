import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaShieldAlt, FaCheckCircle, FaTimesCircle, FaClock, FaUser, FaCalendar, FaEdit, FaSearch, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface EmployerApplication {
  id: string;
  recruiter_id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  recruiter: {
    id: string;
    name: string;
    email: string;
    company?: string;
    _isPlaceholder?: boolean;
  };
}

const EmployerApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<EmployerApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/employer-applications?t=' + new Date().getTime());
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        toast.error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Error loading applications');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset function to clear state and refetch data
  const resetApplications = async () => {
    setIsLoading(true);
    setApplications([]);
    setSelectedApplication(null);
    setShowModal(false);
    setFilter('all');
    setSearchQuery('');
    
    // Force a server-side reset and re-fetch
    try {
      const response = await fetch('/api/admin/employer-applications', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
        toast.success('Applications data reset successfully');
      } else {
        toast.error('Failed to reset applications');
        // Fallback to standard fetch if DELETE fails
        fetchApplications();
      }
    } catch (error) {
      console.error('Error resetting applications:', error);
      toast.error('Error resetting applications');
      // Fallback to standard fetch if DELETE fails
      fetchApplications();
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a specific application
  const deleteApplication = async (applicationId: string) => {
    if (!confirm("Are you sure you want to permanently delete this application?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/employer-applications?applicationId=${applicationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Application deleted successfully');
        // Remove from local state
        setApplications(prev => prev.filter(app => app.id !== applicationId));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete application');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Error deleting application');
    }
  };

  const handleUpdateApplication = async () => {
    if (!selectedApplication) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/employer-applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          status: newStatus,
          admin_notes: adminNotes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowModal(false);
        fetchApplications(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update application');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Error updating application');
    } finally {
      setIsUpdating(false);
    }
  };

  const openModal = (application: EmployerApplication) => {
    // No need to show an error toast since we're providing placeholder data
    // The UI will show a special styling for placeholders
    setSelectedApplication(application);
    setNewStatus(application.status);
    setAdminNotes(application.admin_notes || '');
    setShowModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'approved':
        return <FaCheckCircle className="text-green-500" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter !== 'all' && app.status !== filter) return false;
    
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (app.recruiter?.name?.toLowerCase()?.includes(query) || false) ||
      (app.recruiter?.email?.toLowerCase()?.includes(query) || false) ||
      (app.recruiter?.company?.toLowerCase()?.includes(query) || false) ||
      app.status.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  return (
    <AdminLayout>
      <Head>
        <title>Employer Access Applications | Admin Panel</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <FaShieldAlt className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Employer Access Applications</h1>
                <p className="text-indigo-100 mt-1">
                  Manage requests for employer access privileges
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetApplications}
                disabled={isLoading}
                className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reset Data</span>
              </button>
              <button
                onClick={fetchApplications}
                disabled={isLoading}
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaShieldAlt className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <FaClock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaCheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <FaTimesCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs and Search */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'All Applications', count: stats.total },
                  { key: 'pending', label: 'Pending', count: stats.pending },
                  { key: 'approved', label: 'Approved', count: stats.approved },
                  { key: 'rejected', label: 'Rejected', count: stats.rejected },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      filter === tab.key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="mt-4 sm:mt-0 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search applications..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Applications List */}
          <div className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <FaShieldAlt className="mx-auto text-4xl text-gray-300 mb-2" />
                <p className="text-gray-500">No applications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <div
                    key={application.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className={`p-3 flex items-center justify-between ${
                      application.status === 'pending' ? 'bg-yellow-50' :
                      application.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center">
                        <span className={`p-1.5 rounded-full ${
                          application.status === 'pending' ? 'bg-yellow-100' :
                          application.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {getStatusIcon(application.status)}
                        </span>
                        <span className="ml-2 font-medium capitalize text-gray-800">
                          {application.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(application.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          {application.recruiter?._isPlaceholder ? (
                            <div className="bg-red-50 px-3 py-2 rounded border border-red-200">
                              <h3 className="font-semibold text-gray-900">{application.recruiter.name}</h3>
                              <p className="text-red-600 text-xs mt-1">This user has been deleted from the system</p>
                              <p className="text-gray-600 text-sm flex items-center mt-1">
                                <FaUser className="mr-1 text-gray-400" size={12} />
                                Original ID: {application.recruiter_id}
                              </p>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-gray-900">{application.recruiter.name}</h3>
                              <p className="text-gray-600 text-sm flex items-center">
                                <FaUser className="mr-1 text-gray-400" size={12} />
                                {application.recruiter.email}
                              </p>
                              {application.recruiter.company && (
                                <p className="text-gray-600 text-sm mt-1">
                                  Company: {application.recruiter.company}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        
                        {application.status === 'rejected' && application.recruiter?._isPlaceholder ? (
                          <button
                            onClick={() => deleteApplication(application.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                            title="Permanently delete this application"
                          >
                            <FaTrash className="h-4 w-4" />
                            Delete
                          </button>
                        ) : (
                          <button
                            onClick={() => openModal(application)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                          >
                            <FaEdit className="h-4 w-4" />
                            Manage
                          </button>
                        )}
                      </div>
                      
                      {application.admin_notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
                          <p className="text-sm text-gray-600 mt-1">{application.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for updating application */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Manage Application
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                {selectedApplication.recruiter?._isPlaceholder ? (
                  <div className="bg-red-50 px-3 py-2 rounded border border-red-200 mb-2">
                    <p className="text-sm font-medium text-gray-700">Deleted User</p>
                    <p className="text-red-600 text-xs mt-1">
                      This user has been deleted from the system. You can still update the application status,
                      but any changes won't affect the user as they no longer exist.
                    </p>
                    <p className="text-gray-600 text-sm mt-1">Original ID: {selectedApplication.recruiter_id}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Applicant: {selectedApplication.recruiter.name}</p>
                    <p className="text-sm text-gray-600">Email: {selectedApplication.recruiter.email}</p>
                    {selectedApplication.recruiter.company && (
                      <p className="text-sm text-gray-600">Company: {selectedApplication.recruiter.company}</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add notes about this decision..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateApplication}
                  disabled={isUpdating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Application'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default EmployerApplicationsPage; 