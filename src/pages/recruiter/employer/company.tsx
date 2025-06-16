import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaBuilding, FaEdit, FaSave, FaTimes, FaIndustry, FaMapMarkerAlt, FaGlobe, FaLinkedin, FaInfoCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  industry_id?: string;
  location?: string;
  description?: string;
  logo_url?: string;
  website?: string;
}

interface CompanyProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || !session.user?.id) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // Check if user has employer access
  if (session.user.role !== 'employer') {
    return {
      redirect: {
        destination: '/recruiter/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.user.id,
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: session.user.role || 'employer',
      },
    },
  };
};

const CompanyProfile: React.FC<CompanyProfileProps> = ({ user }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: '',
    industry: '',
    location: '',
    description: '',
    logo_url: '',
    website: '',
  });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    setIsLoading(true);
    try {
      // Fetch company profile
      const companyResponse = await fetch('/api/recruiter/employer/company');
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData.company);
        if (companyData.company) {
          setCompanyForm(companyData.company);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading company data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/recruiter/employer/company', {
        method: company ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyForm),
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        setShowCompanyForm(false);
        toast.success(company ? 'Company updated successfully' : 'Company created successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save company');
      }
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Error saving company');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <Head>
          <title>Company Profile | Talnurt Recruitment Portal</title>
        </Head>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <Head>
        <title>Company Profile | Talnurt Recruitment Portal</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <FaBuilding className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Company Profile</h1>
                <p className="text-blue-100 mt-1">
                  Manage your company information
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/recruiter/employer/teams" 
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-blue-500"
          >
            <h3 className="font-medium text-gray-900">Teams Management</h3>
            <p className="text-sm text-gray-600 mt-1">Create and manage your company teams</p>
          </Link>
          <Link 
            href="/recruiter/employer/employees" 
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-green-500"
          >
            <h3 className="font-medium text-gray-900">Company Employees</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage all employees in your company</p>
          </Link>
          <Link 
            href="/recruiter/employer/user-requests" 
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-purple-500"
          >
            <h3 className="font-medium text-gray-900">User Creation Requests</h3>
            <p className="text-sm text-gray-600 mt-1">Request new user accounts for your team</p>
          </Link>
        </div>

        {/* Company Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FaBuilding className="mr-2 text-blue-600" />
              Company Profile
            </h2>
            <button
              onClick={() => setShowCompanyForm(!showCompanyForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {company ? <FaEdit className="h-4 w-4" /> : <FaBuilding className="h-4 w-4" />}
              {company ? 'Edit Profile' : 'Create Profile'}
            </button>
          </div>

          {company && !showCompanyForm ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{company.name}</h3>
                {company.industry_id && (
                  <p className="text-gray-600 flex items-center mb-2">
                    <FaIndustry className="mr-2" />
                    {company.industry_id}
                  </p>
                )}
                {company.location && (
                  <p className="text-gray-600 flex items-center mb-2">
                    <FaMapMarkerAlt className="mr-2" />
                    {company.location}
                  </p>
                )}
                {company.website && (
                  <p className="text-gray-600 flex items-center mb-2">
                    <FaGlobe className="mr-2" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {company.website}
                    </a>
                  </p>
                )}
              </div>
              {company.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{company.description}</p>
                </div>
              )}
            </div>
          ) : showCompanyForm ? (
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={companyForm.industry}
                    onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={companyForm.location}
                    onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={companyForm.logo_url}
                    onChange={(e) => setCompanyForm({ ...companyForm, logo_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FaSave className="h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompanyForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FaTimes className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <FaBuilding className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No company profile found. Create one to get started.</p>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start">
            <FaInfoCircle className="text-blue-500 mt-1 mr-3" />
            <div>
              <h3 className="font-medium text-blue-800">Managing Your Company</h3>
              <p className="text-sm text-blue-700 mt-1">
                Use the links above to manage your teams, view employees, and request new user accounts. 
                Complete your company profile to provide more information to potential candidates and team members.
              </p>
            </div>
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default CompanyProfile; 