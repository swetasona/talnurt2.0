import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { getBaseUrl } from '@/utils/baseUrl';
import { useEffect } from 'react';
import { loadAllPasswordsFromDatabase } from '@/utils/passwordStorage';
import SessionChecker from '@/components/Layout/SessionChecker';
import '../styles/globals.css';
import '../styles/animations.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Load passwords from database on app initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load all passwords from database into memory
        await loadAllPasswordsFromDatabase();
        console.log('Passwords loaded from database');
      } catch (error) {
        console.error('Error loading passwords from database:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <SessionProvider session={session} basePath="/api/auth">
      <AdminAuthProvider>
        <NotificationsProvider>
          <SessionChecker />
          <Component {...pageProps} />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#22c55e',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </NotificationsProvider>
      </AdminAuthProvider>
    </SessionProvider>
  );
}

export default MyApp;
