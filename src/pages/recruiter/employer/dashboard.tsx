import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import UserCreationRequestForm from '@/components/UserCreationRequestForm';
import { FaBuilding, FaUsers, FaPlus, FaEdit, FaSave, FaTimes, FaUserTie, FaIndustry, FaMapMarkerAlt, FaGlobe, FaLinkedin } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  location?: string;
  description?: string;
  linkedin_url?: string;
  logo_url?: string;
  website_url?: string;
}

interface Team {
  id: string;
  name: string;
  manager_id?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  members: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
}

interface DashboardStats {
  totalEmployees: number;
  totalTeams: number;
  totalJobs: number;
  totalApplications: number;
  recentActivities: {
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }[];
}

interface EmployerDashboardProps {
  user: User;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || !session.user?.id) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // Check if user has employer access
  if (session.user.role !== 'employer') {
    return {
      redirect: {
        destination: '/recruiter/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.user.id,
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: session.user.role || 'employer',
      },
    }
  };
};

const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ user }) => {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch company profile
      const companyResponse = await fetch('/api/recruiter/employer/company');
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData.company);
      }

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/recruiter/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <Head>
        <title>Employer Dashboard | Talnurt</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
              <p className="text-blue-100 mt-1">
                {company ? `${company.name} Dashboard` : 'Employer Dashboard'}
              </p>
            </div>
            {!company && (
              <Link
                href="/recruiter/employer/company"
                className="btn bg-white text-blue-600 hover:bg-blue-50"
              >
                Set Up Company Profile
              </Link>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalEmployees || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teams</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalTeams || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaUserTie className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalJobs || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FaBuilding className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaUsers className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/recruiter/employer/profile-allocation"
              className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center py-3"
            >
              <FaPlus className="mr-2" />
              Create Profile Allocation
            </Link>
            
            <Link 
              href="/recruiter/employer/teams"
              className="btn bg-green-600 text-white hover:bg-green-700 flex items-center justify-center py-3"
            >
              <FaUsers className="mr-2" />
              Manage Teams
            </Link>
            
            <Link 
              href="/recruiter/employer/employees"
              className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center py-3"
            >
              <FaUserTie className="mr-2" />
              View Employees
            </Link>
            
            <Link 
              href="/recruiter/employer/company"
              className="btn bg-gray-600 text-white hover:bg-gray-700 flex items-center justify-center py-3"
            >
              <FaBuilding className="mr-2" />
              Company Profile
            </Link>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activities</h2>
          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 border-b border-gray-100">
                  <div className="flex-grow">
                    <p className="text-gray-800">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activities to display</p>
            </div>
          )}
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default EmployerDashboard; 