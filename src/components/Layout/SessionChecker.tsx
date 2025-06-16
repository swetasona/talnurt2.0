import React, { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

/**
 * SessionChecker component to detect session changes, especially role changes
 * and handle proper role-based redirection after network reconnection
 * 
 * This component:
 * 1. Checks for role changes by contacting the server
 * 2. Forces a logout when a role change is detected
 * 3. Redirects users to correct dashboard after network reconnection
 */
const SessionChecker: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const lastNetworkStatus = useRef<boolean>(navigator.onLine);

  // Helper function to get expected dashboard for a role
  const getExpectedDashboard = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return '/admin/super-dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'recruiter':
      case 'unassigned':
      case 'employee':
      case 'manager':
        return '/recruiter/dashboard';
      case 'employer':
        return '/recruiter/employer/dashboard';
      case 'applicant':
      default:
        return '/dashboard';
    }
  };

  // Helper function to check if user is on the wrong dashboard
  const isOnWrongDashboard = (currentPath: string, userRole: string): boolean => {
    // Skip check for certain paths
    const skipPaths = [
      '/auth/',
      '/api/',
      '/jobs/',
      '/contact',
      '/blogs/',
      '/_next/',
      '/uploads/',
      '/resume',
      '/upload-resume',
      '/setup'
    ];

    if (skipPaths.some(path => currentPath.startsWith(path))) {
      return false;
    }

    // Check if current path matches the expected dashboard pattern
    switch (userRole) {
      case 'super_admin':
        return !currentPath.startsWith('/admin/super-dashboard') && currentPath !== '/';
      case 'admin':
        return !currentPath.startsWith('/admin/dashboard') && 
               !currentPath.startsWith('/admin/super-dashboard') && 
               currentPath !== '/';
      case 'recruiter':
      case 'unassigned':
      case 'employee':
      case 'manager':
        return (!currentPath.startsWith('/recruiter') || 
                currentPath.startsWith('/recruiter/employer')) && 
               currentPath !== '/';
      case 'employer':
        // Allow employers to access general recruiter pages like /recruiter/jobs
        return (!currentPath.startsWith('/recruiter/employer') && 
                !currentPath.startsWith('/recruiter/dashboard') &&
                !currentPath.startsWith('/recruiter/jobs') &&
                !currentPath.startsWith('/recruiter/my-talent') &&
                !currentPath.startsWith('/recruiter/profile-allocations') &&
                !currentPath.startsWith('/recruiter/tasks') &&
                !currentPath.startsWith('/recruiter/reports')) && 
               currentPath !== '/';
      case 'applicant':
      default:
        return (currentPath.startsWith('/recruiter') || 
                currentPath.startsWith('/admin')) && 
               currentPath !== '/';
    }
  };

  // Handle network reconnection and role-based redirection
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.role) return;

    const handleNetworkChange = () => {
      const isOnline = navigator.onLine;
      
      // Check if we just came back online
      if (isOnline && !lastNetworkStatus.current) {
        console.log('Network reconnected, checking dashboard alignment...');
        
        const currentPath = router.pathname;
        const userRole = session.user.role;
        
        // Small delay to ensure session is properly restored
        setTimeout(() => {
          if (isOnWrongDashboard(currentPath, userRole)) {
            const correctDashboard = getExpectedDashboard(userRole);
            console.log(`Network reconnect redirect: ${userRole} from ${currentPath} to ${correctDashboard}`);
            router.replace(correctDashboard);
          }
        }, 1000);
      }
      
      lastNetworkStatus.current = isOnline;
    };

    // Initial check when component mounts (in case we're already on wrong dashboard)
    const currentPath = router.pathname;
    const userRole = session.user.role;
    
    if (isOnWrongDashboard(currentPath, userRole)) {
      const correctDashboard = getExpectedDashboard(userRole);
      console.log(`Initial dashboard check redirect: ${userRole} from ${currentPath} to ${correctDashboard}`);
      router.replace(correctDashboard);
    }

    // Listen for network status changes
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [session, status, router]);

  // Check for role changes periodically (every 5 minutes)
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const checkRoleChanges = async () => {
      try {
        // Call API to check for role changes
        const response = await fetch(`/api/auth/check-role?userId=${session.user.id}&currentRole=${session.user.role}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // If role has changed, redirect to signout with a special reason
          if (data.hasRoleChanged) {
            console.log('Role change detected. Logging out user...');
            
            // Use Next-Auth signOut with custom redirect to our signout page
            signOut({ 
              redirect: true,
              callbackUrl: '/auth/signout?reason=role_change'
            });
          }
        }
      } catch (error) {
        console.error('Error checking for role changes:', error);
      }
    };
    
    // Run immediately on component mount
    checkRoleChanges();
    
    // Then check periodically
    const intervalId = setInterval(checkRoleChanges, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => {
      clearInterval(intervalId);
    };
  }, [session]);

  // This component doesn't render anything - it's just for the side effect
  return null;
};

export default SessionChecker; 