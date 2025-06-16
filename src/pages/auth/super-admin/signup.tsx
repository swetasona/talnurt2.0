import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const SuperAdminSignUp: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    registrationKey: '', // Security key for super admin registration
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.registrationKey) {
      setError('All fields are required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await axios.post('/api/admin/super-admin/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        registrationKey: formData.registrationKey,
      });

      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/auth/super-admin/signin');
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      // Show more detailed error information
      let errorMessage = 'An error occurred during registration. Please try again.';
      
      if (err.response) {
        // Server responded with an error status code
        errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your network connection.';
        console.error('Request made but no response received');
      } else {
        // Error in setting up the request
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-gray-800 shadow-xl rounded-lg p-8">
          <div className="text-center">
            <FaCheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="mt-6 text-3xl font-bold text-white">Registration Successful</h2>
            <p className="mt-2 text-gray-400">Your super admin account has been created.</p>
            <div className="mt-6">
              <Link href="/auth/super-admin/signin" className="text-blue-400 hover:text-blue-300">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Super Admin Registration | Talnurt Recruitment Portal</title>
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
              Super Admin Registration
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Register a privileged super admin account
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
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
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password (at least 8 characters)"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="registrationKey" className="sr-only">
                  Registration Key
                </label>
                <input
                  id="registrationKey"
                  name="registrationKey"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Super Admin Registration Key"
                  value={formData.registrationKey}
                  onChange={handleChange}
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
                {isLoading && (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  </span>
                )}
                {isLoading ? 'Registering...' : 'Create Super Admin Account'}
              </button>
            </div>
          </form>
          
          <div className="text-center">
            <p className="mt-2 text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/super-admin/signin" className="font-medium text-blue-500 hover:text-blue-400">
                Sign in
              </Link>
            </p>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              This registration requires an official registration key provided by the system administrator.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperAdminSignUp; 