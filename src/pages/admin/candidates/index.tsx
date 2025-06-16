import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import Head from 'next/head';
import CandidateCard from '@/components/Talent/CandidateCard';
import { Candidate } from '@/types';
import { FaUpload, FaUserPlus, FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';

const CandidatesPage = () => {
  const router = useRouter();
  const { refresh } = router.query;
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCandidates = async () => {
    setLoading(true);
    setError('');
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      // Explicitly exclude frontend registered candidates
      const res = await fetch(`/api/candidates?exclude=frontend&nocache=${timestamp}`);
      if (!res.ok) throw new Error('Failed to fetch candidates');
      const data = await res.json();
      setCandidates(data);
      setFilteredCandidates(data);
    } catch (err) {
      setError('Failed to load candidates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh candidates when the page loads or route changes
  useEffect(() => {
    fetchCandidates();
  }, [router.asPath, refresh]);

  // Listen for route change completion to refresh
  useEffect(() => {
    const handleRouteChangeComplete = () => {
      console.log('Route change complete, refreshing candidates list');
      fetchCandidates();
    };

    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, []);

  const handleDeleteClick = (candidateId: string) => {
    setCandidateToDelete(candidateId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!candidateToDelete) return;
    try {
      const response = await fetch(`/api/candidates/${candidateToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Remove the deleted candidate from both arrays
        const updatedCandidates = candidates.filter(c => c.id !== candidateToDelete);
        setCandidates(updatedCandidates);
        setFilteredCandidates(filteredCandidates.filter(c => c.id !== candidateToDelete));
      } else {
        console.error('Failed to delete candidate');
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
    } finally {
      setIsDeleteDialogOpen(false);
      setCandidateToDelete(null);
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

  return (
    <AdminLayout>
      <Head>
        <title>My Talent | Talnurt Recruitment Portal</title>
      </Head>
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            My Talent
          </h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/admin/candidates/add"
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaUserPlus className="mr-2" />
              Add Candidate
            </Link>
          </div>
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

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 bg-white rounded-lg shadow">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow">
            <p className="text-gray-600">No candidates found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
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
                      <th className="px-6 py-3 font-medium">SOURCE</th>
                      <th className="px-6 py-3 font-medium">SKILLS</th>
                      <th className="px-6 py-3 font-medium text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((candidate) => (
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-600">
                            {candidate.source === 'manual' && 'Manually Added'}
                            {candidate.source === 'resume' && 'Resume Parsing'}
                            {candidate.source === 'excel' && 'Excel Import'}
                            {!candidate.source && 'Manually Added'}
                          </div>
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
                          <div className="flex justify-end space-x-3">
                            <a
                              href={`/admin/candidates/${candidate.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Profile
                            </a>
                            <button
                              onClick={() => handleDeleteClick(candidate.id)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          title="Delete Candidate"
          message="Are you sure you want to delete this candidate? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          type="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteDialogOpen(false)}
        />
      </div>
    </AdminLayout>
  );
};

export default CandidatesPage; 