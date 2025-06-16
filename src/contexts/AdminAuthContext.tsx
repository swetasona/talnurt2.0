import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      console.log('AdminAuthContext: Checking authentication...');
      const response = await fetch('/api/admin/auth/verify');
      const data = await response.json();
      
      console.log('AdminAuthContext: Auth check response:', { status: response.status, authenticated: data.authenticated });

      if (response.ok && data.authenticated) {
        console.log('AdminAuthContext: User authenticated successfully:', data.user.email);
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        console.log('AdminAuthContext: User not authenticated');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('AdminAuthContext: Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      console.log('AdminAuthContext: Setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('AdminAuthContext: Attempting login for:', email);
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('AdminAuthContext: Login response:', { status: response.status, success: data.success });

      if (response.ok) {
        console.log('AdminAuthContext: Login successful, setting user state:', data.user.email);
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('AdminAuthContext: Login failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('AdminAuthContext: Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Only check auth once when component mounts
  useEffect(() => {
    let mounted = true;
    
    const performAuthCheck = async () => {
      if (mounted) {
        await checkAuth();
      }
    };
    
    performAuthCheck();
    
    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  const value: AdminAuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}; 