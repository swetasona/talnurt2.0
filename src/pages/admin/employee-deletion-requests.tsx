import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaCheckCircle, FaTimesCircle, FaUsers, FaUserMinus, FaUserCog } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Head from 'next/head';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Requester {
  id: string;
  name: string;
  email: string;
}

interface Company {
  id: string;
  name: string;
}

interface DeletionRequest {
  id: string;
  employee: Employee;
  requested_by_user: Requester;
  company: Company;
  reason: string;
  status: string;
  created_at: string;
  processed_at?: string;
  admin_notes?: string;
}

// Format date helper function
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Format time helper function
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
};

export default function EmployeeDeletionRequestsPage() {
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Fetch deletion requests
  useEffect(() => {
    async function fetchDeletionRequests() {
      try {
        const response = await fetch('/api/admin/employee-deletion-requests');
        if (!response.ok) {
          throw new Error('Failed to fetch deletion requests');
        }
        const data = await response.json();
        setDeletionRequests(data.deletionRequests || []);
      } catch (error) {
        console.error('Error fetching deletion requests:', error);
        toast.error('Failed to load deletion requests');
      } finally {
        setLoading(false);
      }
    }

    fetchDeletionRequests();
  }, []);

  const openModal = (request: DeletionRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setAdminNotes('');
    setActionType(action);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setActionType(null);
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      const response = await fetch('/api/admin/employee-deletion-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: actionType === 'approve' ? 'approved' : 'rejected',
          admin_notes: adminNotes
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} deletion request`);
      }

      const data = await response.json();
      
      // Update the local state
      setDeletionRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: actionType === 'approve' ? 'approved' : 'rejected', admin_notes: adminNotes, processed_at: new Date().toISOString() } 
            : req
        )
      );

      toast.success(`Employee deletion request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      closeModal();
    } catch (error) {
      console.error(`Error ${actionType}ing deletion request:`, error);
      toast.error(`Failed to ${actionType} deletion request`);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'pending') {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>;
    } else if (status === 'approved') {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">Approved</span>;
    } else if (status === 'rejected') {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">Rejected</span>;
    }
    return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
  };

  // Get stats
  const statsData = {
    pending: deletionRequests.filter(req => req.status === 'pending').length,
    approved: deletionRequests.filter(req => req.status === 'approved').length,
    rejected: deletionRequests.filter(req => req.status === 'rejected').length,
    total: deletionRequests.length
  };

  return (
    <AdminLayout>
      <Head>
        <title>Employee Deletion Requests | Talnurt Recruitment Portal</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <FaUserMinus className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Employee Deletion Requests</h1>
                <p className="text-red-100 mt-1">
                  Review and manage requests to remove employees from companies
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <h3 className="text-2xl font-bold text-gray-800">{statsData.total}</h3>
              </div>
              <FaUsers className="text-blue-400 text-2xl" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <h3 className="text-2xl font-bold text-gray-800">{statsData.pending}</h3>
              </div>
              <FaUserCog className="text-yellow-400 text-2xl" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <h3 className="text-2xl font-bold text-gray-800">{statsData.approved}</h3>
              </div>
              <FaCheckCircle className="text-green-400 text-2xl" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <h3 className="text-2xl font-bold text-gray-800">{statsData.rejected}</h3>
              </div>
              <FaTimesCircle className="text-red-400 text-2xl" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : deletionRequests.length === 0 ? (
            <div className="text-center py-16 bg-gray-50">
              <FaUserMinus className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Deletion Requests</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                There are currently no employee deletion requests to review. New requests will appear here when employers submit them.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deletionRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            {request.employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{request.employee.name}</div>
                            <div className="text-sm text-gray-500">{request.employee.email}</div>
                            <div className="text-xs text-gray-400">Role: {request.employee.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.company.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.requested_by_user.name}</div>
                        <div className="text-sm text-gray-500">{request.requested_by_user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{request.reason}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(request.created_at)}</div>
                        <div className="text-xs text-gray-500">{formatTime(request.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(request, 'approve')}
                              className="bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1 rounded-md flex items-center space-x-1"
                            >
                              <FaCheckCircle size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => openModal(request, 'reject')}
                              className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-md flex items-center space-x-1"
                            >
                              <FaTimesCircle size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <div className="text-xs text-gray-500">
                            {request.processed_at && (
                              <div className="flex items-center text-gray-500 mb-1">
                                <span className="font-medium">Processed:</span> 
                                <span className="ml-1">{formatDate(request.processed_at)}</span>
                              </div>
                            )}
                            {request.admin_notes && (
                              <div className="flex items-start mt-1 text-gray-500">
                                <span className="font-medium whitespace-nowrap mr-1">Notes:</span>
                                <span className="italic">{request.admin_notes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approval/Rejection Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center mb-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                actionType === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {actionType === 'approve' ? <FaCheckCircle size={18} /> : <FaTimesCircle size={18} />}
              </div>
              <h3 className="text-lg font-semibold">
                {actionType === 'approve' ? 'Approve' : 'Reject'} Employee Deletion Request
              </h3>
            </div>
            
            <div className="mb-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-gray-600">
                  {selectedRequest.employee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{selectedRequest.employee.name}</div>
                  <div className="text-sm text-gray-500">{selectedRequest.employee.email}</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Company:</span> {selectedRequest.company.name}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Requested by:</span> {selectedRequest.requested_by_user.name}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Reason:</span> {selectedRequest.reason}
              </div>
            </div>
            
            {actionType === 'approve' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-sm text-yellow-700">
                  <strong>Warning:</strong> Approving this request will deactivate the employee account. They will no longer be able to access the system, but their data will be preserved.
                </p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter any notes about this decision..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 text-white rounded-md transition-colors ${
                  actionType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                onClick={handleAction}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 