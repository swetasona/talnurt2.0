import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

interface ApplyButtonProps {
  jobId: string;
  jobStatus?: string;
}

const ApplyButton: React.FC<ApplyButtonProps> = ({ jobId, jobStatus }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Check if user is admin or recruiter on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      const role = session?.user?.role;
      if (role === 'recruiter' || role === 'admin' || role === 'superadmin' || role === 'super_admin') {
        setUnauthorized(true);
        setError(`As a ${role}, you cannot apply for jobs. Please use an applicant account.`);
      }
    }
  }, [session, status]);

  // Check if job is closed or draft
  const isJobClosed = jobStatus?.toLowerCase() === 'closed' || jobStatus?.toLowerCase() === 'draft';

  const handleApply = async () => {
    // Prevent applications for closed jobs
    if (isJobClosed) {
      return;
    }

    // Prevent recruiters/admins from applying
    if (unauthorized) {
      return;
    }

    // If not logged in, redirect to sign in page
    if (status !== 'authenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}&role=applicant`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If profile incomplete, redirect to complete profile
        if (response.status === 400 && data.redirectTo) {
          router.push(data.redirectTo);
          return;
        }
        throw new Error(data.message || data.error || 'Failed to apply');
      }

      // Application successful
      setSuccess(true);
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Application error:', error);
      setError(error.message || 'Failed to apply for this job');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
        <p className="font-medium">Application Submitted!</p>
        <p className="text-sm">Thank you for your application. Redirecting to your dashboard...</p>
      </div>
    );
  }

  // Return special message for closed jobs
  if (isJobClosed) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-4">
        <p className="font-medium">This position is no longer accepting applications</p>
        <p className="text-sm">This job posting has been closed by the employer. Please explore our other open positions.</p>
      </div>
    );
  }

  // Return error message if unauthorized
  if (unauthorized) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md mb-4">
        <p className="font-medium">Recruiters Cannot Apply</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      <button
        onClick={handleApply}
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
      >
        {isLoading ? 'Applying...' : 'Apply for this Position'}
      </button>
    </div>
  );
};

export default ApplyButton; 