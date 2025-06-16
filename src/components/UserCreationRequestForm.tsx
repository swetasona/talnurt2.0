import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaUserTie, FaPlus, FaTimes, FaSpinner, FaCheck, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

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

interface UserCreationRequestFormProps {
  onRequestSubmitted?: () => void;
}

const UserCreationRequestForm: React.FC<UserCreationRequestFormProps> = ({ onRequestSubmitted }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [requests, setRequests] = useState<UserCreationRequest[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    manager_id: ''
  });

  useEffect(() => {
    fetchData();
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
        onRequestSubmitted?.();
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-blue-500 text-2xl mr-3" />
          <span className="text-gray-600">Loading user creation requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FaUserTie className="mr-2 text-blue-500" />
            User Creation Requests
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Request creation of manager and employee accounts
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <FaPlus className="mr-2" />
          New Request
        </button>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
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
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaUserTie className="mx-auto text-4xl mb-3 text-gray-300" />
            <p>No user creation requests yet.</p>
            <p className="text-sm">Click "New Request" to create your first request.</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-gray-800">{request.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{request.email}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="capitalize">{request.role}</span>
                    {request.manager && (
                      <span>Manager: {request.manager.name}</span>
                    )}
                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(request.status)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserCreationRequestForm; 