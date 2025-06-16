import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FaExclamationTriangle, FaHome, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';

interface ErrorPageProps {}

const AuthErrorPage: React.FC<ErrorPageProps> = () => {
  const router = useRouter();
  const { error } = router.query;
  
  useEffect(() => {
    // Handle special cases with redirects
    if (error === 'RoleChanged') {
      router.replace('/auth/signout?reason=role_change');
    }
  }, [error, router]);

  const getErrorMessage = (errorType: string | string[] | undefined) => {
    const errorString = Array.isArray(errorType) ? errorType[0] : errorType;
    
    switch (errorString) {
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There is a problem with the server configuration.',
          suggestion: 'Please contact support if this error persists.'
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in.',
          suggestion: 'Please check your credentials or contact an administrator.'
        };
      case 'Verification':
        return {
          title: 'Verification Failed',
          message: 'The verification token has expired or has already been used.',
          suggestion: 'Please request a new verification email.'
        };
      case 'CredentialsSignin':
        return {
          title: 'Invalid Credentials',
          message: 'The email or password you entered is incorrect.',
          suggestion: 'Please check your credentials and try again.'
        };
      case 'EmailCreateAccount':
        return {
          title: 'Email Account Creation Failed',
          message: 'Could not create user account with the provided email.',
          suggestion: 'Please try again or contact support.'
        };
      case 'Callback':
        return {
          title: 'Callback Error',
          message: 'There was an error during the authentication callback.',
          suggestion: 'Please try signing in again.'
        };
      case 'OAuthSignin':
        return {
          title: 'OAuth Sign In Error',
          message: 'There was an error signing in with your social account.',
          suggestion: 'Please try again or use a different sign-in method.'
        };
      case 'OAuthCallback':
        return {
          title: 'OAuth Callback Error',
          message: 'There was an error during OAuth authentication.',
          suggestion: 'Please try signing in again.'
        };
      case 'OAuthCreateAccount':
        return {
          title: 'OAuth Account Creation Failed',
          message: 'Could not create account using OAuth provider.',
          suggestion: 'Please try again or contact support.'
        };
      case 'EmailSignin':
        return {
          title: 'Email Sign In Error',
          message: 'Could not send sign-in email.',
          suggestion: 'Please check your email address and try again.'
        };
      case 'SessionRequired':
        return {
          title: 'Session Required',
          message: 'You must be signed in to view this page.',
          suggestion: 'Please sign in to continue.'
        };
      case 'RoleChanged':
        return {
          title: 'Role Changed',
          message: 'Your account role has been updated. You need to sign in again.',
          suggestion: 'Please sign in again to access your account with your new permissions.'
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          suggestion: 'Please try again or contact support if the problem persists.'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <>
      <Head>
        <title>Authentication Error | Talnurt</title>
        <meta name="description" content="Authentication error occurred" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <FaExclamationTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            
            {/* Content */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {errorInfo.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {errorInfo.message}
              </p>
              <p className="text-sm text-gray-500 mb-8">
                {errorInfo.suggestion}
              </p>
              
              {/* Error details for debugging */}
              {error && process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
                  <p className="text-xs text-gray-500 font-mono">
                    Error: {Array.isArray(error) ? error[0] : error}
                  </p>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <FaArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </button>
              
              <Link
                href="/auth/signin"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <FaSignInAlt className="mr-2 h-4 w-4" />
                Try Sign In Again
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

export default AuthErrorPage; 