import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { FaSignInAlt, FaHome, FaSync } from 'react-icons/fa';

const SignOutPage: React.FC = () => {
  const router = useRouter();
  const { reason } = router.query;

  useEffect(() => {
    // Automatically sign out when this page loads
    signOut({ redirect: false }).catch(console.error);
  }, []);

  const getMessage = () => {
    switch (reason) {
      case 'role_change':
        return {
          title: 'Your Role Has Been Updated',
          message: 'Your account role has been changed by an administrator. You have been signed out to apply these changes.',
          suggestion: 'Please sign in again to access your account with your new permissions.'
        };
      case 'session_expired':
        return {
          title: 'Session Expired',
          message: 'Your session has expired for security reasons.',
          suggestion: 'Please sign in again to continue using the platform.'
        };
      default:
        return {
          title: 'You Have Been Signed Out',
          message: 'You have been successfully signed out of your account.',
          suggestion: 'Thank you for using our platform. Sign in again anytime.'
        };
    }
  };

  const messageInfo = getMessage();

  return (
    <>
      <Head>
        <title>Signed Out | Talnurt</title>
        <meta name="description" content="You have been signed out of your account" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
              <FaSync className="h-8 w-8 text-blue-600" aria-hidden="true" />
            </div>
            
            {/* Content */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {messageInfo.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {messageInfo.message}
              </p>
              <p className="text-sm text-gray-500 mb-8">
                {messageInfo.suggestion}
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <FaSignInAlt className="mr-2 h-4 w-4" />
                Sign In
              </Link>
              
              <Link
                href="/"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <FaHome className="mr-2 h-4 w-4" />
                Return Home
              </Link>
            </div>
            
            {/* Support contact */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact{' '}
                <a href="mailto:support@talnurt.com" className="text-blue-600 hover:text-blue-500">
                  support@talnurt.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignOutPage; 