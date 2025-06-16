import React from 'react';
import { useSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ProfileForm from '@/components/Profile/ProfileForm';
import { authOptions } from '../api/auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import { FaUserEdit, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import Navbar from '@/components/Layout/Navbar';

const ProfileCompletePage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <FaSpinner className="animate-spin h-10 w-10 text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Head>
        <title>Complete Your Profile | Talnurt</title>
        <meta name="description" content="Complete your Talnurt profile to help employers find you for relevant positions" />
      </Head>
      <Navbar />
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Profile header */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-primary/5 -z-10 rounded-3xl transform -skew-y-2"></div>
            <div className="text-center py-10 px-4">
              <div className="bg-gradient-to-r from-primary to-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FaUserEdit className="text-white text-4xl" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Complete Your <span className="text-primary">Profile</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Tell us about yourself to help employers find you for relevant positions
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Stand out to employers</span>
                </div>
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Get personalized job matches</span>
                </div>
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Higher response rates</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile form card */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 mb-12">
            <div className="relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full opacity-50 -z-0"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-tr-full opacity-50 -z-0"></div>
              
              <div className="px-6 py-8 md:p-10 relative z-10">
                <ProfileForm />
              </div>
            </div>
          </div>
          
          {/* Help note */}
          <div className="bg-blue-50 border-l-4 border-primary p-5 rounded-lg mb-8 max-w-3xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm leading-5 font-medium text-primary">Need help?</h3>
                <div className="mt-2 text-sm leading-5 text-blue-700">
                  <p>
                    If you have any questions or need assistance completing your profile, please contact our support team at{' '}
                    <a href="mailto:support@talnurt.com" className="font-medium underline">support@talnurt.com</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Back button */}
          <div className="text-center mb-8">
            <Link href="/dashboard" className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200">
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Talnurt. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/profile/complete',
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
};

export default ProfileCompletePage; 