import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useSession, getSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Head from 'next/head';
import { FaSignOutAlt, FaClipboardList, FaSpinner, FaCheckCircle, FaTimesCircle, FaUserEdit, FaSearch } from 'react-icons/fa';
import ApplicationsTable from '@/components/Dashboard/ApplicationsTable';
import ProfileCompletionAlert from '@/components/Dashboard/ProfileCompletionAlert';
import { useRouter } from 'next/router';
import Navbar from '@/components/Layout/Navbar';

interface DashboardProps {
  profileCompleted: boolean;
}

const DashboardPage: React.FC<DashboardProps> = ({ profileCompleted }) => {
  const { data: session, status } = useSession();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Redirect if user is not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin?callbackUrl=/dashboard");
    }
  }, [status, router]);

  // Fetch applications data
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/applications/user');
        
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        
        const data = await response.json();
        setApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setError('Failed to load applications. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchApplications();
    }
  }, [session]);

  // Custom sign out function that uses window.location
  const handleSignOut = () => {
    console.log('Sign Out button clicked');
    // Navigate to our custom signout page
    router.push('/auth/signout');
  };

  // Calculate stats
  const total = applications.length;
  const inProgress = applications.filter((a: any) => a.status === 'pending' || a.status === 'reviewed' || a.status === 'interviewed').length;
  const interviews = applications.filter((a: any) => a.status === 'interviewed').length;
  const offers = applications.filter((a: any) => a.status === 'offered').length;
  const rejections = applications.filter((a: any) => a.status === 'rejected').length;

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Applicant Dashboard | Talnurt</title>
      </Head>
      <Navbar />
      
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Applicant Dashboard</h2>
            <p className="text-gray-600">Welcome back, {session?.user?.name}</p>
          </div>
          
          {/* Modern Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="p-4 rounded-full bg-blue-100 text-blue-700 mr-5 flex-shrink-0"><FaClipboardList size={24} /></div>
              <div><p className="text-sm font-medium text-gray-500 mb-1">Total Applications</p><p className="text-2xl font-bold">{total}</p></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="p-4 rounded-full bg-yellow-100 text-yellow-700 mr-5 flex-shrink-0"><FaSpinner size={24} /></div>
              <div><p className="text-sm font-medium text-gray-500 mb-1">In Progress</p><p className="text-2xl font-bold">{inProgress}</p></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="p-4 rounded-full bg-purple-100 text-purple-700 mr-5 flex-shrink-0"><FaUserEdit size={24} /></div>
              <div><p className="text-sm font-medium text-gray-500 mb-1">Interviews</p><p className="text-2xl font-bold">{interviews}</p></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="p-4 rounded-full bg-green-100 text-green-700 mr-5 flex-shrink-0"><FaCheckCircle size={24} /></div>
              <div><p className="text-sm font-medium text-gray-500 mb-1">Offers</p><p className="text-2xl font-bold">{offers}</p></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="p-4 rounded-full bg-red-100 text-red-700 mr-5 flex-shrink-0"><FaTimesCircle size={24} /></div>
              <div><p className="text-sm font-medium text-gray-500 mb-1">Rejections</p><p className="text-2xl font-bold">{rejections}</p></div>
            </div>
          </div>
          
          {/* Profile Completion Progress Bar */}
          {!profileCompleted && session?.user?.id && (
            <ProfileCompletionAlert userId={session.user.id} />
          )}
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Link href="/jobs" className="inline-flex items-center px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"><FaSearch className="mr-2" /> Browse Jobs</Link>
            <Link href="/profile" className="inline-flex items-center px-5 py-3 rounded-lg bg-gray-100 text-gray-800 font-semibold shadow hover:bg-gray-200 transition"><FaUserEdit className="mr-2" /> Update Profile</Link>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Applications</h3>
              {error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded">
                  {error}
                </div>
              ) : (
                <ApplicationsTable applications={applications} />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard',
        permanent: false,
      },
    };
  }
  
  // Check if profile is completed
  let profileCompleted = false;
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const protocol = isProduction ? 'https' : 'http';
    const host = isProduction ? (process.env.VERCEL_URL || 'localhost:3000') : 'localhost:3000';
    const res = await fetch(`${protocol}://${host}/api/profile/is-complete?userId=${session.user.id}`);
    
    if (res.ok) {
      const data = await res.json();
      profileCompleted = data.isComplete;
    }
  } catch (error) {
    console.error('Error checking profile completion:', error);
  }
  
  return {
    props: {
      profileCompleted,
    },
  };
};

export default DashboardPage; 