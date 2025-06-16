import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import AdminLayout from '@/components/Layout/AdminLayout';
import JobForm from '@/components/JobPost/JobForm';
import { JobPosting } from '@/types';
import { FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';
import Link from 'next/link';
import Head from 'next/head';

interface EditJobPageProps {
  initialJob: JobPosting | null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  
  try {
    // Fetch the job data
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.VERCEL_URL || 'localhost:3000';
    const url = `${protocol}://${host}/api/jobs/${id}`;
    
    console.log('SSR: Fetching job from URL:', url);
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch job. Status: ${res.status}`);
    }
    
    const job = await res.json();
    console.log('SSR: Successfully fetched job:', job);
    
    return {
      props: {
        initialJob: job,
      },
    };
  } catch (error) {
    console.error('SSR: Error fetching job:', error);
    // Return null for the job if there's an error
    return {
      props: {
        initialJob: null,
      },
    };
  }
};

const EditJobPage: React.FC<EditJobPageProps> = ({ initialJob }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Redirect if job not found
  useEffect(() => {
    if (!initialJob && !router.isFallback) {
      router.push('/admin/job-post');
    }
  }, [initialJob, router]);

  const handleUpdateJob = async (job: JobPosting) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job),
      });
      
      if (res.ok) {
        const updatedJob = await res.json();
        console.log('Job updated successfully:', updatedJob);
        router.push('/admin/job-post');
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update job');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/job-post');
  };

  if (!initialJob) {
    return (
      <AdminLayout>
        <div className="p-4 text-center">
          <div className="text-gray-600">Loading job data...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Edit Job Posting | Talnurt Recruitment Portal</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Link href={`/admin/jobs/${initialJob.id}`} className="text-blue-600 hover:text-blue-800 flex items-center mr-4">
              <FaArrowLeft className="mr-2" />
              Back to Job Details
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Edit Job Posting</h1>
          </div>
        </div>
        
        {isSubmitting && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Updating job...</p>
          </div>
        )}
        
        {!isSubmitting && (
          <JobForm 
            onSubmit={handleUpdateJob}
            initialData={initialJob}
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cancel Job Editing?</h3>
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
                    onClick={() => router.push('/admin/job-post')}
                  >
                    Discard Changes
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

export default EditJobPage; 