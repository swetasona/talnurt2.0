import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Head from 'next/head';
import AlertBox from '@/components/shared/AlertBox';
import axios from 'axios';

interface Skill {
  id: string;
  name: string;
  description: string;
}

const SkillsPage: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Alert state
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });
  
  // Store the ID of the skill to be deleted
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', description: '' });
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  
  // Fetch skills from API on component mount
  useEffect(() => {
    fetchSkills();
  }, []);
  
  // Function to fetch skills from API
  const fetchSkills = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/admin/skills');
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load skills. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Skill name is required'
      });
      return;
    }
    
    try {
      const response = await axios.post('/api/admin/skills', newSkill);
      
      // Add the new skill to the list
      setSkills(prevSkills => [...prevSkills, response.data]);
      
      // Reset the form
      setNewSkill({ name: '', description: '' });
      setShowAddForm(false);
      
      // Show success message
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Skill has been added successfully'
      });
      
      // Auto close the success message
      setTimeout(() => {
        setAlert(prev => ({ ...prev, isOpen: false }));
      }, 3000);
    } catch (error: any) {
      console.error('Error adding skill:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to add skill. Please try again.'
      });
    }
  };
  
  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setNewSkill({ name: skill.name, description: skill.description });
    setShowAddForm(true);
  };
  
  const handleUpdateSkill = async () => {
    if (!editingSkill || !newSkill.name.trim()) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Skill name is required'
      });
      return;
    }
    
    try {
      const response = await axios.put(`/api/admin/skills/${editingSkill.id}`, newSkill);
      
      // Update the skill in the list
      setSkills(prevSkills => 
        prevSkills.map(skill => 
          skill.id === editingSkill.id ? response.data : skill
        )
      );
      
      // Reset the form
      setNewSkill({ name: '', description: '' });
      setEditingSkill(null);
      setShowAddForm(false);
      
      // Show success message
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Skill has been updated successfully'
      });
      
      // Auto close the success message
      setTimeout(() => {
        setAlert(prev => ({ ...prev, isOpen: false }));
      }, 3000);
    } catch (error: any) {
      console.error('Error updating skill:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update skill. Please try again.'
      });
    }
  };
  
  const handleDeleteSkill = (id: string) => {
    // Store the ID and show confirmation alert
    setSkillToDelete(id);
    setAlert({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this skill? This action cannot be undone.'
    });
  };
  
  // Handle alert close with different actions based on alert type
  const handleAlertClose = async (confirmed: boolean = false) => {
    // If this is a warning alert and user confirmed, perform the delete
    if (alert.type === 'warning' && confirmed && skillToDelete) {
      try {
        // Delete the skill from the API
        await axios.delete(`/api/admin/skills/${skillToDelete}`);
        
        // Remove the skill from the local state
        setSkills(prevSkills => prevSkills.filter(skill => skill.id !== skillToDelete));
        
        // Show success message
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Skill has been deleted successfully.'
        });
        
        // Clear the skill to delete
        setSkillToDelete(null);
        
        // Auto close the success message after 3 seconds
        setTimeout(() => {
          setAlert(prev => ({ ...prev, isOpen: false }));
        }, 3000);
      } catch (error: any) {
        console.error('Error deleting skill:', error);
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: error.response?.data?.error || 'Failed to delete skill. Please try again.'
        });
        setSkillToDelete(null);
      }
    } else {
      // Just close the alert if not confirmed or not a warning
      setAlert(prev => ({ ...prev, isOpen: false }));
    }
  };
  
  return (
    <AdminLayout>
      <Head>
        <title>Skills Management | Talnurt Recruitment Portal</title>
      </Head>
      
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Skills Management
          </h1>
          
          <button
            onClick={() => {
              setEditingSkill(null);
              setNewSkill({ name: '', description: '' });
              setShowAddForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Add New Skill
          </button>
        </div>
        
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6 text-center">
              {editingSkill ? 'Edit Skill' : 'Add Skill'}
            </h2>
            
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <label htmlFor="skillName" className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="skillName"
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  placeholder="Enter skill name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="skillDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  About
                </label>
                <textarea
                  id="skillDescription"
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  placeholder="Describe the skill"
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
                  onClick={editingSkill ? handleUpdateSkill : handleAddSkill}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-40"
                >
                  {editingSkill ? 'Update Skill' : 'Add Skill'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-800">Skills List</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skill
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
                      <p className="mt-2 text-sm text-gray-500">Loading skills...</p>
                    </td>
                  </tr>
                ) : (
                  skills.map((skill, index) => (
                    <tr key={skill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {skill.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {skill.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditSkill(skill)}
                          className="text-amber-500 hover:text-amber-600 mr-3"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete"
                        >
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                
                {!isLoading && skills.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No skills found. Add a new skill to get started.
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

export default SkillsPage;
