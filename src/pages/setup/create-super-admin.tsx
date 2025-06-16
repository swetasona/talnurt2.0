import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaShieldAlt, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const CreateSuperAdminPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    setupKey: '', // Security key for initial super admin setup
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.setupKey) {
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
      console.log('Submitting registration with setup key:', formData.setupKey);
      
      const response = await axios.post('/api/admin/super-admin/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        registrationKey: formData.setupKey, // Setup key is sent as registration key
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Registration successful:', response.data);
      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/auth/super-admin/signin');
      }, 3000);
    } catch (err: any) {
      console.error('Setup error:', err);
      let errorMessage = 'An error occurred during super admin setup. Please try again.';
      
      if (err.response) {
        // Server responded with an error status code
        errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
        console.error('Response data:', err.response.data);
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8">
          <div className="text-center">
            <FaCheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Setup Complete</h2>
            <p className="mt-2 text-gray-600">Super admin account has been created successfully.</p>
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-4">You will be redirected to the login page shortly...</p>
              <Link href="/auth/super-admin/signin" className="text-blue-600 hover:text-blue-800 font-medium">
                Go to Login Now
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
        <title>System Setup - Create Super Admin | Talnurt Recruitment Portal</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                <FaShieldAlt className="h-14 w-14 text-blue-600" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              System Setup
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Create the initial super administrator account
            </p>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Create a strong password (min 8 characters)"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="setupKey" className="block text-sm font-medium text-gray-700 mb-1">
                  System Setup Key
                </label>
                <input
                  id="setupKey"
                  name="setupKey"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter the system setup key"
                  value={formData.setupKey}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-gray-500">
                  The default setup key is: talnurt-super-admin-key-2024
                </p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isLoading ? 'Setting up...' : 'Complete Setup & Create Super Admin'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 text-sm">Important Information</h3>
              <p className="text-xs text-blue-600 mt-1">
                This setup page should only be used during the initial system configuration.
                After creating the first super admin, this page should be disabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateSuperAdminPage; 