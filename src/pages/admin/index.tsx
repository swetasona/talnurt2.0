import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const AdminPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin login page
    router.replace('/admin/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Admin Access | Talnurt Recruitment Portal</title>
      </Head>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to admin login...</p>
      </div>
    </div>
  );
};

export default AdminPage; 