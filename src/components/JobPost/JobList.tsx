import React, { useState } from 'react';
import Link from 'next/link';
import { FaEye, FaEdit, FaTrash, FaUser, FaFilter, FaSearch, FaSortAmountDown, FaSortAmountUp, FaUserShield, FaUserTie } from 'react-icons/fa';
import { JobPosting } from '@/types';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

interface JobListProps {
  jobs: JobPosting[];
  onView: (job: JobPosting) => void;
  onEdit: (job: JobPosting) => void;
  onDelete: (jobId: string) => void;
}

const JobList: React.FC<JobListProps> = ({ jobs, onView, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('postedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [posterFilter, setPosterFilter] = useState<string>('all');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  
  // Filter and sort jobs
  const filteredJobs = jobs.filter(job => {
    // Apply search filter
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job.company && job.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    // Apply poster filter
    const matchesPoster = posterFilter === 'all' || 
                         (posterFilter === 'admin' && (job.postedByRole === 'admin' || job.postedByRole === 'superadmin' || job.postedByRole === 'super_admin')) ||
                         (posterFilter === 'recruiter' && job.postedByRole === 'recruiter');
    
    return matchesSearch && matchesStatus && matchesPoster;
  }).sort((a, b) => {
    // Apply sorting
    if (sortField === 'title') {
      return sortDirection === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortField === 'company') {
      const companyA = a.company || '';
      const companyB = b.company || '';
      return sortDirection === 'asc'
        ? companyA.localeCompare(companyB)
        : companyB.localeCompare(companyA);
    } else if (sortField === 'location') {
      return sortDirection === 'asc'
        ? a.location.localeCompare(b.location)
        : b.location.localeCompare(a.location);
    } else if (sortField === 'postedDate') {
      const dateA = new Date(a.postedDate).getTime();
      const dateB = new Date(b.postedDate).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'postedBy') {
      const posterA = a.postedByUser?.name || a.postedByRole || '';
      const posterB = b.postedByUser?.name || b.postedByRole || '';
      return sortDirection === 'asc'
        ? posterA.localeCompare(posterB)
        : posterB.localeCompare(posterA);
    }
    return 0;
  });
  
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />;
  };
  
  const handleDeleteClick = (jobId: string) => {
    setJobToDelete(jobId);
    setShowDeleteConfirmation(true);
  };
  
  const confirmDelete = () => {
    if (jobToDelete) {
      onDelete(jobToDelete);
      setShowDeleteConfirmation(false);
      setJobToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setJobToDelete(null);
  };
  
  if (jobs.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500">No jobs have been posted yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="relative md:w-1/3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="form-input pl-10 w-full"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter */}
            <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="flex items-center mr-2 text-sm text-gray-600">
                <FaFilter className="mr-1" /> Status:
              </span>
              <select
                className="form-select text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
              </div>
              
              <div className="flex items-center">
                <span className="flex items-center mr-2 text-sm text-gray-600">
                  <FaUser className="mr-1" /> Posted By:
                </span>
                <select
                  className="form-select text-sm"
                  value={posterFilter}
                  onChange={(e) => setPosterFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="admin">Admin</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('title')}
                >
                  <div className="flex items-center">
                    Job Title
                    {getSortIcon('title')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('company')}
                >
                  <div className="flex items-center">
                    Company
                    {getSortIcon('company')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('location')}
                >
                  <div className="flex items-center">
                    Location
                    {getSortIcon('location')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('postedDate')}
                >
                  <div className="flex items-center">
                    Posted Date
                    {getSortIcon('postedDate')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('postedBy')}
                >
                  <div className="flex items-center">
                    Posted By
                    {getSortIcon('postedBy')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No jobs found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.postedDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        {job.postedByRole === 'admin' || job.postedByRole === 'superadmin' || job.postedByRole === 'super_admin' ? (
                          <FaUserShield className="mr-2 text-blue-600" title="Admin" />
                        ) : (
                          <FaUserTie className="mr-2 text-green-600" title="Recruiter" />
                        )}
                        <div>
                          <div className="font-medium">{job.postedByUser?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 capitalize">{job.postedByRole || 'unknown'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        job.status?.toLowerCase() === 'open' ? 'bg-green-100 text-green-800' :
                        job.status?.toLowerCase() === 'closed' ? 'bg-red-100 text-red-800' :
                        job.status?.toLowerCase() === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1).toLowerCase() : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/admin/jobs/${job.id}`}>
                        <div className="flex items-center space-x-1 text-secondary hover:text-secondary-dark group cursor-pointer">
                          <FaUser className="mr-1" size={14} />
                          <span>{job.applications?.length || 0}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onView(job)}
                          className="text-primary hover:text-primary-dark"
                          title="View"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => onEdit(job)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(job.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Delete Job Posting"
        message="Are you sure you want to delete this job posting? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonType="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
};

export default JobList; 