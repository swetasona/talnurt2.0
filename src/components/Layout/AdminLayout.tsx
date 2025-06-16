import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import { FaBars, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

const AUTO_LOGOUT_TIME = 20 * 60 * 1000; // 20 minutes

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, isLoading, isAuthenticated, logout } = useAdminAuth();
  
  // Memoize logout handler
  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/admin/login');
  }, [logout, router]);

  // Memoize sidebar toggle
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);
  
  // Auto logout after inactivity
  useEffect(() => {
    if (!isAuthenticated) return; // Only set up timer if authenticated

    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout();
      }, AUTO_LOGOUT_TIME);
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    resetTimer();
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearTimeout(inactivityTimer);
    };
  }, [isAuthenticated, handleLogout]);

  // Handle responsive sidebar for mobile devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
      router.push('/admin/login');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-grow transition-all duration-300 flex flex-col ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        {/* Top header with user info */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile menu toggle button - only visible on mobile */}
            <button 
              onClick={toggleSidebar}
              className="md:hidden text-gray-700 hover:text-[#3245df]"
            >
              <FaBars size={20} />
            </button>
            
            {/* User info and logout */}
            <div className="flex items-center space-x-4 ml-auto">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-blue-600" size={14} />
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                title="Logout"
              >
                <FaSignOutAlt size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-grow p-6 md:p-8">
          {children}
        </main>
        
        {/* Simple footer */}
        <footer className="bg-white p-4 border-t border-gray-200 text-center text-sm text-gray-500">
          © 2025 Talnurt Recruitment Portal. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout; 