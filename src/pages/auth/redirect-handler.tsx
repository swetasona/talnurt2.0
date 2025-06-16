import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const RedirectHandler: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') {
      return;
    }

    // If no session, redirect to sign in
    if (!session) {
      console.log('No session found, redirecting to signin');
      router.replace('/auth/signin');
      return;
    }

    // Get the user's role and redirect to appropriate dashboard
    const userRole = session.user?.role;
    console.log('RedirectHandler: User role detected:', userRole);

    if (!userRole) {
      console.log('No role found, redirecting to signin');
      router.replace('/auth/signin');
      return;
    }

    // Determine the correct dashboard based on role
    let dashboardUrl = '/dashboard'; // Default for applicants

    switch (userRole) {
      case 'super_admin':
        dashboardUrl = '/admin/super-dashboard';
        break;
      case 'admin':
        dashboardUrl = '/admin/dashboard';
        break;
      case 'recruiter':
      case 'unassigned':
      case 'employee':
      case 'manager':
        dashboardUrl = '/recruiter/dashboard';
        break;
      case 'employer':
        dashboardUrl = '/recruiter/employer/dashboard';
        break;
      case 'applicant':
      default:
        dashboardUrl = '/dashboard';
        break;
    }

    console.log(`RedirectHandler: Redirecting ${userRole} to ${dashboardUrl}`);
    
    // Use replace to prevent back button issues
    router.replace(dashboardUrl);
  }, [session, status, router]);

  // Show loading state while determining redirect
  return (
    <>
      <Head>
        <title>Redirecting... | Talnurt</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Redirecting to your dashboard...</h2>
          <p className="text-sm text-gray-500">Please wait while we determine your account access.</p>
        </div>
      </div>
    </>
  );
};

export default RedirectHandler; 