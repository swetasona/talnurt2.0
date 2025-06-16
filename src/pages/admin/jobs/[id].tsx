import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import ApplicationsTable from '@/components/JobPost/ApplicationsTable';
import { JobPosting, JobApplication } from '@/types';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaBriefcase, FaBuilding, FaList, FaUserTie, FaSyncAlt, FaClock, FaGlobe, FaCheckSquare, FaIndustry, FaGraduationCap, FaTools } from 'react-icons/fa';
import Head from 'next/head';

interface JobDetailProps {
  job: JobPosting;
  initialApplications: JobApplication[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { id } = context.params || {};
    
    if (!id || typeof id !== 'string') {
      return { notFound: true };
    }
    
    // Fetch job from API
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.VERCEL_URL || 'localhost:3000';
    
    // Fetch job details
    const jobRes = await fetch(`${protocol}://${host}/api/jobs/${id}`);
    
    if (!jobRes.ok) {
      console.error(`Failed to fetch job with ID ${id}. Status: ${jobRes.status}`);
      return { notFound: true };
    }
    
    const job = await jobRes.json();
    
    // Fetch applications for this job
    const applicationsRes = await fetch(`${protocol}://${host}/api/job-applications/by-job/${id}`);
    let applications: JobApplication[] = [];
    
    if (applicationsRes.ok) {
      applications = await applicationsRes.json();
    } else {
      console.error(`Failed to fetch applications for job ${id}. Status: ${applicationsRes.status}`);
    }
    
    return {
      props: {
        job,
        initialApplications: applications,
      },
    };
  } catch (error) {
    console.error('Error in job details getServerSideProps:', error);
    return { notFound: true };
  }
};

