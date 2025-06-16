import React, { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import CandidateForm from '@/components/Talent/CandidateForm';
import { Candidate } from '@/types';
import Link from 'next/link';
import { FaArrowLeft, FaUserPlus } from 'react-icons/fa';
import Head from 'next/head';

const AddCandidatePage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (candidate: Candidate) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidate),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add candidate');
      }
      
      setSuccess('Candidate added successfully!');
      
      // Redirect back to candidates list after a short delay
      setTimeout(() => {
        router.push('/admin/my-talent');
      }, 2000);
    } catch (error: any) {
      console.error('Error adding candidate:', error);
      setError(error.message || 'Failed to add candidate');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Add Candidate | Talnurt Recruitment Portal</title>
      </Head>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Enhanced header area with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-md mb-8 p-6">
          <div className="flex items-center">
            <Link 
              href="/admin/my-talent"
              className="mr-4 p-2 bg-white bg-opacity-20 text-white hover:bg-opacity-30 rounded-full transition-colors"
            >
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <FaUserPlus className="mr-3" /> Add New Candidate
              </h1>
              <p className="text-blue-100 mt-1">
                Create a new candidate profile with their personal information and resume
              </p>
            </div>
          </div>
        </div>

        {/* Status messages with enhanced styling */}
        {error && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-6 border-l-4 border-red-500 shadow-sm">
            <div className="font-medium">Error</div>
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-100 text-green-800 rounded-lg mb-6 border-l-4 border-green-500 shadow-sm">
            <div className="font-medium">Success</div>
            <div>{success}</div>
          </div>
        )}

        {isLoading && (
          <div className="text-center p-6 mb-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Processing your request...</p>
          </div>
        )}

        {/* Main content area */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Form card with better visual hierarchy */}
          <div className="p-6">
            <CandidateForm 
              onSubmit={handleSubmit} 
              onCancel={() => router.push('/admin/my-talent')}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddCandidatePage; 