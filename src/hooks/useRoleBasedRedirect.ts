import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface UseRoleBasedRedirectOptions {
  /** Whether to skip the redirect (useful for specific pages) */
  skipRedirect?: boolean;
  /** Custom redirect logic */
  customRedirect?: (role: string) => string | null;
}

/**
 * Hook to handle role-based redirection after network reconnection or session restoration.
 * This ensures users are always redirected to their correct dashboard based on their role.
 */
export const useRoleBasedRedirect = (options: UseRoleBasedRedirectOptions = {}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { skipRedirect = false, customRedirect } = options;

  useEffect(() => {
    // Don't redirect if explicitly skipped or still loading
    if (skipRedirect || status === 'loading') {
      return;
    }

    // Don't redirect if no session (let the page handle auth)
    if (!session?.user?.role) {
      return;
    }

    const currentPath = router.pathname;
    const userRole = session.user.role;

    // Use custom redirect logic if provided
    if (customRedirect) {
      const customUrl = customRedirect(userRole);
      if (customUrl && currentPath !== customUrl) {
        console.log(`Custom redirect: ${userRole} -> ${customUrl}`);
        router.replace(customUrl);
        return;
      }
    }

    // Default role-based dashboard mapping
    const getRoleDashboard = (role: string): string => {
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

    const expectedDashboard = getRoleDashboard(userRole);

    // Check if user is on the wrong dashboard
    const isOnWrongDashboard = () => {
      // If on the redirect handler, always redirect to correct dashboard
      if (currentPath === '/auth/redirect-handler') {
        return true;
      }

      // Check if current path matches the expected dashboard pattern
      switch (userRole) {
        case 'super_admin':
          return !currentPath.startsWith('/admin/super-dashboard');
        case 'admin':
          return !currentPath.startsWith('/admin/dashboard') && !currentPath.startsWith('/admin/super-dashboard');
        case 'recruiter':
        case 'unassigned':
        case 'employee':
        case 'manager':
          return !currentPath.startsWith('/recruiter') || currentPath.startsWith('/recruiter/employer');
        case 'employer':
          return !currentPath.startsWith('/recruiter/employer') && !currentPath.startsWith('/recruiter/dashboard');
        case 'applicant':
        default:
          return currentPath.startsWith('/recruiter') || currentPath.startsWith('/admin');
      }
    };

    // Redirect if on wrong dashboard
    if (isOnWrongDashboard()) {
      console.log(`Role-based redirect: ${userRole} from ${currentPath} to ${expectedDashboard}`);
      router.replace(expectedDashboard);
    }
  }, [session, status, router, skipRedirect, customRedirect]);

  return {
    session,
    status,
    isLoading: status === 'loading',
  };
};

export default useRoleBasedRedirect; 