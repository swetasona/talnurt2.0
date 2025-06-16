import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import JobForm from '@/components/JobPost/JobForm';
import { JobPosting } from '@/types';
import { FaArrowLeft, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';

const CreateJobPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdJob, setCreatedJob] = useState<JobPosting | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleCreateJob = async (job: JobPosting) => {
    setIsSubmitting(true);
    try {
      console.log('Creating job:', job);
      
      const res = await fetch('/api/recruiter/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job),
      });
      
      if (res.ok) {
        const newJob = await res.json();
        console.log('Job created successfully:', newJob);
        setCreatedJob(newJob);
        setShowSuccessModal(true);
      } else {
        const errorData = await res.json();
        console.error('Server responded with error:', res.status, errorData);
        throw new Error(errorData.error || 'Failed to create job');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      alert(`Failed to create job: ${error instanceof Error ? error.message : 'Please try again.'}`);
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
    if (createdJob) {
      window.open(`/jobs/${createdJob.id}`, '_blank');
    }
  };

  return (
    <RecruiterLayout>
      <Head>
        <title>Post New Job | Recruiter Dashboard | Talnurt</title>
        <meta name="description" content="Create a new job posting to attract top talent" />
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
                <h1 className="text-3xl font-bold text-gray-900">Post New Job</h1>
                <p className="text-gray-600 mt-1">Create an engaging job posting to attract the best candidates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full">
                  <span className="font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Job Details</h3>
                  <p className="text-sm text-gray-500">Fill in the job information</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="h-2 w-32 bg-blue-200 rounded-full">
                  <div className="h-2 w-16 bg-blue-600 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-500">50%</span>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Job Posting</h3>
                <p className="text-gray-600">Please wait while we process your job posting...</p>
              </div>
            </div>
          </div>
        )}

        {/* Job Form */}
        {!isSubmitting && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <JobForm 
              onSubmit={handleCreateJob}
              hideHeading={true}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && createdJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Job Posted Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  Your job posting "<strong>{createdJob.title}</strong>" has been created and is now live.
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

export default CreateJobPage; 