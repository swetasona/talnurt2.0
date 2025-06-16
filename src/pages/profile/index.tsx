import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useSession } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import PageLayout from '@/components/Layout/PageLayout';
import ProfileForm from '@/components/Profile/ProfileForm';
import { authOptions } from '../api/auth/[...nextauth]';

interface ProfileData {
  education: any[];
  experience: any[];
  skills: any[];
  preferences: {
    preferredLocation?: string;
    preferredRole?: string;
    preferredType?: string;
  };
  resume: string | null;
}

const ProfilePage: React.FC = () => {
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchProfileData();
    }
  }, [session]);

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <PageLayout title="Your Profile | Talnurt">
        <div className="flex items-center justify-center py-12">
          <div className="loader"></div>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout title="Your Profile | Talnurt">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 text-red-700 p-4 rounded mb-8">
            {error}
          </div>
          <div className="flex justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Your Profile | Talnurt">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600">
            Manage your profile information to improve your job application success
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <ProfileForm initialData={profileData || undefined} />
        </div>
      </div>
    </PageLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/profile',
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
};

export default ProfilePage; 