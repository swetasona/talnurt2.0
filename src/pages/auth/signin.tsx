import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import AuthLayout from '@/components/Auth/AuthLayout';
import { FaGoogle, FaLinkedin, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  // If user is already logged in, redirect them to appropriate dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role === 'recruiter') {
        router.push('/recruiter/dashboard');
      } else if (session.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const callbackUrl = router.query.callbackUrl ? String(router.query.callbackUrl) : '/dashboard';
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        role: 'applicant',
      });

      if (result?.error) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Redirect to the callback URL or dashboard
      router.push(callbackUrl);
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An error occurred during sign in');
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Default to dashboard but allow for query param override
    const callbackUrl = router.query.callbackUrl ? String(router.query.callbackUrl) : '/dashboard';
    signIn(provider, { callbackUrl });
  };

  // If still checking authentication status, show loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-blue-100 rounded mb-3"></div>
            <div className="h-3 w-24 bg-blue-50 rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Sign In | Talnurt Recruitment Portal</title>
        <meta name="description" content="Sign in to your Talnurt account to access job opportunities and recruitment services." />
      </Head>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 md:py-20">
          <section className="w-full md:w-1/2 max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10 flex flex-col gap-8 mx-auto">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Sign in to your account</h2>
              <p className="text-gray-500 mb-6 text-center text-base">Welcome back! Please enter your credentials to access your account.</p>
            </div>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-md mb-4" role="alert">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold shadow-sm hover:shadow-md transition"
                >
                  <FaGoogle className="h-5 w-5 text-red-500 mr-2" /> Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('linkedin')}
                  className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold shadow-sm hover:shadow-md transition"
                >
                  <FaLinkedin className="h-5 w-5 text-blue-600 mr-2" /> LinkedIn
                </button>
              </div>
              <div className="relative flex items-center my-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="mx-4 text-gray-400 text-sm">Or continue with email</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50"
                  />
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    Forgot password?
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 mt-2"
                >
                  Sign in
                </button>
              </form>
            </div>
            <div className="text-center space-y-2 mt-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-800">
                  Create account
                </Link>
              </p>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm text-gray-600">
                  Are you a recruiter?{' '}
                  <Link href="/auth/recruiter/signin" className="font-medium text-blue-600 hover:text-blue-800">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default SignInPage; 