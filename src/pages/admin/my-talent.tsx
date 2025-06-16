import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import CandidateCard from '@/components/Talent/CandidateCard';
import CandidateForm from '@/components/Talent/CandidateForm';
import ExcelUploader from '@/components/Talent/ExcelUploader';
import ExportFilterModal from '@/components/Talent/ExportFilterModal';
import { FaSearch, FaFilter, FaPlus, FaFileExcel, FaUpload, FaTable, FaTimes, FaFileAlt, FaTrash, FaEdit, FaExclamationTriangle } from 'react-icons/fa';
import { Candidate } from '@/types';
import { GetServerSideProps } from 'next';
import { exportCandidatesToExcel, ExportFilters } from '@/utils/excelExport';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';

interface MyTalentProps {
  initialCandidates: Candidate[];
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch candidates from our API endpoint with source=mytalent to get only admin-added candidates
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.VERCEL_URL || 'localhost:3000';
    const res = await fetch(`${protocol}://${host}/api/candidates?source=mytalent`);
    
    if (!res.ok) {
      console.error(`Failed to fetch candidates: ${res.status} ${res.statusText}`);
      // Return an empty array if there's an error, not mock data
      return {
        props: {
          initialCandidates: [],
        },
      };
    }
    
    const candidates = await res.json();
    
    return {
      props: {
        initialCandidates: candidates,
      },
    };
  } catch (error) {
    console.error('Error fetching candidates:', error);
    // Return empty array if there's an error, not mock data
    return {
      props: {
        initialCandidates: [],
      },
    };
  }
};

