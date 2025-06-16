import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Head from 'next/head';
import AlertBox from '@/components/shared/AlertBox';
import axios from 'axios';

interface Industry {
  id: string;
  name: string;
  description: string;
}

const IndustriesPage: React.FC = () => {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Alert state
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });
  
  // Store the ID of the industry to be deleted
  const [industryToDelete, setIndustryToDelete] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIndustry, setNewIndustry] = useState({ name: '', description: '' });
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  
  // Fetch industries from API on component mount
  useEffect(() => {
    fetchIndustries();
  }, []);
  
  // Function to fetch industries from API
  const fetchIndustries = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/admin/industries');
      setIndustries(response.data);
    } catch (error) {
      console.error('Error fetching industries:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load industries. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddIndustry = async () => {
    if (!newIndustry.name.trim()) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Industry name is required'
      });
      return;
    }
    
    try {
      const response = await axios.post('/api/admin/industries', newIndustry);
      
      // Add the new industry to the list
      setIndustries(prevIndustries => [...prevIndustries, response.data]);
      
      // Reset the form
      setNewIndustry({ name: '', description: '' });
      setShowAddForm(false);
      
      // Show success message
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Industry has been added successfully'
      });
      
      // Auto close the success message
      setTimeout(() => {
        setAlert(prev => ({ ...prev, isOpen: false }));
      }, 3000);
    } catch (error: any) {
      console.error('Error adding industry:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to add industry. Please try again.'
      });
    }
  };
  
  const handleEditIndustry = (industry: Industry) => {
    setEditingIndustry(industry);
    setNewIndustry({ name: industry.name, description: industry.description });
    setShowAddForm(true);
  };
  
  const handleUpdateIndustry = async () => {
    if (!editingIndustry || !newIndustry.name.trim()) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Industry name is required'
      });
      return;
    }
    
    try {
      const response = await axios.put(`/api/admin/industries/${editingIndustry.id}`, newIndustry);
      
      // Update the industry in the list
      setIndustries(prevIndustries => 
        prevIndustries.map(industry => 
          industry.id === editingIndustry.id ? response.data : industry
        )
      );
      
      // Reset the form
      setNewIndustry({ name: '', description: '' });
      setEditingIndustry(null);
      setShowAddForm(false);
      
      // Show success message
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Industry has been updated successfully'
      });
      
      // Auto close the success message
      setTimeout(() => {
        setAlert(prev => ({ ...prev, isOpen: false }));
      }, 3000);
    } catch (error: any) {
      console.error('Error updating industry:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update industry. Please try again.'
      });
    }
  };
  
  const handleDeleteIndustry = (id: string) => {
    // Store the ID and show confirmation alert
    setIndustryToDelete(id);
    setAlert({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this industry? This action cannot be undone.'
    });
  };
  
  // Handle alert close with different actions based on alert type
  const handleAlertClose = async (confirmed: boolean = false) => {
    // If this is a warning alert and user confirmed, perform the delete
    if (alert.type === 'warning' && confirmed && industryToDelete) {
      try {
        // Delete the industry from the API
        await axios.delete(`/api/admin/industries/${industryToDelete}`);
        
        // Remove the industry from the local state
        setIndustries(prevIndustries => prevIndustries.filter(industry => industry.id !== industryToDelete));
        
        // Show success message
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Industry has been deleted successfully.'
        });
        
        // Clear the industry to delete
        setIndustryToDelete(null);
        
        // Auto close the success message after 3 seconds
        setTimeout(() => {
          setAlert(prev => ({ ...prev, isOpen: false }));
        }, 3000);
      } catch (error: any) {
        console.error('Error deleting industry:', error);
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: error.response?.data?.error || 'Failed to delete industry. Please try again.'
        });
        setIndustryToDelete(null);
      }
    } else {
      // Just close the alert if not confirmed or not a warning
      setAlert(prev => ({ ...prev, isOpen: false }));
    }
  };
  
  return (
    <AdminLayout>
      <Head>
        <title>Industries Management | Talnurt Recruitment Portal</title>
      </Head>
      
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Industries Management
          </h1>
          
          <button
            onClick={() => {
              setEditingIndustry(null);
              setNewIndustry({ name: '', description: '' });
              setShowAddForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Add New Industry
          </button>
        </div>
        
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6 text-center">
              {editingIndustry ? 'Edit Industry' : 'Add Industry'}
            </h2>
            
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <label htmlFor="industryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="industryName"
                  type="text"
                  value={newIndustry.name}
                  onChange={(e) => setNewIndustry({ ...newIndustry, name: e.target.value })}
                  placeholder="Enter industry name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="industryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="industryDescription"
                  value={newIndustry.description}
                  onChange={(e) => setNewIndustry({ ...newIndustry, description: e.target.value })}
                  placeholder="Describe the industry"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 mr-4"
                >
                  Cancel
                </button>
                <button
                  onClick={editingIndustry ? handleUpdateIndustry : handleAddIndustry}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-40"
                >
                  {editingIndustry ? 'Update Industry' : 'Add Industry'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-800">Industries List</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Loading industries...</p>
                    </td>
                  </tr>
                ) : (
                  industries.map((industry, index) => (
                    <tr key={industry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {industry.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {industry.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditIndustry(industry)}
                          className="text-amber-500 hover:text-amber-600 mr-3"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteIndustry(industry.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete"
                        >
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                
                {!isLoading && industries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No industries found. Add a new industry to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Alert Box */}
        {alert.isOpen && (
          <AlertBox
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => handleAlertClose()}
            onConfirm={() => handleAlertClose(true)}
            showConfirm={alert.type === 'warning'}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default IndustriesPage;
