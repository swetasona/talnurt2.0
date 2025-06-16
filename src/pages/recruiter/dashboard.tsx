import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import EmployerAccessApplication from '@/components/Recruiter/EmployerAccessApplication';
import { FaBriefcase, FaUsers, FaUserTie, FaPlus, FaChartLine, FaFileAlt, FaCalendarAlt, FaClipboardList, FaShieldAlt } from 'react-icons/fa';

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // List of valid recruiter-type roles
  const validRecruiterRoles = ['recruiter', 'unassigned', 'employee', 'employer', 'manager', 'admin', 'superadmin', 'super_admin'];
  
  if (!session || !validRecruiterRoles.includes(session.user.role)) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.user.id || '',
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: session.user.role || 'recruiter',
      },
    },
  };
};

const RecruiterDashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplicants: 0,
    savedCandidates: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/recruiter/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Get the current date
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', options);

  // Quick actions links
  const quickLinks = [
    {
      title: 'Job Management',
      description: 'View and manage all job postings',
      icon: <FaBriefcase className="h-8 w-8" />,
      href: '/recruiter/jobs',
      color: 'bg-blue-500'
    },
    {
      title: 'My Talent',
      description: 'Manage your private talent pool',
      icon: <FaUserTie className="h-8 w-8" />,
      href: '/recruiter/my-talent',
      color: 'bg-indigo-500'
    },
    {
      title: 'Applications',
      description: 'Review applicants for your jobs',
      icon: <FaUsers className="h-8 w-8" />,
      href: '/recruiter/applicants',
      color: 'bg-green-500'
    },
    {
      title: 'Post New Job',
      description: 'Create a new job posting',
      icon: <FaPlus className="h-8 w-8" />,
      href: '/recruiter/jobs/create',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <RecruiterLayout>
      <Head>
        <title>Recruiter Dashboard | Talnurt Recruitment Portal</title>
      </Head>

      <div className="space-y-6">
        {/* Employer Access Application - Top Priority */}
        <EmployerAccessApplication userRole={user.role} />

        {/* Welcome Header */}
        <div className="bg-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <FaBriefcase className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome to {user.role === 'unassigned' ? 'Recruiter' : user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                </h1>
                <p className="text-blue-100 mt-1">
                  You have {user.role === 'unassigned' ? 'recruiter' : user.role} access to all recruitment portal features
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaBriefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.activeJobs}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaUsers className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applicants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.totalApplicants}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FaUserTie className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saved Candidates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.savedCandidates}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <FaCalendarAlt className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formattedDate}
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
                <FaBriefcase className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">New job posting created</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <FaUsers className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">New application received</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <FaUserTie className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Candidate added to talent pool</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default RecruiterDashboard; 