const JobDetailPage: React.FC<JobDetailProps> = ({ job, initialApplications }) => {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications);
  const [isLoading, setIsLoading] = useState(false);

  // Format the date properly
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

  // Format salary with currency
  const formatSalary = (salary: string | number | undefined, currency?: string) => {
    if (!salary) return 'Not specified';
    
    const currencySymbol = currency || 'USD';
    
    // If it's a range like "90000-115000"
    if (typeof salary === 'string' && salary.includes('-')) {
      const parts = salary.split('-');
      const formatted = parts.map(part => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currencySymbol,
          maximumFractionDigits: 0
        }).format(Number(part.trim()));
      });
      return `${formatted[0]} - ${formatted[1]}`;
    }
    
    // Single number
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencySymbol,
      maximumFractionDigits: 0
    }).format(Number(salary));
  };

  // Refresh applications
  const refreshApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/job-applications/by-job/${job.id}`);
      if (res.ok) {
        const freshApplications = await res.json();
        setApplications(freshApplications);
      } else {
        console.error('Failed to fetch applications:', res.status);
      }
    } catch (error) {
      console.error('Error refreshing applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle application status change
  const handleStatusChange = async (applicationId: string, newStatus: JobApplication['status']) => {
    try {
      const res = await fetch(`/api/job-applications/status/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        // Update applications state with the new status
        setApplications(applications.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        ));
      } else {
        console.error('Failed to update application status:', await res.text());
        alert('Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('An error occurred while updating the application status');
    }
  };

  // Get status badge for the job
  const getJobStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'open':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">Open</span>;
      case 'closed':
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full">Closed</span>;
      case 'draft':
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1 rounded-full">Draft</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">{status || 'Unknown'}</span>;
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>{`${job?.title || 'Job Detail'} | Talnurt Recruitment Portal`}</title>
      </Head>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.push('/admin/job-post')}
            className="flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <FaArrowLeft className="mr-2" /> 
            <span>Back to Job Postings</span>
          </button>
          
          <button
            onClick={refreshApplications}
            className="bg-gradient-to-r from-primary to-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition-all flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <FaSyncAlt className="mr-2" />
                <span>Refresh Applications</span>
              </>
            )}
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-indigo-500/10"></div>
            <div className="relative p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-xl h-16 w-16 flex items-center justify-center shadow-lg">
                  <FaBriefcase className="text-2xl" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    {getJobStatusBadge(job.status || '')}
                    {job.isFeatured && (
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">Featured</span>
                    )}
                    {job.isNew && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">New</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                    {job.company && (
                      <div className="flex items-center">
                        <FaBuilding className="mr-2 text-primary" />
                        <span>{job.company}</span>
                      </div>
                    )}
                    {job.department && (
                      <div className="flex items-center">
                        <FaUserTie className="mr-2 text-primary" />
                        <span>{job.department}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-primary" />
                      <span>{job.location}</span>
                    </div>
                    {job.jobType && (
                      <div className="flex items-center">
                        <FaBriefcase className="mr-2 text-primary" />
                        <span>{job.jobType}</span>
                      </div>
                    )}
                    {job.workMode && (
                      <div className="flex items-center">
                        <FaGlobe className="mr-2 text-primary" />
                        <span>{job.workMode}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mt-2">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2 text-primary" />
                      <span>Posted on {formatDate(job.postedDate)}</span>
                    </div>
                    {job.deadline && (
                      <div className="flex items-center">
                        <FaClock className="mr-2 text-primary" />
                        <span>Deadline: {formatDate(job.deadline)}</span>
                      </div>
                    )}
                    {job.salary && (
                      <div className="flex items-center">
                        <FaDollarSign className="mr-2 text-primary" />
                        <span>{formatSalary(job.salary, job.currency)}</span>
                      </div>
                    )}
                    {job.experience && (
                      <div className="flex items-center">
                        <FaCheckSquare className="mr-2 text-primary" />
                        <span>Experience: {job.experience}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:border-l md:border-gray-200 md:pl-6 pt-4 md:pt-0 flex-shrink-0">
                  <div className="flex flex-col items-center md:items-start gap-1">
                    <div className="text-xs text-gray-500 font-medium uppercase">Applications</div>
                    <div className="text-3xl font-bold text-primary">{applications.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 sticky top-24">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center text-gray-900 font-semibold">
                <FaList className="mr-2 text-primary" />
                <h2 className="text-lg">Job Details</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {job.summary && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-yellow-100 p-1.5 rounded-lg text-yellow-600 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Summary
                  </h3>
                  <div className="text-gray-600 leading-relaxed text-sm">
                    {job.summary}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="bg-blue-100 p-1.5 rounded-lg text-primary mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Job Description
                </h3>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                  {job.description}
                </div>
              </div>
              
              {job.responsibilities && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Responsibilities
                  </h3>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                    {job.responsibilities}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="bg-green-100 p-1.5 rounded-lg text-green-600 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Requirements
                </h3>
                <ul className="space-y-2 text-sm">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-0.5">•</span>
                      <span className="text-gray-600">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {job.skills && job.skills.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-blue-100 p-1.5 rounded-lg text-blue-600 mr-2">
                      <FaTools className="h-4 w-4" />
                    </span>
                    Skills Required
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {job.benefits && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-purple-100 p-1.5 rounded-lg text-purple-600 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </span>
                    Benefits
                  </h3>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                    {job.benefits}
                  </div>
                </div>
              )}
              
              {(job.applicationEmail || job.applicationUrl || job.contactPerson) && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="bg-red-100 p-1.5 rounded-lg text-red-600 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </span>
                    Contact Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    {job.contactPerson && (
                      <div className="flex items-start">
                        <span className="text-gray-500 mr-2">Contact Person:</span>
                        <span className="text-gray-600">{job.contactPerson}</span>
                      </div>
                    )}
                    {job.applicationEmail && (
                      <div className="flex items-start">
                        <span className="text-gray-500 mr-2">Email:</span>
                        <a href={`mailto:${job.applicationEmail}`} className="text-primary hover:underline">
                          {job.applicationEmail}
                        </a>
                      </div>
                    )}
                    {job.applicationUrl && (
                      <div className="flex items-start">
                        <span className="text-gray-500 mr-2">Apply at:</span>
                        <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          External Application Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <ApplicationsTable
            applications={applications}
            isLoading={isLoading}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default JobDetailPage; 