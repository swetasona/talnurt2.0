import React from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/Layout/AdminLayout';
import DeepSeekResumeParserPage from '../deepseek-resume-parser';

const AdminDeepSeekResumeParserPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center mb-6">
          <Link href="/admin/my-talent" className="text-blue-500 hover:text-blue-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to My Talent
          </Link>
        </div>
        
        {/* Include the DeepSeekResumeParserPage component */}
        <DeepSeekResumeParserPage />
      </div>
    </AdminLayout>
  );
};

export default AdminDeepSeekResumeParserPage; 