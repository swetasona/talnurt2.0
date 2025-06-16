import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import JobForm from '@/components/JobPost/JobForm';
import { JobPosting } from '@/types';
import { FaArrowLeft, FaExclamationCircle, FaCheckCircle, FaExternalLinkAlt, FaUsers } from 'react-icons/fa';
import Link from 'next/link';

interface EditJobPageProps {
  jobId: string;
}

const EditJobPage: React.FC<EditJobPageProps> = ({ jobId }) => {
  const router = useRouter();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch job data on component mount
  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recruiter/jobs/${jobId}`);
      
      if (response.ok) {
        const jobData = await response.json();
        setJob(jobData);
      } else if (response.status === 404) {
        setError('Job not found');
      } else if (response.status === 403) {
        setError('You are not authorized to edit this job');
      } else {
        setError('Failed to load job data');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setError('Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async (updatedJob: JobPosting) => {
    setIsSubmitting(true);
    try {
      console.log('Updating job:', updatedJob);
      
      const res = await fetch(`/api/recruiter/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedJob),
      });
      
      if (res.ok) {
        const updatedJobData = await res.json();
        console.log('Job updated successfully:', updatedJobData);
        setJob(updatedJobData);
        setShowSuccessModal(true);
      } else {
        const errorData = await res.json();
        console.error('Server responded with error:', res.status, errorData);
        throw new Error(errorData.error || 'Failed to update job');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      alert(`Failed to update job: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(true);
  };

  const confirmCancel = () => {
    router.push('/recruiter/jobs');
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push('/recruiter/jobs');
  };

  const handleViewJob = () => {
    if (job) {
      window.open(`/jobs/${job.id}`, '_blank');
    }
  };

  const handleViewApplicants = () => {
    if (job) {
      router.push(`/recruiter/applicants?jobId=${job.id}`);
    }
  };

  if (loading) {
    return (
      <RecruiterLayout>
        <Head>
          <title>Edit Job | Recruiter Dashboard | Talnurt</title>
        </Head>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Job Data</h3>
              <p className="text-gray-600">Please wait while we fetch the job details...</p>
            </div>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  if (error) {
    return (
      <RecruiterLayout>
        <Head>
          <title>Edit Job | Recruiter Dashboard | Talnurt</title>
        </Head>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationCircle className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Job</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => router.push('/recruiter/jobs')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back to My Jobs
                </button>
                <button 
                  onClick={fetchJob}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <RecruiterLayout>
      <Head>
        <title>Edit Job: {job.title} | Recruiter Dashboard | Talnurt</title>
        <meta name="description" content={`Edit job posting: ${job.title}`} />
      </Head>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/recruiter/jobs" 
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Back to My Jobs
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Job Posting</h1>
                <p className="text-gray-600 mt-1">Update your job posting: <strong>{job.title}</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full">
                  <FaExclamationCircle className="text-lg" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Editing Job</h3>
                  <p className="text-sm text-gray-500">Update job information and settings</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleViewJob}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <FaExternalLinkAlt className="mr-2 text-sm" />
                  View Job
                </button>
                {job.applications && job.applications.length > 0 && (
                  <button
                    onClick={handleViewApplicants}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <FaUsers className="mr-2 text-sm" />
                    View {job.applications.length} {job.applications.length === 1 ? 'Applicant' : 'Applicants'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Updating Job Posting</h3>
                <p className="text-gray-600">Please wait while we save your changes...</p>
              </div>
            </div>
          </div>
        )}

        {/* Job Form */}
        {!isSubmitting && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <JobForm 
              onSubmit={handleUpdateJob}
              initialData={job}
              hideHeading={true}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && job && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Job Updated Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  Your job posting "<strong>{job.title}</strong>" has been updated.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleViewJob}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View Job
                  </button>
                  <button 
                    onClick={handleSuccessClose}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <FaExclamationCircle className="text-yellow-500 text-xl mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Confirm Cancel</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel? All unsaved changes will be lost.
              </p>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue Editing
                </button>
                <button 
                  onClick={confirmCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  
  if (typeof id !== 'string') {
    return {
      notFound: true,
    };
  }
  
  return {
    props: {
      jobId: id,
    },
  };
};

export default EditJobPage; 