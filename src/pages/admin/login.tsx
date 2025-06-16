import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FaShieldAlt, FaLock, FaUser } from 'react-icons/fa';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminLogin: React.FC = () => {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('Frontend: Starting login with:', { email, password: password ? '***' : 'empty' });

    try {
      const success = await login(email, password);
      console.log('Frontend: Login result:', success);
      
      if (success) {
        console.log('Frontend: Login successful, redirecting to dashboard');
        router.push('/admin/dashboard');
      } else {
        console.log('Frontend: Login failed, setting error message');
        setError('Invalid email or password. Please check your credentials.');
      }
    } catch (err) {
      console.error('Frontend: Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Admin Login | Talnurt Recruitment Portal</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <FaShieldAlt className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Admin Access
            </h2>
            <p className="mt-2 text-center text-sm text-blue-200">
              Welcome back, superadmin. Please sign in to access the admin panel.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-white/20 bg-white/10 placeholder-blue-200 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent sm:text-sm"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-white/20 bg-white/10 placeholder-blue-200 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent sm:text-sm"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-blue-900 ${
                    isLoading 
                      ? 'bg-blue-200 cursor-not-allowed' 
                      : 'bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300'
                  } transition-all duration-200`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-900 border-t-transparent rounded-full mr-2" />
                      Signing in...
                    </div>
                  ) : (
                    'Sign In to Admin Panel'
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-blue-200">
                Superadmin access only. Unauthorized access is prohibited.
              </p>
              <div className="mt-2 text-xs text-blue-300 bg-blue-900/30 rounded p-2">
                <p><strong>Email:</strong> admin@talnurt.com</p>
                <p><strong>Password:</strong> Admin@123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin; 