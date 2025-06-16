import React, { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import JobForm from '@/components/JobPost/JobForm';
import { JobPosting } from '@/types';
import { FaArrowLeft, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';
import Head from 'next/head';

const NewJobPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdJob, setCreatedJob] = useState<JobPosting | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddJob = async (job: JobPosting) => {
    setIsSubmitting(true);
    try {
      console.log('Adding job:', job);
      const res = await fetch('/api/admin/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job),
      });
      
      if (res.ok) {
        const newJob = await res.json();
        console.log('Job added successfully:', newJob);
        setCreatedJob(newJob);
        setShowSuccessModal(true);
      } else {
        const errorData = await res.json();
        console.error('Server responded with error:', res.status, errorData);
        setErrorMessage(errorData.error || 'Failed to add job');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error adding job:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add job. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(true);
  };

  const confirmCancel = () => {
    router.push('/admin/job-post');
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push('/admin/job-post');
  };

  const handleViewJob = () => {
    if (createdJob) {
      window.open(`/jobs/${createdJob.id}`, '_blank');
    }
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  return (
    <AdminLayout>
      <Head>
        <title>Create Job Posting | Talnurt Recruitment Portal</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/job-post" className="text-blue-600 hover:text-blue-800 flex items-center mr-4">
              <FaArrowLeft className="mr-2" />
              Back to Jobs
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Create Job Posting</h1>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-gray-600">Create a new job posting for your organization</p>
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
          <JobForm 
            onSubmit={handleAddJob}
            hideHeading={true}
            onCancel={handleCancel}
          />
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <FaExclamationCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cancel Job Creation?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to cancel? All unsaved changes will be lost.
                </p>
                
                <div className="flex justify-center space-x-4 mt-5">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    onClick={() => setShowConfirmDialog(false)}
                  >
                    Continue Editing
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={confirmCancel}
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <FaCheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Job Created Successfully!</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Your job posting "<strong>{createdJob?.title}</strong>" has been created successfully and is now live.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <button
                    type="button"
                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={handleViewJob}
                  >
                    View Job
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={handleSuccessClose}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showErrorModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <FaExclamationCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {errorMessage}
                </p>
                
                <div className="flex justify-center space-x-4 mt-5">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    onClick={handleErrorClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default NewJobPage; 