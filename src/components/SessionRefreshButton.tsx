import React from 'react';
import { useSession, signIn } from 'next-auth/react';
import { FaSync } from 'react-icons/fa';

interface SessionRefreshButtonProps {
  className?: string;
}

const SessionRefreshButton: React.FC<SessionRefreshButtonProps> = ({ className = '' }) => {
  const { data: session, update } = useSession();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      // Update the session data
      await update();
      
      // Show success message briefly
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to refresh session:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!session) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleRefreshSession}
        disabled={isRefreshing}
        className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        title="Refresh session data"
      >
        <FaSync className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh Session
      </button>
      
      {showSuccess && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-green-100 text-green-800 text-xs p-2 rounded-md">
          Session refreshed successfully!
        </div>
      )}
    </div>
  );
};

export default SessionRefreshButton; 