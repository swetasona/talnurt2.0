import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import AdminLayout from '@/components/Layout/AdminLayout';
import { mockUsers } from '@/data/mockData';
import { User } from '@/types';
import { FaUser, FaEnvelope, FaPhone, FaLinkedin, FaKey, FaShieldAlt, FaBell } from 'react-icons/fa';

interface ProfileProps {
  user: User;
}

export const getServerSideProps: GetServerSideProps = async () => {
  // In a real application, you would fetch the logged-in user data
  // For now, we'll use the first user in our mock data (admin)
  const user = mockUsers[0];
  
  return {
    props: {
      user,
    },
  };
};

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    linkedIn: user.linkedIn || '',
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send an API request to update the user profile
    alert('Profile updated successfully!');
  };
  
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your personal information and account settings</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="col-span-1">
          <div className="card overflow-hidden">
            <div className="p-4 text-center">
              <div className="w-24 h-24 rounded-full bg-primary mx-auto flex items-center justify-center text-white text-3xl mb-4">
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{user.name.charAt(0)}</span>
                )}
              </div>
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-gray-500 text-sm capitalize">{user.role}</p>
            </div>
            
            <div className="border-t">
              <button 
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-50 ${activeTab === 'details' ? 'bg-gray-50 font-medium text-primary' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                <FaUser className="mr-3" /> Personal Details
              </button>
              <button 
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-50 ${activeTab === 'password' ? 'bg-gray-50 font-medium text-primary' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <FaKey className="mr-3" /> Change Password
              </button>
              <button 
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-50 ${activeTab === 'security' ? 'bg-gray-50 font-medium text-primary' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <FaShieldAlt className="mr-3" /> Security Settings
              </button>
              <button 
                className={`flex items-center w-full px-4 py-3 hover:bg-gray-50 ${activeTab === 'notifications' ? 'bg-gray-50 font-medium text-primary' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <FaBell className="mr-3" /> Notification Preferences
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="col-span-1 md:col-span-3">
          {activeTab === 'details' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Personal Details</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="form-input pl-10"
                      value={profileData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-input pl-10"
                      value={profileData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" htmlFor="phone">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="form-input pl-10"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" htmlFor="linkedIn">
                    LinkedIn Profile
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLinkedin className="text-gray-400" />
                    </div>
                    <input
                      id="linkedIn"
                      name="linkedIn"
                      type="url"
                      className="form-input pl-10"
                      value={profileData.linkedIn}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'password' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Change Password</h2>
              <form>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="flex justify-end">
                  <button type="submit" className="btn btn-primary">
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
              
              <div className="mb-6 border-b pb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
              
              <div className="mb-6 border-b pb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Session Management</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage your active sessions and devices
                    </p>
                  </div>
                  <button className="text-primary hover:underline text-sm font-medium">
                    View Active Sessions
                  </button>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Account Activity Logs</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      View your account activity and security events
                    </p>
                  </div>
                  <button className="text-primary hover:underline text-sm font-medium">
                    View Activity Logs
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="font-medium">Job Application Updates</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Receive notifications when new applications are submitted
                    </p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="font-medium">Task Assignments</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Receive notifications when you are assigned a new task
                    </p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Message Notifications</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Receive notifications for new messages
                    </p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary">
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile; 