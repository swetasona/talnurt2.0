import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import { 
  FaUserShield, 
  FaUsers, 
  FaUserTie,
  FaDatabase,
  FaCog, 
  FaClipboardList,
  FaChartLine,
  FaExclamationTriangle
} from 'react-icons/fa';

const SuperDashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/super-admin/signin');
      return;
    }
    
    if (status !== 'loading') {
      if (session?.user?.role !== 'super_admin') {
        // Redirect non-super admins
        router.push('/auth/super-admin/signin');
        return;
      }
      setIsLoading(false);
    }
  }, [session, status, router]);
  
  if (isLoading || status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!session || session.user.role !== 'super_admin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center max-w-md">
            <FaExclamationTriangle className="mr-2" />
            <span>Access denied. Super admin privileges required.</span>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  // Features available to Super Admin
  const adminFeatures = [
    {
      title: 'User Management',
      icon: <FaUsers className="h-8 w-8 text-blue-500" />,
      description: 'Manage all user accounts including applicants, recruiters, and admin users.',
      link: '/admin/super-dashboard/users',
    },
    {
      title: 'Admin Management',
      icon: <FaUserTie className="h-8 w-8 text-indigo-500" />,
      description: 'Create, edit, and manage administrator accounts and permissions.',
      link: '/admin/super-dashboard/admins',
    },
    {
      title: 'System Settings',
      icon: <FaCog className="h-8 w-8 text-gray-500" />,
      description: 'Configure global system settings, security policies, and feature flags.',
      link: '/admin/super-dashboard/settings',
    },
    {
      title: 'Database Management',
      icon: <FaDatabase className="h-8 w-8 text-green-500" />,
      description: 'Database administration tools, backup, and maintenance operations.',
      link: '/admin/super-dashboard/database',
    },
    {
      title: 'Audit Logs',
      icon: <FaClipboardList className="h-8 w-8 text-yellow-500" />,
      description: 'Review system audit logs, user activity, and security events.',
      link: '/admin/super-dashboard/audit',
    },
    {
      title: 'Analytics Dashboard',
      icon: <FaChartLine className="h-8 w-8 text-purple-500" />,
      description: 'Advanced analytics and usage metrics for the entire platform.',
      link: '/admin/super-dashboard/analytics',
    }
  ];

  return (
    <AdminLayout>
      <Head>
        <title>Super Admin Dashboard | Talnurt Recruitment Portal</title>
      </Head>
      <div className="py-8 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {session.user.name}. You have full system administration privileges.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center bg-blue-50 px-4 py-2 rounded-lg">
            <FaUserShield className="text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">Super Admin</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-white">
              <h2 className="text-xl font-bold">System Administration</h2>
              <p className="mt-1 opacity-90">
                You have access to all system functions and administrative capabilities.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => router.push('/admin/super-dashboard/settings')}
                className="px-4 py-2 bg-white text-blue-800 rounded-md hover:bg-blue-50 transition-colors font-medium"
              >
                System Settings
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {adminFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
              onClick={() => router.push(feature.link)}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Remember: Super admin actions are logged and audited for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SuperDashboardPage; 