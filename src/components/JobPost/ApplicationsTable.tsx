import React from 'react';
import Link from 'next/link';
import { JobApplication } from '@/types';
import { FaDownload, FaCheckCircle, FaTimesCircle, FaUserClock, FaComments, FaFileAlt, FaEye, FaUser } from 'react-icons/fa';

interface ApplicationsTableProps {
  applications: JobApplication[];
  isLoading: boolean;
  onStatusChange: (applicationId: string, newStatus: JobApplication['status']) => void;
}

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({ 
  applications, 
  isLoading,
  onStatusChange
}) => {
  // Format date to a more readable format
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Helper to get appropriate status badge
  const getStatusBadge = (status: JobApplication['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            <FaUserClock className="mr-1 text-yellow-500" size={10} />
            Pending Review
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <FaEye className="mr-1 text-blue-500" size={10} />
            Reviewed
          </span>
        );
      case 'interviewed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <FaComments className="mr-1 text-purple-500" size={10} />
            Interviewed
          </span>
        );
      case 'offered':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <FaCheckCircle className="mr-1 text-green-500" size={10} />
            Offered
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <FaTimesCircle className="mr-1 text-red-500" size={10} />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  // Process resume URL
  const getResumeId = (resumeUrl: string): string => {
    if (!resumeUrl) return '';
    
    // If it's our resume API format
    if (resumeUrl.includes('/api/resume/')) {
      const parts = resumeUrl.split('/api/resume/');
      return parts[parts.length - 1].split('?')[0]; // Get ID and remove query params
    }
    
    // For other URLs
    return '';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-primary"></div>
        <p className="mt-4 text-gray-600">Loading applications...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
          <FaUserClock size={28} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          This job posting hasn't received any applications yet. When candidates apply, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-900 font-semibold">
            <FaUser className="mr-2 text-primary" />
            <h2 className="text-lg">Applications ({applications.length})</h2>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50/80">
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Applicant
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Applied Date
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Resume
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {applications.map((application) => {
              const resumeId = getResumeId(application.resumeUrl);
              
              return (
                <tr key={application.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center text-primary border border-primary/10">
                        <span className="font-semibold text-sm">
                          {application.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{application.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{application.email}</div>
                        {application.phone && <div className="text-xs text-gray-500 mt-0.5">{application.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{formatDate(application.appliedDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(application.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {resumeId ? (
                      <Link href={`/resume/${resumeId}`}>
                        <div className="flex items-center text-primary hover:text-indigo-600 transition-colors cursor-pointer font-medium text-sm">
                          <FaFileAlt className="mr-1.5" size={14} />
                          <span>View Resume</span>
                        </div>
                      </Link>
                    ) : application.resumeUrl ? (
                      <a 
                        href={application.resumeUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-primary hover:text-indigo-600 transition-colors font-medium text-sm"
                      >
                        <FaFileAlt className="mr-1.5" size={14} />
                        <span>View Resume</span>
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No resume</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <select
                        value={application.status}
                        onChange={(e) => onStatusChange(application.id as string, e.target.value as JobApplication['status'])}
                        className="block py-2 px-3 text-sm border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      
                      {application.resumeUrl && (
                        resumeId ? (
                          <a 
                            href={`/api/resume/${resumeId}`}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                            aria-label="Download Resume"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FaDownload size={16} />
                          </a>
                        ) : (
                          <a 
                            href={application.resumeUrl}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                            aria-label="Download Resume"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FaDownload size={16} />
                          </a>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationsTable; 