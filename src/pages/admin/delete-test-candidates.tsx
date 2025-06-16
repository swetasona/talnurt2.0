import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import toast from 'react-hot-toast';
import { FaTrash } from 'react-icons/fa';

const DeleteTestCandidatesPage = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDeleteCandidates = async () => {
    try {
      setIsDeleting(true);
      setResult(null);
      
      const response = await fetch('/api/admin/delete-test-candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        if (data.deletedCandidates.length > 0) {
          toast.success(`Successfully deleted ${data.deletedCandidates.length} test candidates`);
        } else {
          toast('No candidates were found to delete', {
            icon: 'ℹ️',
          });
        }
      } else {
        toast.error(data.error || 'Failed to delete test candidates');
      }
    } catch (error) {
      console.error('Error deleting candidates:', error);
      toast.error('An error occurred while deleting candidates');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <RecruiterLayout>
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Delete Test Candidates</h1>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This will permanently delete the test candidates "DlhfAnFJag" and "test" from the database.
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="mb-2 font-medium">Candidates to be deleted:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Name: <strong>DlhfAnFJag</strong>, Email: <strong>swetasona@gmail.com</strong></li>
            <li>Name: <strong>test</strong>, Email: <strong>john.smith@example.com</strong></li>
          </ul>
        </div>
        
        <button
          onClick={handleDeleteCandidates}
          disabled={isDeleting}
          className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <FaTrash className="mr-2" />
          {isDeleting ? 'Deleting...' : 'Delete Test Candidates'}
        </button>
        
        {result && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Result:</h2>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto">
              <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session || session.user.role !== 'admin') {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  
  return {
    props: { session },
  };
};

export default DeleteTestCandidatesPage; 