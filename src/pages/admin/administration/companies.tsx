import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaEdit, FaTrash, FaPlus, FaImage } from 'react-icons/fa';
import Head from 'next/head';
import AlertBox from '@/components/shared/AlertBox';
import axios from 'axios';

// Simple placeholder image as base64 string (a gray square with a company building icon)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YyZjJmMiIvPjxwYXRoIGQ9Ik04MCw0MEgxMjBWODBIMTYwVjE2MEg0MFY4MEg4MFY0MFoiIGZpbGw9IiNhMGEwYTAiLz48L3N2Zz4=';

interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  location: string;
  logo_url?: string;
  website_url?: string;
  linkedin_url?: string;
  speciality?: string;
}

interface Industry {
  id: string;
  name: string;
}

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Alert state
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });
  
  // Store the ID of the company to be deleted
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '', 
    description: '',
    industry: '',
    location: '',
    logo_url: '',
    website_url: '',
    linkedin_url: '',
    speciality: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  // Fetch companies from API on component mount
  useEffect(() => {
    fetchCompanies();
    fetchIndustries();
  }, []);
  
  // Function to fetch companies from API
  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/admin/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load companies. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch industries for dropdown
  const fetchIndustries = async () => {
    setIsLoadingIndustries(true);
    try {
      const response = await axios.get('/api/admin/lookups/industries');
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
      setIsLoadingIndustries(false);
    }
  };

  // Handle file upload for company logo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setSelectedFile(null);
      return;
    }
    
    const file = files[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Invalid file type. Only JPG, JPEG, or PNG files are allowed.'
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Validate file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'File is too large. Maximum size is 5MB.'
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setSelectedFile(file);
  };

  const handleLogoUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to a file upload endpoint
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.url;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error('Failed to upload company logo');
    }
  };
  
  const handleAddCompany = async () => {
    if (!newCompany.name.trim()) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Company name is required'
      });
      return;
    }
    
    try {
      let logoUrl = newCompany.logo_url;
      
      // Upload logo if selected
      if (selectedFile) {
        try {
          logoUrl = await handleLogoUpload(selectedFile);
        } catch (error) {
          setAlert({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to upload logo. Please try again.'
          });
          return;
        }
      }
      
      const companyData = {
        ...newCompany,
        logo_url: logoUrl
      };
      
      const response = await axios.post('/api/admin/companies', companyData);
      
      // Add the new company to the list
      setCompanies(prevCompanies => [...prevCompanies, response.data]);
      
      // Reset the form
      setNewCompany({ 
        name: '', 
        description: '', 
        industry: '', 
        location: '', 
        logo_url: '',
        website_url: '',
        linkedin_url: '',
        speciality: ''
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowAddForm(false);
      
      // Show success message
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Company has been added successfully'
      });
      
      // Auto close the success message
      setTimeout(() => {
        setAlert(prev => ({ ...prev, isOpen: false }));
      }, 3000);
    } catch (error: any) {
      console.error('Error adding company:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to add company. Please try again.'
      });
    }
  };
  
  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setNewCompany({ 
      name: company.name, 
      description: company.description || '',
      industry: company.industry || '',
      location: company.location || '',
      logo_url: company.logo_url || '',
      website_url: company.website_url || '',
      linkedin_url: company.linkedin_url || '',
      speciality: company.speciality || ''
    });
    setShowAddForm(true);
  };
  
  const handleUpdateCompany = async () => {
    if (!editingCompany || !newCompany.name.trim()) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Company name is required'
      });
      return;
    }
    
    try {
      let logoUrl = newCompany.logo_url;
      
      // Upload logo if selected
      if (selectedFile) {
        try {
          logoUrl = await handleLogoUpload(selectedFile);
        } catch (error) {
          setAlert({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to upload logo. Please try again.'
          });
          return;
        }
      }
      
      const companyData = {
        ...newCompany,
        logo_url: logoUrl
      };
      
      const response = await axios.put(`/api/admin/companies/${editingCompany.id}`, companyData);
      
      // Update the company in the list
      setCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.id === editingCompany.id ? response.data : company
        )
      );
      
      // Reset the form
      setNewCompany({ 
        name: '', 
        description: '', 
        industry: '', 
        location: '', 
        logo_url: '',
        website_url: '',
        linkedin_url: '',
        speciality: ''
      });
      setEditingCompany(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowAddForm(false);
      
      // Show success message
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Company has been updated successfully'
      });
      
      // Auto close the success message
      setTimeout(() => {
        setAlert(prev => ({ ...prev, isOpen: false }));
      }, 3000);
    } catch (error: any) {
      console.error('Error updating company:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update company. Please try again.'
      });
    }
  };
  
  const handleDeleteCompany = (id: string) => {
    // Store the ID and show confirmation alert
    setCompanyToDelete(id);
    setAlert({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this company? This action cannot be undone.'
    });
  };
  
  // Handle alert close with different actions based on alert type
  const handleAlertClose = async (confirmed: boolean = false) => {
    // If this is a warning alert and user confirmed, perform the delete
    if (alert.type === 'warning' && confirmed && companyToDelete) {
      try {
        // Delete the company from the API
        await axios.delete(`/api/admin/companies/${companyToDelete}`);
        
        // Remove the company from the local state
        setCompanies(prevCompanies => prevCompanies.filter(company => company.id !== companyToDelete));
        
        // Show success message
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Company has been deleted successfully.'
        });
        
        // Clear the company to delete
        setCompanyToDelete(null);
        
        // Auto close the success message after 3 seconds
        setTimeout(() => {
          setAlert(prev => ({ ...prev, isOpen: false }));
        }, 3000);
      } catch (error: any) {
        console.error('Error deleting company:', error);
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: error.response?.data?.error || 'Failed to delete company. Please try again.'
        });
        setCompanyToDelete(null);
      }
    } else {
      // Just close the alert if not confirmed or not a warning
      setAlert(prev => ({ ...prev, isOpen: false }));
    }
  };
  
  return (
    <AdminLayout>
      <Head>
        <title>Companies Management | Talnurt Recruitment Portal</title>
      </Head>
      
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Companies Management
          </h1>
          
          <button
            onClick={() => {
              setEditingCompany(null);
              setNewCompany({ 
                name: '', 
                description: '', 
                industry: '', 
                location: '', 
                logo_url: '',
                website_url: '',
                linkedin_url: '',
                speciality: ''
              });
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              setShowAddForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Add New Company
          </button>
        </div>
        
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6 text-center">
              {editingCompany ? 'Edit Company' : 'Add Company'}
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Company Logo
                </label>
                <div className="mt-1 flex items-center flex-col sm:flex-row">
                  <div className="flex-shrink-0 h-16 w-16 mr-4 border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {(selectedFile || (editingCompany && editingCompany.logo_url)) ? (
                      <img 
                        src={selectedFile ? URL.createObjectURL(selectedFile) : editingCompany?.logo_url || PLACEHOLDER_IMAGE} 
                        alt="Logo preview" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    ) : (
                      <FaImage className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Only JPG, JPEG or PNG. Max size: 5MB</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Enter company name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="companyIndustry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry <span className="text-red-500">*</span>
                </label>
                <select
                  id="companyIndustry"
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an Industry</option>
                  {isLoadingIndustries ? (
                    <option value="">Loading industries...</option>
                  ) : (
                    industries.map(industry => (
                      <option key={industry.id} value={industry.name}>{industry.name}</option>
                    ))
                  )}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    id="websiteUrl"
                    type="text"
                    value={newCompany.website_url || ''}
                    onChange={(e) => setNewCompany({ ...newCompany, website_url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    id="linkedinUrl"
                    type="text"
                    value={newCompany.linkedin_url || ''}
                    onChange={(e) => setNewCompany({ ...newCompany, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/company/example"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="companySpeciality" className="block text-sm font-medium text-gray-700 mb-1">
                    Speciality
                  </label>
                  <input
                    id="companySpeciality"
                    type="text"
                    value={newCompany.speciality || ''}
                    onChange={(e) => setNewCompany({ ...newCompany, speciality: e.target.value })}
                    placeholder="Enter speciality"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="companyLocation" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    id="companyLocation"
                    type="text"
                    value={newCompany.location}
                    onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                    placeholder="Enter location"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  About
                </label>
                <textarea
                  id="companyDescription"
                  value={newCompany.description}
                  onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                  placeholder="Describe the company"
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
                  onClick={editingCompany ? handleUpdateCompany : handleAddCompany}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-40"
                >
                  {editingCompany ? 'Update Company' : 'Add Company'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-800">Companies List</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Loading companies...</p>
                    </td>
                  </tr>
                ) : (
                  companies.map((company, index) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                        {company.logo_url ? (
                          <img 
                            src={company.logo_url} 
                            alt={company.name} 
                            className="w-8 h-8 rounded-full object-cover mr-2"
                            onError={(e) => {
                              e.currentTarget.src = PLACEHOLDER_IMAGE;
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <span className="text-gray-500 text-sm font-medium">
                              {company.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {company.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.industry || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.location || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="text-amber-500 hover:text-amber-600 mr-3"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete"
                        >
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                
                {!isLoading && companies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No companies found. Add a new company to get started.
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

export default CompaniesPage;
