import React from 'react';
import { FaBell, FaTasks, FaComment } from 'react-icons/fa';
import { mockNotifications } from '@/data/mockData';
import { Notification } from '@/types';
import { formatDateTime } from '@/utils/dateFormatter';

const NotificationCard: React.FC<{ notification: Notification }> = ({ notification }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'task':
        return <FaTasks className="text-primary" />;
      case 'chat':
        return <FaComment className="text-green-500" />;
      default:
        return <FaBell className="text-accent" />;
    }
  };

  return (
    <div className={`p-3 border-b ${notification.read ? 'bg-white' : 'bg-blue-50'} flex items-start gap-3`}>
      <div className="mt-1">
        {getIcon()}
      </div>
      <div>
        <h4 className="font-medium">{notification.title}</h4>
        <p className="text-sm text-gray-600">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDateTime(notification.timestamp)}
        </p>
      </div>
    </div>
  );
};

const NotificationsPanel: React.FC = () => {
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <span className="text-sm text-primary cursor-pointer hover:underline">
          Mark all as read
        </span>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {mockNotifications.map(notification => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <button className="btn btn-primary">View All Notifications</button>
      </div>
    </div>
  );
};

export default NotificationsPanel; 