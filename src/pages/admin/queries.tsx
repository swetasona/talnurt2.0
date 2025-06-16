import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaEnvelope, FaSearch, FaFilter, FaExternalLinkAlt, FaCheckCircle, FaArchive, FaSpinner, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

// Define the submission type
interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  phoneNumber: string | null;
  status: string;
  submittedAt: string;
  updatedAt: string;
}

// Define pagination type
interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const QueriesPage: NextPage = () => {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; id: string | null }>({
    show: false,
    id: null
  });

  // Fetch submissions with current page and filters
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/contact/submissions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      
      const data = await response.json();
      setSubmissions(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  // Load submissions on mount and when page/filters change
  useEffect(() => {
    fetchSubmissions();
  }, [pagination.page, statusFilter]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    // Reset to page 1 when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle search (client-side filtering for simplicity)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation would depend on whether you want to do client-side filtering
    // or add search parameter to the API call
    fetchSubmissions();
  };

  // Handle opening the detail view for a submission
  const handleOpenSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
  };

  // Handle closing the detail view
  const handleCloseDetail = () => {
    setSelectedSubmission(null);
  };

  // Handle submission status update
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdateLoading(true);
    try {
      const response = await fetch(`/api/contact/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update submission status');
      }
      
      // Update local state
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(submission => 
          submission.id === id ? { ...submission, status: newStatus } : submission
        )
      );
      
      // Update selected submission if it's currently open
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status: newStatus });
      }
      
      toast.success(`Submission status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating submission status:', error);
      toast.error('Failed to update submission status');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (id: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.stopPropagation();
    }
    setDeleteConfirmation({ show: true, id });
  };

  // Close delete confirmation modal
  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({ show: false, id: null });
  };

  // Handle delete submission
  const handleDeleteSubmission = async () => {
    if (!deleteConfirmation.id) return;
    
    const id = deleteConfirmation.id;
    setUpdateLoading(true);
    
    try {
      const response = await fetch(`/api/contact/submissions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete submission');
      }
      
      // Remove submission from local state
      setSubmissions(prevSubmissions => 
        prevSubmissions.filter(submission => submission.id !== id)
      );
      
      // Close detail modal if it's the deleted submission
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission(null);
      }
      
      toast.success('Query deleted successfully');
      closeDeleteConfirmation();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete query');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Renders pagination controls
  const renderPagination = () => {
    const { page, pages } = pagination;
    
    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div>
          <span className="text-sm text-gray-700">
            Showing page {page} of {pages}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 border rounded-md bg-white text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          
          {/* Simple page numbers - could be enhanced for more pages */}
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 border rounded-md ${
                  pageNum === page
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pages}
            className="px-3 py-1 border rounded-md bg-white text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contact Queries</h1>
          <p className="text-gray-600 mt-2">
            View and manage customer inquiries submitted through the contact form.
          </p>
        </header>

        {/* Filters and Search */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="statusFilter" className="text-gray-700 whitespace-nowrap">
              Filter by status:
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="RESPONDED">Responded</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 md:max-w-sm">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FaFilter className="text-gray-400" />
              </button>
            </div>
          </form>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <FaSpinner className="animate-spin text-primary h-8 w-8" />
              <span className="ml-2 text-gray-700">Loading submissions...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center p-12">
              <FaEnvelope className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No queries found</h3>
              <p className="text-gray-500">
                {statusFilter ? 
                  `No ${statusFilter.toLowerCase()} queries found.` : 
                  "No contact form submissions yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr 
                      key={submission.id} 
                      className="hover:bg-gray-50 cursor-pointer transition duration-150"
                      onClick={() => handleOpenSubmission(submission)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{submission.name}</div>
                        {submission.phoneNumber && (
                          <div className="text-xs text-gray-500 mt-1">{submission.phoneNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 truncate max-w-[200px]">
                          {submission.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {submission.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            submission.status === 'PENDING' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : submission.status === 'RESPONDED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center space-x-4">
                          <button
                            className="text-red-500 hover:text-red-700 transition duration-150 p-1 rounded-full hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteConfirmation(submission.id, e);
                            }}
                            title="Delete query"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                          <button
                            className="text-primary hover:text-primary-dark transition duration-150 p-1 rounded-full hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSubmission(submission);
                            }}
                            title="View details"
                          >
                            <FaExternalLinkAlt className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {!loading && submissions.length > 0 && renderPagination()}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Query Details</h3>
              <button
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-1">{selectedSubmission.subject}</h4>
                    <p className="text-sm text-gray-500">
                      Submitted {new Date(selectedSubmission.submittedAt).toLocaleString()} 
                      ({formatDistanceToNow(new Date(selectedSubmission.submittedAt), { addSuffix: true })})
                    </p>
                  </div>
                  <span 
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedSubmission.status === 'PENDING' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : selectedSubmission.status === 'RESPONDED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedSubmission.status}
                  </span>
                </div>
              </div>
              
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Contact Name</h5>
                  <p className="text-gray-900">{selectedSubmission.name}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Email Address</h5>
                  <p className="text-gray-900">{selectedSubmission.email}</p>
                </div>
                {selectedSubmission.phoneNumber && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Phone Number</h5>
                    <p className="text-gray-900">{selectedSubmission.phoneNumber}</p>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Message</h5>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-800 whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => openDeleteConfirmation(selectedSubmission.id)}
                  disabled={updateLoading}
                >
                  {updateLoading ? <FaSpinner className="animate-spin mr-2 -ml-1" /> : <FaTrash className="mr-2 -ml-1" />}
                  Delete
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={handleCloseDetail}
                >
                  Close
                </button>
                {selectedSubmission.status === 'PENDING' && (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    onClick={() => handleUpdateStatus(selectedSubmission.id, 'RESPONDED')}
                    disabled={updateLoading}
                  >
                    {updateLoading ? <FaSpinner className="animate-spin mr-2 -ml-1" /> : <FaCheckCircle className="mr-2 -ml-1" />}
                    Mark as Responded
                  </button>
                )}
                {selectedSubmission.status !== 'ARCHIVED' && (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    onClick={() => handleUpdateStatus(selectedSubmission.id, 'ARCHIVED')}
                    disabled={updateLoading}
                  >
                    {updateLoading ? <FaSpinner className="animate-spin mr-2 -ml-1" /> : <FaArchive className="mr-2 -ml-1" />}
                    Archive
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="bg-red-50 p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Confirmation</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this query? This action cannot be undone.
              </p>
            </div>
            
            <div className="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleDeleteSubmission}
                disabled={updateLoading}
              >
                {updateLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
                Delete
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={closeDeleteConfirmation}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default QueriesPage; 