import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import CandidateCard from '@/components/Talent/CandidateCard';
import { FaSearch, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { Candidate } from '@/types';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';

interface GlobalTalentProps {
  initialCandidates: Candidate[];
}

// Server-side function to get initial candidates
export async function getServerSideProps() {
  try {
    // Call the API with source=globaltalent to get only frontend-registered candidates
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/candidates?source=globaltalent`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    
    return {
      props: {
        initialCandidates: data || [],
      },
    };
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return {
      props: {
        initialCandidates: [],
      },
    };
  }
}

const GlobalTalent: React.FC<GlobalTalentProps> = ({ initialCandidates }) => {
  const router = useRouter();
  const { refresh } = router.query;
  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(initialCandidates);
  const [isLoading, setIsLoading] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add a useEffect to refresh when the route changes or when it mounts
  useEffect(() => {
    // Refresh the candidate list when the component mounts or when router changes
    refreshCandidates();
  }, [router.asPath, refresh]);

  // Make sure to refresh on successful return from other pages
  useEffect(() => {
    // Listen for route change complete events
    const handleRouteChangeComplete = () => {
      console.log('Route change complete, refreshing candidates list');
      refreshCandidates();
    };

    // Add the event listener
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Clean up the event listener when component unmounts
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, []);

  // Function to refresh candidates
  const refreshCandidates = async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      // Use source=globaltalent to get only candidates who registered from the website
      const response = await fetch(`/api/candidates?source=globaltalent&nocache=${timestamp}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched ${data.length} frontend-registered candidates from database`);
        
        // Make sure we have data before updating state
        if (Array.isArray(data)) {
          setCandidates(data);
          setFilteredCandidates(data);
        } else {
          console.error('Received invalid data format from API:', data);
          setCandidates([]);
          setFilteredCandidates([]);
        }
      } else {
        console.error('Failed to refresh candidates:', response.status, response.statusText);
        setCandidates([]);
        setFilteredCandidates([]);
      }
    } catch (error) {
      console.error('Error refreshing candidates:', error);
      setCandidates([]);
      setFilteredCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle search
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(candidates);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = candidates.filter((candidate) => {
      return (
        candidate.name?.toLowerCase().includes(searchTermLower) ||
        candidate.email?.toLowerCase().includes(searchTermLower) ||
        candidate.skills?.some((skill) => skill.toLowerCase().includes(searchTermLower))
      );
    });

    setFilteredCandidates(filtered);
  };

  // Handle search on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Handle deleting a candidate
  const handleDeleteCandidate = async (candidateId: string) => {
    if (!candidateId) return;
    
    setIsDeleting(true);
    try {
      // Call the API to delete the candidate
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the candidate from state
        setCandidates(prevCandidates => 
          prevCandidates.filter(candidate => candidate.id !== candidateId)
        );
        setFilteredCandidates(prevFiltered => 
          prevFiltered.filter(candidate => candidate.id !== candidateId)
        );
        
        setDeleteStatus({
          success: true,
          message: 'Candidate deleted successfully',
        });
        
        // Clear the success message after 3 seconds
        setTimeout(() => {
          setDeleteStatus(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        setDeleteStatus({
          success: false,
          message: errorData.error || 'Failed to delete candidate',
        });
        
        // Clear the error message after 3 seconds
        setTimeout(() => {
          setDeleteStatus(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      setDeleteStatus({
        success: false,
        message: 'An error occurred while deleting the candidate',
      });
      
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setDeleteStatus(null);
      }, 3000);
    } finally {
      setIsDeleting(false);
      setCandidateToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Global Talent | Talnurt Recruitment Portal</title>
      </Head>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Global Talent
          </h1>
        </div>

        {/* Search bar */}
        <div className="bg-white rounded-lg shadow-sm mb-6 flex">
          <div className="flex-grow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by name, email, or skills..."
                className="w-full py-3 pl-10 pr-3 border-0 outline-none rounded-lg focus:ring-0 placeholder-gray-400"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center p-4 mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}

        {/* Candidates List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-800">Website Registered Candidates</h2>
            <p className="text-sm text-gray-500 mt-1">Candidates who registered through the website signup process</p>
          </div>

          <div className="p-6">
            {/* Status Messages */}
            {deleteStatus && (
              <div className={`mb-4 p-3 rounded-md ${deleteStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {deleteStatus.message}
              </div>
            )}
            
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No website-registered candidates found. When users register through the website, they will appear here.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-500 px-2">
                  Showing {filteredCandidates.length} {filteredCandidates.length === 1 ? 'candidate' : 'candidates'}
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-gray-700 bg-gray-50">
                        <th className="px-6 py-3 font-medium">NAME</th>
                        <th className="px-6 py-3 font-medium">EMAIL</th>
                        <th className="px-6 py-3 font-medium">PHONE</th>
                        <th className="px-6 py-3 font-medium">SKILLS</th>
                        <th className="px-6 py-3 font-medium text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((candidate, index) => (
                        <tr key={candidate.id} className="bg-white hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{candidate.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-600">{candidate.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-600">{candidate.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {candidate.skills && candidate.skills.length > 0 ? (
                                candidate.skills.slice(0, 3).map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500">No skills listed</span>
                              )}
                              {candidate.skills && candidate.skills.length > 3 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                  +{candidate.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-4">
                              <a
                                href={`/admin/global-talent/${candidate.id}`}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View Profile
                              </a>
                              <button
                                onClick={() => {
                                  setCandidateToDelete(candidate.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Delete candidate"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Candidate"
        message="Are you sure you want to delete this candidate? This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Candidate"}
        cancelLabel="Cancel"
        type="danger"
        onConfirm={() => {
          if (candidateToDelete) {
            handleDeleteCandidate(candidateToDelete);
          }
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setCandidateToDelete(null);
        }}
      />
    </AdminLayout>
  );
};

export default GlobalTalent;