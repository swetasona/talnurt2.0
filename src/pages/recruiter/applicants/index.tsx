import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaDownload, FaEnvelope, FaExternalLinkAlt, FaGithub, FaLinkedin, FaPhone, FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/router';

interface Applicant {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobLocation: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  resumeUrl: string | null;
  phoneNumber: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  status: string;
  appliedDate: string;
}

interface ApplicantsPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const ApplicantsPage: React.FC<ApplicantsPageProps> = ({ user }) => {
  const router = useRouter();
  const { jobId: initialJobId } = router.query;
  
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState(initialJobId || 'all');
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    // Set the job filter if it's in the URL
    if (initialJobId && initialJobId !== 'all') {
      setJobFilter(initialJobId as string);
    }
  }, [initialJobId]);
  
    const fetchApplicants = async () => {
      try {
        setIsLoading(true);
        
        // Construct URL with query parameters if needed
        let url = '/api/recruiter/applicants';
        if (jobFilter && jobFilter !== 'all') {
          url += `?jobId=${jobFilter}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch applicants');
        }
        
        const data = await response.json();
        setApplicants(data);
        
        // Extract unique jobs for filter
        const uniqueJobs = Array.from(
          new Map(data.map((item: Applicant) => [item.jobId, { id: item.jobId, title: item.jobTitle }]))
        ).map(([_, job]) => job);
        
        setJobs(uniqueJobs as { id: string; title: string }[]);
      setError(''); // Clear any previous errors
      } catch (error) {
        console.error('Error fetching applicants:', error);
        setError('Failed to load applicants. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchApplicants();
  }, [jobFilter]);

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/job-applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Update local state
      setApplicants(prevApplicants => 
        prevApplicants.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error('Error updating application status:', error);
      setError('Failed to update status. Please try again.');
    }
  };

  const filteredApplicants = applicants.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesJob = jobFilter === 'all' || app.jobId === jobFilter;
    return matchesStatus && matchesJob;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <RecruiterLayout>
      <Head>
        <title>Applicants | Recruiter Dashboard</title>
      </Head>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Applicants</h1>
            <p className="text-gray-600">Review and manage applicants for your job postings</p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4154ef] focus:ring-[#4154ef] sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="interviewed">Interviewed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label htmlFor="jobFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Job
              </label>
              <select
                id="jobFilter"
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4154ef] focus:ring-[#4154ef] sm:text-sm"
              >
                <option value="all">All Jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            <p>{error}</p>
            <button 
              onClick={fetchApplicants}
              className="mt-4 px-4 py-2 bg-[#4154ef] text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-[#4154ef]/20 rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-[#4154ef]/20 rounded mb-3"></div>
              <div className="h-3 w-24 bg-[#4154ef]/10 rounded"></div>
            </div>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <FaUserCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applicants found</h3>
            <p className="text-gray-500 mb-4">
              {statusFilter !== 'all' || jobFilter !== 'all'
                ? 'No applicants match your current filters. Try changing your filters or check back later.'
                : 'You have no applicants yet. Post a job to start receiving applications.'}
            </p>
            <Link
              href="/recruiter/jobs/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#4154ef] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4154ef]"
            >
              Post a New Job
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-4 bg-[#4154ef]/10 p-3 rounded text-sm text-[#4154ef] flex items-center">
              <FaExternalLinkAlt className="mr-2" />
              <span>Click on any row to view detailed applicant information</span>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Applicant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Job
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Applied On
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplicants.map((applicant) => (
                  <tr 
                    key={applicant.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/recruiter/applicants/${applicant.applicantId}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-[#4154ef]/10 rounded-full flex items-center justify-center text-[#4154ef]">
                          {applicant.applicantName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div 
                            className="text-sm font-medium text-gray-900 hover:text-[#4154ef]"
                          >
                            {applicant.applicantName}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FaEnvelope className="mr-1 h-3 w-3" />
                            <a 
                              href={`mailto:${applicant.applicantEmail}`} 
                              className="hover:text-[#4154ef]"
                              onClick={(e) => e.stopPropagation()} // Prevent row click when clicking email
                            >
                              {applicant.applicantEmail}
                            </a>
                          </div>
                          {applicant.phoneNumber && (
                            <div className="flex items-center text-sm text-gray-500">
                              <FaPhone className="mr-1 h-3 w-3" />
                              <a 
                                href={`tel:${applicant.phoneNumber}`} 
                                className="hover:text-[#4154ef]"
                                onClick={(e) => e.stopPropagation()} // Prevent row click when clicking phone
                              >
                                {applicant.phoneNumber}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{applicant.jobTitle}</div>
                      <div className="text-sm text-gray-500">{applicant.jobCompany}</div>
                      <div className="text-sm text-gray-500">{applicant.jobLocation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                          applicant.status
                        )}`}
                      >
                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(applicant.appliedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {applicant.resumeUrl && (
                          <a
                            href={applicant.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4154ef] hover:text-blue-700"
                            title="Download Resume"
                            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking resume
                          >
                            <FaDownload />
                          </a>
                        )}
                        {applicant.linkedinUrl && (
                          <a
                            href={applicant.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4154ef] hover:text-blue-700"
                            title="LinkedIn Profile"
                            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking LinkedIn
                          >
                            <FaLinkedin />
                          </a>
                        )}
                        {applicant.githubUrl && (
                          <a
                            href={applicant.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4154ef] hover:text-blue-700"
                            title="GitHub Profile"
                            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking GitHub
                          >
                            <FaGithub />
                          </a>
                        )}
                        <div className="relative ml-2 inline-block text-left">
                          <select
                            value={applicant.status}
                            onChange={(e) => {
                              e.stopPropagation(); // Prevent row click when changing status
                              updateApplicationStatus(applicant.id, e.target.value);
                            }}
                            className="block w-full rounded-md border-gray-300 py-1 pl-3 pr-8 text-xs focus:border-[#4154ef] focus:outline-none focus:ring-[#4154ef]"
                            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking select
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="interviewed">Interviewed</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/recruiter/applicants/${applicant.applicantId}`);
                          }}
                          className="ml-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-[#4154ef] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4154ef]"
                          title="View Applicant Details"
                        >
                          <FaExternalLinkAlt className="mr-1" size={10} />
                          View
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
    </RecruiterLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || session.user.role !== 'recruiter') {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.user.id || '',
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: session.user.role || 'recruiter',
      },
    },
  };
};

export default ApplicantsPage; 