const MyTalent: React.FC<MyTalentProps> = ({ initialCandidates }) => {
  const router = useRouter();
  const { refresh } = router.query;
  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(initialCandidates);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  // Add state for delete confirmation
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Extracted unique options for filters
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [educationOptions, setEducationOptions] = useState<string[]>([]);
  
  const manualEntryModalRef = useRef<HTMLDivElement>(null);
  
  // Extract filter options from candidates
  useEffect(() => {
    if (candidates && candidates.length > 0) {
      // Extract unique skills
      const allSkills = candidates.flatMap(candidate => candidate.skills || []);
      const uniqueSkills = Array.from(new Set(allSkills));
      setSkillOptions(uniqueSkills);
      
      // Extract unique companies (as industries)
      const allCompanies = candidates.flatMap(candidate => 
        candidate.experience.map(exp => exp.company)
      ).filter(Boolean);
      const uniqueCompanies = Array.from(new Set(allCompanies));
      setIndustryOptions(uniqueCompanies);
      
      // Extract unique education degrees
      const allDegrees = candidates.flatMap(candidate => 
        candidate.education.map(edu => edu.degree)
      ).filter(Boolean);
      const uniqueDegrees = Array.from(new Set(allDegrees));
      setEducationOptions(uniqueDegrees);
    }
  }, [candidates]);
  
  // Always refresh candidates when the page loads or when refresh query param changes
  useEffect(() => {
    refreshCandidates();
  }, [refresh]);
  
  // Refresh candidate list - this function is crucial for displaying the latest data
  const refreshCandidates = async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      // Use source=mytalent to get only candidates added manually, by resume parsing, or by importing spreadsheet
      const response = await fetch(`/api/candidates?source=mytalent&nocache=${timestamp}`);
      if (response.ok) {
        const freshCandidates = await response.json();
        console.log(`Fetched ${freshCandidates.length} candidates from database at ${new Date().toISOString()}`);
        
        // Update state with the fresh candidates
        setCandidates(freshCandidates);
        setFilteredCandidates(freshCandidates);
        
        // Reset any error messages
        setDeleteStatus(null);
        setSuccessMessage(null);
      } else {
        console.error('Failed to refresh candidates:', response.status, response.statusText);
        setDeleteStatus({
          success: false,
          message: 'Failed to fetch candidates'
        });
        
        // Clear the error after 3 seconds
        setTimeout(() => {
          setDeleteStatus(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error refreshing candidates:', error);
      setDeleteStatus({
        success: false,
        message: 'Error refreshing candidates'
      });
      
      // Clear the error after 3 seconds
      setTimeout(() => {
        setDeleteStatus(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showManualEntry && manualEntryModalRef.current && 
          !manualEntryModalRef.current.contains(event.target as Node)) {
        setShowManualEntry(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showManualEntry]);
  
  // Filter candidates whenever search term changes
  useEffect(() => {
    if (!searchTerm.trim() || !candidates) {
      setFilteredCandidates(candidates || []);
      return;
    }
    
    const filtered = candidates.filter(candidate => 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.skills && candidate.skills.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
    
    setFilteredCandidates(filtered);
  }, [searchTerm, candidates]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtering is now handled by the useEffect hook
  };
  
  const handleUpdateCandidate = (updatedCandidate: Candidate) => {
    setCandidates(prevCandidates => 
      prevCandidates.map(candidate => 
        candidate.id === updatedCandidate.id ? updatedCandidate : candidate
      )
    );
    
    // Also update filtered candidates if needed
    setFilteredCandidates(prevFiltered => 
      prevFiltered.map(candidate => 
        candidate.id === updatedCandidate.id ? updatedCandidate : candidate
      )
    );
  };
  
  const handleDeleteCandidate = async (candidateId: string) => {
    console.log(`Handling deletion of candidate: ${candidateId}`);
    
    try {
      // Make API call to delete the candidate
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Check if the deletion was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || errorData?.message || 'Failed to delete candidate');
      }
      
      // Parse the response data
      const data = await response.json();
      console.log('Delete response:', data);
      
      // If successful, update the UI by removing the candidate
    setCandidates(prevCandidates => 
      prevCandidates.filter(candidate => candidate.id !== candidateId)
    );
    
    // Also update filtered candidates
    setFilteredCandidates(prevFiltered => 
      prevFiltered.filter(candidate => candidate.id !== candidateId)
    );
    
    // Show success message
    setDeleteStatus({
      success: true,
      message: 'Candidate deleted successfully'
    });
    
    // Clear the message after 3 seconds
    setTimeout(() => {
      setDeleteStatus(null);
    }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      setDeleteStatus({
        success: false,
        message: error.message || 'Failed to delete candidate'
      });
      
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setDeleteStatus(null);
      }, 3000);
    }
  };
  
  const handleManualSubmit = async (candidate: Candidate) => {
    setIsLoading(true);
    try {
      // Check if we're updating an existing candidate or creating a new one
      const isUpdating = selectedCandidate !== null;
      
      // Send the candidate data to the API
      const url = isUpdating ? `/api/candidates/${candidate.id}` : '/api/candidates';
      const method = isUpdating ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidate),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to process candidate');
      }
      
      const savedCandidate = await res.json();
      
      // Update state based on operation type
      if (isUpdating) {
        setCandidates(prev => 
          prev.map(c => c.id === savedCandidate.id ? savedCandidate : c)
        );
        setSuccessMessage('Candidate updated successfully!');
      } else {
        // Add the new candidate to our state
        setCandidates(prev => [savedCandidate, ...prev]);
        setSuccessMessage('Candidate added successfully!');
      }
      
      // Close the modal and reset selected candidate
      setShowManualEntry(false);
      setSelectedCandidate(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error processing candidate:', error);
      setDeleteStatus({
        success: false,
        message: error.message || 'Failed to process candidate'
      });
      
      // Clear the error after 3 seconds
      setTimeout(() => {
        setDeleteStatus(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle bulk Excel upload of candidates
  const handleExcelUpload = async (newCandidates: Candidate[]) => {
    setIsLoading(true);
    try {
      // Keep track of successful imports
      let successCount = 0;
      
      // Process each candidate
      for (const candidate of newCandidates) {
        // Send the candidate data to the API
        const res = await fetch('/api/candidates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(candidate),
        });
        
        if (res.ok) {
          const newCandidate = await res.json();
          
          // Add the new candidate to our state
          setCandidates(prev => [newCandidate, ...prev]);
          successCount++;
        }
      }
      
      // Show success message
      setSuccessMessage(`Successfully imported ${successCount} of ${newCandidates.length} candidates`);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error: any) {
      console.error('Error importing candidates:', error);
      setDeleteStatus({
        success: false,
        message: `Failed to import candidates: ${error.message || 'Unknown error'}`
      });
      
      // Clear the error after 5 seconds
      setTimeout(() => {
        setDeleteStatus(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle export with filters
  const handleExport = (filters: ExportFilters) => {
    try {
      // Apply filters if provided
      let dataToExport = [...candidates];
      
      if (filters.skills && filters.skills.length > 0) {
        dataToExport = dataToExport.filter(candidate => 
          candidate.skills.some(skill => filters.skills!.includes(skill))
        );
      }
      
      if (filters.industries && filters.industries.length > 0) {
        dataToExport = dataToExport.filter(candidate => 
          candidate.experience.some(exp => filters.industries!.includes(exp.company))
        );
      }
      
      if (filters.educationLevels && filters.educationLevels.length > 0) {
        dataToExport = dataToExport.filter(candidate => 
          candidate.education.some(edu => filters.educationLevels!.includes(edu.degree))
        );
      }
      
      // Call the export function
      const result = exportCandidatesToExcel(dataToExport);
      
      setSuccessMessage(`Successfully exported ${result.totalExported} candidates to ${result.filename}`);
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Close the export modal
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting candidates:', error);
      setDeleteStatus({
        success: false,
        message: 'Error exporting candidates'
      });
      
      // Clear the error after 3 seconds
      setTimeout(() => {
        setDeleteStatus(null);
      }, 3000);
    }
  };
  
  // Add new handler for showing the Excel uploader
  const toggleExcelUploader = () => {
    setShowExcelUploader(!showExcelUploader);
  };
  
  // We no longer need the click outside handler for deleteAllModal since we're using ConfirmationDialog
  
  // Add a new function to handle deleting all candidates
  const handleDeleteAllCandidates = async () => {
    setIsDeletingAll(true);
    try {
      // Call the API to delete all candidates
      const response = await fetch('/api/candidates/delete-all', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete all candidates');
      }
      
      // Clear the candidates from state
      setCandidates([]);
      setFilteredCandidates([]);
      
      // Close the confirmation modal
      setShowDeleteAllConfirm(false);
      
      // Show success message
      setDeleteStatus({
        success: true,
        message: 'All candidates deleted successfully'
      });
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setDeleteStatus(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error deleting all candidates:', error);
      setDeleteStatus({
        success: false,
        message: `Failed to delete all candidates: ${error.message}`
      });
      
      // Clear the error message after 5 seconds
      setTimeout(() => {
        setDeleteStatus(null);
      }, 5000);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>My Talent | Talnurt Recruitment Portal</title>
      </Head>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {(() => {
          try {
            return (
              <>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Talent</h1>
          
          <div className="flex gap-3">
            {/* Only the Use Me button */}
            <Link href="/admin/deepseek-resume-parser">
              <button className="px-4 py-2.5 bg-indigo-600 text-white rounded-md flex items-center hover:bg-indigo-700 transition-colors">
                <FaFileAlt className="mr-2" />
                Resume Parser
              </button>
            </Link>
            
            {/* Add Candidate button */}
                    <Link
                      href="/admin/candidates/add" 
              className="px-4 py-2.5 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Add Candidate
                    </Link>
            
            {/* Import Excel button */}
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md flex items-center hover:bg-gray-50 transition-colors"
              onClick={toggleExcelUploader}
            >
              <FaUpload className="mr-2" />
              Import Excel
            </button>
            
            {/* Export button */}
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md flex items-center hover:bg-gray-50 transition-colors"
              onClick={() => setShowExportModal(true)}
            >
              <FaFileExcel className="mr-2" />
              Export
            </button>
            
            {/* Delete All Button */}
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md flex items-center hover:bg-gray-50 transition-colors"
              onClick={() => setShowDeleteAllConfirm(true)}
            >
              <FaTrash className="mr-2" />
              Delete All
            </button>
          </div>
        </div>
        
        {/* Search and filters */}
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
        
        {/* Success/Error Messages */}
        {deleteStatus && (
          <div 
            className={`p-4 rounded-lg mb-6 ${deleteStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {deleteStatus.message}
          </div>
        )}
        
        {successMessage && (
          <div className="p-4 bg-green-100 text-green-800 rounded-lg mb-6">
            {successMessage}
          </div>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center p-4 mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}
        
                {/* Pipeline content - always show this now */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Remove the tabs section and just keep the heading */}
                  <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-medium text-gray-800">All Candidates</h2>
          </div>
          
          {/* Candidate Table */}
          <div className="p-6">
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No candidates found. Add candidates or adjust your search criteria.</p>
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
                    <tbody className="divide-y divide-gray-200">
                      {filteredCandidates.map((candidate, index) => (
                        <tr key={candidate.id} className="bg-white hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{candidate.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-500">{candidate.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-500">
                              {candidate.phone ? (
                                candidate.phone.startsWith('+') ? candidate.phone : `+1 ${candidate.phone}`
                              ) : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                                      {candidate.skills && candidate.skills.slice(0, 3).map((skill, index) => {
                                // Use different color backgrounds for different skills to match the screenshot
                                const skillColors = [
                                  { bg: "bg-blue-50", text: "text-blue-700" },
                                  { bg: "bg-indigo-50", text: "text-indigo-700" },
                                  { bg: "bg-purple-50", text: "text-purple-700" }
                                ];
                                const colorIndex = index % skillColors.length;
                                return (
                                  <span 
                                    key={index} 
                                    className={`${skillColors[colorIndex].bg} ${skillColors[colorIndex].text} text-xs px-2.5 py-1 rounded-full`}
                                  >
                                    {skill}
                                  </span>
                                );
                              })}
                                      {candidate.skills && candidate.skills.length > 3 && (
                                <span className="text-xs text-gray-500 px-2.5 py-1">
                                  +{candidate.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex gap-2 justify-end">
                              <Link 
                                href={`/admin/candidates/${candidate.id}`}
                                className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                          setCandidateToDelete(candidate.id);
                                          setShowDeleteConfirm(true);
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
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
              </>
            );
          } catch (error) {
            console.error("Error rendering My Talent page:", error);
            return (
              <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
                <h2 className="text-xl font-bold text-red-800 mb-4">Something went wrong</h2>
                <p className="mb-4 text-red-600">There was an error loading this component.</p>
                              <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                              >
                  Reload page
                              </button>
                            </div>
            );
          }
        })()}
      </div>
      
      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div 
            ref={manualEntryModalRef}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedCandidate ? 'Edit Candidate' : 'Add New Candidate'}
              </h2>
              <button 
                onClick={() => {
                  setShowManualEntry(false);
                  setSelectedCandidate(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <CandidateForm 
                onSubmit={handleManualSubmit}
                onCancel={() => {
                  setShowManualEntry(false);
                  setSelectedCandidate(null);
                }}
                initialData={selectedCandidate || undefined}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Excel Upload Modal */}
      {showExcelUploader && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Bulk Upload Candidates</h2>
              <button 
                onClick={toggleExcelUploader}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <ExcelUploader onUpload={(candidates) => {
                handleExcelUpload(candidates);
                toggleExcelUploader();
              }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full">
            <ExportFilterModal 
              onExport={handleExport}
              onCancel={() => setShowExportModal(false)}
              skillOptions={skillOptions}
              industryOptions={industryOptions}
              educationOptions={educationOptions}
            />
          </div>
        </div>
      )}
      
      {/* Delete All Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteAllConfirm}
        title="Delete All Candidates"
        message="You are about to delete all candidates from your talent pool. This will permanently remove all candidate data from the system."
        confirmLabel={isDeletingAll ? "Deleting..." : "Delete All Candidates"}
        cancelLabel="Cancel"
        type="danger"
        onConfirm={handleDeleteAllCandidates}
        onCancel={() => setShowDeleteAllConfirm(false)}
      />
      
      {/* Delete Candidate Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
            </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Candidate</h3>
              
              <p className="text-center text-gray-600 mb-6">
                Are you sure you want to delete this candidate? This action cannot be undone.
                </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setCandidateToDelete(null);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (candidateToDelete) {
                      handleDeleteCandidate(candidateToDelete);
                      setCandidateToDelete(null);
                    }
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default MyTalent; 