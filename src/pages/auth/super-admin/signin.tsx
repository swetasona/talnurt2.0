import React, { useState } from 'react';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FaShieldAlt, FaLock } from 'react-icons/fa';

const SuperAdminSignIn: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { callbackUrl } = router.query;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        role: 'super_admin', // This will be checked in the authorize callback
      });

      if (result?.error) {
        setError('Invalid email or password. Super admin access only.');
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard or callback URL
      router.push(callbackUrl ? String(callbackUrl) : '/admin/super-dashboard');
    } catch (err) {
      console.error('Authentication error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Super Admin Access | Talnurt Recruitment Portal</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center">
                <FaShieldAlt className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Super Admin Access
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Restricted area. Authorized personnel only.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaLock className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Super admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isLoading ? (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  </span>
                ) : (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <FaLock
                      className="h-5 w-5 text-blue-500 group-hover:text-blue-400"
                      aria-hidden="true"
                    />
                  </span>
                )}
                {isLoading ? 'Authenticating...' : 'Access System'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              This is a restricted access point for super administrators only.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperAdminSignIn; 