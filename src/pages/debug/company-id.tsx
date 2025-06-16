import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import toast from 'react-hot-toast';

interface CompanyData {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      company: string;
    }
  };
  database: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      company_id: string;
    };
    company: any;
  };
  profileAllocations: Array<{
    id: string;
    jobTitle: string;
    createdBy: {
      id: string;
      name: string;
      email: string;
      company_id: string;
    }
  }>;
}

const CompanyIdDebugPage: React.FC = () => {
  const { data: session } = useSession();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/debug/company-id');
      if (response.ok) {
        const data = await response.json();
        setCompanyData(data);
        if (data.database?.user?.company_id) {
          setSelectedCompanyId(data.database.user.company_id);
        } else if (data.profileAllocations?.length > 0) {
          setSelectedCompanyId(data.profileAllocations[0].createdBy.company_id || '');
        }
      } else {
        toast.error('Failed to load data');
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCompanyId = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/debug/company-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company_id: selectedCompanyId }),
      });

      if (response.ok) {
        toast.success('Company ID updated successfully');
        fetchCompanyData();
      } else {
        const error = await response.json();
        toast.error(`Failed to update: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating company ID:', error);
      toast.error('Error updating company ID');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Company ID Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(companyData?.session, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Information</h2>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(companyData?.database, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Allocations</h2>
          <div className="bg-gray-50 p-4 rounded mb-4">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(companyData?.profileAllocations, null, 2)}
            </pre>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Update User's Company ID</h3>
            <p className="text-gray-600 mb-4">
              Select a company ID from the profile allocations to fix the mismatch.
            </p>
            
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Company ID
                </label>
                <input
                  type="text"
                  id="companyId"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  placeholder="Enter company ID"
                />
              </div>
              <button
                onClick={handleUpdateCompanyId}
                disabled={isSaving || !selectedCompanyId}
                className={`px-4 py-2 rounded-md text-white ${
                  isSaving || !selectedCompanyId
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSaving ? 'Updating...' : 'Update Company ID'}
              </button>
            </div>
            
            {companyData?.profileAllocations && companyData.profileAllocations.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Select:</p>
                <div className="flex flex-wrap gap-2">
                  {companyData.profileAllocations.map((allocation) => (
                    <button
                      key={allocation.id}
                      onClick={() => setSelectedCompanyId(allocation.createdBy.company_id)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      {allocation.createdBy.company_id.substring(0, 8)}... ({allocation.jobTitle})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default CompanyIdDebugPage; 