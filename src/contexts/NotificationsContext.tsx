import React, { createContext, useState, useContext, useEffect, useCallback, useRef, ReactNode } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

interface NotificationsContextType {
  unreadReports: {
    total: number;
    managers: number;
    employees: number;
  };
  refreshUnreadReports: () => Promise<void>;
  markReportAsRead: (reportId: string, authorRole?: string) => void;
}

const defaultContext: NotificationsContextType = {
  unreadReports: { total: 0, managers: 0, employees: 0 },
  refreshUnreadReports: async () => {},
  markReportAsRead: () => {},
};

export const NotificationsContext = createContext<NotificationsContextType>(defaultContext);

export const useNotifications = () => useContext(NotificationsContext);

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const { data: session } = useSession();
  const [unreadReports, setUnreadReports] = useState({
    total: 0,
    managers: 0,
    employees: 0,
  });
  
  // Add refs for tracking fetch state and caching
  const isMounted = useRef(true);
  const isRefreshing = useRef(false);
  const lastRefreshTime = useRef(0);
  const CACHE_TIMEOUT = 30000; // 30 seconds
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refreshUnreadReports = useCallback(async () => {
    if (!session?.user) return;
    
    // Only fetch for employer, manager roles
    if (!['employer', 'manager'].includes(session.user.role)) return;
    
    // Skip if already refreshing or if cache is still valid
    const now = Date.now();
    if (isRefreshing.current || (now - lastRefreshTime.current < CACHE_TIMEOUT)) {
      return;
    }
    
    try {
      isRefreshing.current = true;
      const response = await axios.get('/api/reports/unread-count');
      
      // Check if component is still mounted
      if (!isMounted.current) return;
      
      if (response.data) {
        setUnreadReports({
          total: response.data.total || 0,
          managers: response.data.managers || 0,
          employees: response.data.employees || 0,
        });
        
        // Update last refresh time
        lastRefreshTime.current = now;
      }
    } catch (error) {
      console.error('Failed to fetch unread reports count:', error);
    } finally {
      isRefreshing.current = false;
    }
  }, [session]);

  const markReportAsRead = (reportId: string, authorRole?: string) => {
    setUnreadReports(prev => {
      // If we don't know the role, just decrement total
      if (!authorRole) {
        return {
          ...prev,
          total: Math.max(0, prev.total - 1),
        };
      }
      
      // Otherwise update the specific counter
      if (authorRole === 'manager') {
        return {
          ...prev,
          managers: Math.max(0, prev.managers - 1),
          total: Math.max(0, prev.total - 1),
        };
      } else if (authorRole === 'employee') {
        return {
          ...prev,
          employees: Math.max(0, prev.employees - 1),
          total: Math.max(0, prev.total - 1),
        };
      }
      
      return prev;
    });
  };

  // Fetch unread reports on mount and session change, with debounce
  useEffect(() => {
    if (session?.user) {
      // Add a small delay to prevent multiple calls during initialization
      const timer = setTimeout(() => {
        refreshUnreadReports();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [session, refreshUnreadReports]);

  return (
    <NotificationsContext.Provider
      value={{
        unreadReports,
        refreshUnreadReports,
        markReportAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}; 