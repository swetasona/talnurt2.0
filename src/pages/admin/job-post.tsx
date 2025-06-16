import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '@/components/Layout/AdminLayout';
import JobList from '@/components/JobPost/JobList';
import { JobPosting } from '@/types';
import { FaFileExcel, FaUpload, FaDownload } from 'react-icons/fa';
import AlertBox from '@/components/shared/AlertBox';

const JobPost: React.FC = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<JobPosting[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Alert state
  const [alert, setAlert] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });
  
  // Memoize alert helper functions to prevent unnecessary re-renders
  const showAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlert({
      show: true,
      type,
      title,
      message,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, show: false }));
  }, []);

  // Memoize refresh function to prevent unnecessary re-renders
  const refreshJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Refreshing jobs list...');
      const res = await fetch('/api/admin/jobs');
      if (res.ok) {
        const freshJobs = await res.json();
        console.log('Fresh jobs loaded:', freshJobs.length, 'jobs');
        setJobs(freshJobs);
      } else {
        console.error('Failed to fetch jobs:', await res.text());
        showAlert('error', 'Error', 'Failed to fetch jobs. Please try again.');
      }
    } catch (error) {
      console.error('Error refreshing jobs:', error);
      showAlert('error', 'Error', 'Failed to fetch jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  // Load jobs on component mount - use empty dependency array to prevent multiple calls
  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleEditJob = useCallback((job: JobPosting) => {
    router.push(`/admin/job-post/edit/${job.id}`);
  }, [router]);
  
  const handleDeleteJob = useCallback(async (jobId: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/jobs/${jobId}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          await refreshJobs();
        showAlert('success', 'Success', 'Job posting deleted successfully.');
        } else {
          const error = await res.json();
          throw new Error(error.message || 'Failed to delete job');
        }
      } catch (error) {
        console.error('Error deleting job:', error);
      showAlert('error', 'Error', 'Failed to delete job. Please try again.');
      } finally {
        setIsLoading(false);
    }
  }, [refreshJobs, showAlert]);
  
  const handleViewJob = useCallback((job: JobPosting) => {
    console.log('Opening job in new tab:', job.id);
    window.open(`/jobs/${job.id}`, '_blank');
  }, []);

  const handleImportClick = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  const downloadTemplate = useCallback(() => {
    window.location.href = '/api/jobs/import/template';
  }, []);

  const handleSelectFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/jobs/import/parse', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to parse Excel file');
      }
      
      const data = await response.json();
      console.log('Parsed job data:', data.jobs.length, 'jobs');
      
      setImportData(data.jobs);
      setShowUploadModal(false);
      setShowImportModal(true);
    } catch (error) {
      console.error('Error importing jobs:', error);
      showAlert('error', 'Import Error', 'Failed to import job data. Please check your Excel file format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [showAlert]);

  const confirmImport = useCallback(async () => {
    setIsImporting(true);
    
    try {
      const response = await fetch('/api/jobs/import/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobs: importData }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to import jobs');
      }
      
      const result = await response.json();
      console.log('Import result:', result.count, 'jobs imported');
      
      setShowImportModal(false);
      setImportData([]);
      await refreshJobs();
      showAlert('success', 'Success', `Successfully imported ${result.count} jobs.`);
    } catch (error) {
      console.error('Error saving imported jobs:', error);
      showAlert('error', 'Import Error', 'Failed to save imported jobs. Please try again.');
    } finally {
      setIsImporting(false);
    }
  }, [importData, refreshJobs, showAlert]);

  const cancelImport = useCallback(() => {
    setShowImportModal(false);
    setImportData([]);
  }, []);
  
  // Memoize expensive computations
  const memoizedJobList = useMemo(() => (
    <JobList 
      jobs={jobs} 
      onView={handleViewJob}
      onEdit={handleEditJob}
      onDelete={handleDeleteJob}
    />
  ), [jobs, handleViewJob, handleEditJob, handleDeleteJob]);
  
  return (
    <AdminLayout>
      <Head>
        <title>Manage Job Postings | Talnurt</title>
        <meta name="description" content="Create and manage job postings for your organization" />
      </Head>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-gray-600">Create and manage job postings for your organization</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button 
            className="btn btn-secondary flex items-center gap-2"
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <span>Importing...</span>
              </>
            ) : (
              <>
                <FaFileExcel className="text-lg" />
                <span>Import Jobs</span>
              </>
            )}
          </button>
            <button 
              className="btn btn-secondary"
              onClick={refreshJobs}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          <button 
            className="btn btn-primary"
            onClick={() => router.push('/admin/job-post/new')}
          >
            Post a Job
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}
      
      {!isLoading && (
        memoizedJobList
      )}

      {/* Import Jobs Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 transform transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Import Jobs from Excel</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Upload an Excel file (.xlsx or .xls) with job details.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Maximum file size: 10MB. Make sure the file follows the template format.
              </p>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <FaFileExcel className="mx-auto text-4xl text-green-600 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Select Excel File</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Choose an Excel file to import job postings
                </p>
                
              <button 
                  className="btn btn-primary flex items-center gap-2 mx-auto"
                onClick={handleSelectFile}
                disabled={isImporting}
              >
                {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                ) : (
                  <>
                      <FaUpload />
                      <span>Select Excel File</span>
                  </>
                )}
              </button>
            </div>

              {/* Download Template Button */}
              <div className="mt-4 text-center">
                <button 
                  className="btn btn-outline btn-sm flex items-center gap-2 mx-auto"
                  onClick={downloadTemplate}
                >
                  <FaDownload />
                  <span>Download Template</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={isImporting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Modal */}
      {showImportModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 transform transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Job Import</h3>
              <button
                onClick={cancelImport}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isImporting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Please review the following {importData.length} jobs before importing:
              </p>
            
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0">
                  <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Job Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                  </tr>
                </thead>
                  <tbody className="bg-white">
                  {importData.map((job, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900 border-b">{job.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 border-b">{job.company || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 border-b">{job.location}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 border-b">{job.jobType || '-'}</td>
                        <td className="px-4 py-3 text-sm border-b">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            job.status === 'open' ? 'bg-green-100 text-green-800' :
                            job.status === 'closed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={cancelImport}
                className="btn btn-secondary"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="btn btn-primary flex items-center gap-2"
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <FaUpload />
                    <span>Import {importData.length} Jobs</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Alert Box */}
      <AlertBox
        isOpen={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
      />
    </AdminLayout>
  );
};

export default JobPost; 