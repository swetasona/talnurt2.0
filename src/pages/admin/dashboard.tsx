import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import DashboardCharts from '@/components/Dashboard/DashboardCharts';
import NotificationsPanel from '@/components/Dashboard/NotificationsPanel';
import { mockTasks, mockNotifications } from '@/data/mockData';
import { formatDate } from '@/utils/dateFormatter';
import { FaCheckCircle, FaClock, FaSpinner, FaUsers, FaUserTie, FaBriefcase, FaChartLine, FaBuilding, FaFileAlt, FaCogs, FaShieldAlt, FaBlog } from 'react-icons/fa';
import Head from 'next/head';
import Link from 'next/link';

interface DashboardStats {
  totalRecruiters: number;
  totalJobs: number;
  totalApplications: number;
  totalCompanies: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRecruiters: 0,
    totalJobs: 0,
    totalApplications: 0,
    totalCompanies: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [taskCount, setTaskCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    fetchDashboardStats();
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Load mock data client-side
    const pendingTasks = mockTasks.filter(task => task.status !== 'completed').length;
    const unreadNotifications = mockNotifications.filter(notification => !notification.read).length;
    
    setTaskCount(pendingTasks);
    setNotificationCount(unreadNotifications);
  };

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching real dashboard statistics...');
      const response = await fetch('/api/admin/dashboard/stats');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard stats received:', data);
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats:', response.status);
        // Fallback to default values if API fails
        setStats({
          totalRecruiters: 0,
          totalJobs: 0,
          totalApplications: 0,
          totalCompanies: 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to default values on error
      setStats({
        totalRecruiters: 0,
        totalJobs: 0,
        totalApplications: 0,
        totalCompanies: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickLinks = [
    {
      title: 'Manage Recruiters',
      description: 'Add, edit, or remove recruiters',
      icon: <FaUserTie className="h-8 w-8" />,
      href: '/admin/administration/recruiters',
      color: 'bg-blue-500'
    },
    {
      title: 'Employer Applications',
      description: 'Review and manage employer access requests',
      icon: <FaShieldAlt className="h-8 w-8" />,
      href: '/admin/employer-applications',
      color: 'bg-indigo-500'
    },
    {
      title: 'User Creation Requests',
      description: 'Manage user account creation requests from employers',
      icon: <FaUserTie className="h-8 w-8" />,
      href: '/admin/user-creation-requests',
      color: 'bg-cyan-500'
    },
    {
      title: 'Employee Deletion Requests',
      description: 'Review requests to remove employees',
      icon: <FaUsers className="h-8 w-8" />,
      href: '/admin/employee-deletion-requests',
      color: 'bg-red-500'
    },
    {
      title: 'Job Management',
      description: 'View and manage all job postings',
      icon: <FaBriefcase className="h-8 w-8" />,
      href: '/admin/jobs',
      color: 'bg-green-500'
    },
    {
      title: 'Talent Pool',
      description: 'Browse and manage candidates',
      icon: <FaUsers className="h-8 w-8" />,
      href: '/admin/my-talent',
      color: 'bg-purple-500'
    },
    {
      title: 'Company Management',
      description: 'Manage companies and industries',
      icon: <FaBuilding className="h-8 w-8" />,
      href: '/admin/administration/companies',
      color: 'bg-orange-500'
    },
    {
      title: 'Skills Management',
      description: 'Manage skills and categories',
      icon: <FaCogs className="h-8 w-8" />,
      href: '/admin/administration/skills',
      color: 'bg-teal-500'
    },
    {
      title: 'Resume Parser',
      description: 'Process and parse resumes',
      icon: <FaFileAlt className="h-8 w-8" />,
      href: '/admin/upload-resume',
      color: 'bg-pink-500'
    },
    {
      title: 'Analytics',
      description: 'View reports and analytics',
      icon: <FaChartLine className="h-8 w-8" />,
      href: '/admin/queries',
      color: 'bg-red-500'
    }
  ];

  return (
    <AdminLayout>
      <Head>
        <title>Admin Dashboard | Talnurt Recruitment Portal</title>
      </Head>
      
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <FaShieldAlt className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome to Admin Dashboard</h1>
                <p className="text-blue-100 mt-1">
                  You have superadmin access to all recruitment portal features
                </p>
              </div>
            </div>
            <button
              onClick={fetchDashboardStats}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 transition-colors px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              title="Refresh dashboard statistics"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUserTie className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Recruiters</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : stats.totalRecruiters}
                  </p>
                </div>
              </div>
              {!isLoading && (
                <button
                  onClick={fetchDashboardStats}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Refresh statistics"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaBriefcase className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.totalJobs}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FaUsers className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.totalApplications}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <FaBuilding className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Companies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.totalCompanies}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer group">
                  <div className={`h-12 w-12 ${link.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {link.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
                  <p className="text-gray-600 text-sm">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity - Placeholder */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUserTie className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">New recruiter registered</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <FaBriefcase className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">New job posting created</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <FaUsers className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">New candidate application received</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard; 