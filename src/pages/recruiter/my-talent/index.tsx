import React, { useState, useEffect, useRef } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import CandidateCard from '@/components/Talent/CandidateCard';
import CandidateForm from '@/components/Talent/CandidateForm';
import ExcelUploader from '@/components/Talent/ExcelUploader';
import ExportFilterModal from '@/components/Talent/ExportFilterModal';
import { FaSearch, FaFilter, FaPlus, FaFileExcel, FaUpload, FaTable, FaTimes, FaFileAlt, FaTrash, FaEdit, FaExclamationTriangle, FaEye } from 'react-icons/fa';
import { Candidate } from '@/types';
import { exportCandidatesToExcel, ExportFilters } from '@/utils/excelExport';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import { executeQuery } from '@/lib/db';

interface MyTalentProps {
  initialCandidates: Candidate[];
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
  connectionError?: string;
}

// Ensure candidate tables exist
const ensureCandidateTablesExist = async () => {
  try {
    console.log('Ensuring candidate tables exist...');
    
    // Create candidates table with correct schema
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        skills JSONB,
        resume_url VARCHAR(255),
        relevancy_score INTEGER,
        github_url VARCHAR(255),
        linkedin_url VARCHAR(255),
        source VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create recruiter_candidates association table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS recruiter_candidates (
        id VARCHAR(36) PRIMARY KEY,
        recruiter_id VARCHAR(36) NOT NULL,
        candidate_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(recruiter_id, candidate_id)
      )
    `);
    
    return true;
  } catch (error) {
    console.error('Error ensuring candidate tables exist:', error);
    return false;
  }
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // Allow both recruiters and employees to access this page
  const allowedRoles = ['recruiter', 'employee', 'manager', 'employer'];
  if (!session || !allowedRoles.includes(session.user.role)) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const recruiterId = session.user.id;
  let candidates: Candidate[] = [];

  try {
    // First, check if the database connection works
    try {
      await executeQuery('SELECT 1');
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      // If we can't connect to the database, return empty array rather than failing
      return {
        props: {
          initialCandidates: [],
          user: {
            id: session.user.id || '',
            name: session.user.name || '',
            email: session.user.email || '',
            role: session.user.role || 'recruiter',
          },
          connectionError: 'Database connection failed. Please try again later.'
        },
      };
    }

    // Next, ensure the tables exist
    await ensureCandidateTablesExist();
    
    // Then check if the table exists (it should now, but just to be safe)
    const tableExists = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recruiter_candidates'
      )
    `);

    if (tableExists && tableExists[0] && tableExists[0].exists) {
      // Query to get all candidates added by this recruiter - similar to the API endpoint
      const candidatesData = await executeQuery(`
        SELECT c.* 
        FROM candidates c
        JOIN recruiter_candidates rc ON c.id = rc.candidate_id
        WHERE rc.recruiter_id = $1
        ORDER BY rc.created_at DESC
      `, [recruiterId]);

      // Format the candidates data
      candidates = candidatesData.map((candidate: any) => {
        // Parse JSON strings if needed
        let skills: string[] = [];

        try {
          if (candidate.skills) {
            skills = typeof candidate.skills === 'string' 
              ? JSON.parse(candidate.skills) 
              : candidate.skills;
          }
        } catch (error) {
          console.error('Error parsing candidate skills data:', error);
        }

        // Convert Date objects to ISO strings to ensure they can be serialized
        const createdAt = candidate.created_at instanceof Date 
          ? candidate.created_at.toISOString() 
          : typeof candidate.created_at === 'string' 
            ? candidate.created_at 
            : null;
            
        const updatedAt = candidate.updated_at instanceof Date 
          ? candidate.updated_at.toISOString() 
          : typeof candidate.updated_at === 'string' 
            ? candidate.updated_at 
            : null;

        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone || null,
          skills: skills,
          experience: [],
          education: [],
          resumeUrl: candidate.resume_url || null,
          githubUrl: candidate.github_url || null,
          linkedinUrl: candidate.linkedin_url || null,
          source: 'recruiter',
          createdAt: createdAt,
          updatedAt: updatedAt,
        };
      });
    }
    
    // Add a serialization safety net by converting the candidates to a serializable format
    const serializableCandidates = JSON.parse(JSON.stringify(candidates));
    
    return {
      props: {
        initialCandidates: serializableCandidates,
        user: {
          id: session.user.id || '',
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role || 'recruiter',
        },
      },
    };
  } catch (error) {
    console.error('Error fetching candidates directly from database:', error);
    return {
      props: {
        initialCandidates: [],
        user: {
          id: session.user.id || '',
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role || 'recruiter',
        },
        error: 'Failed to fetch candidates. Please try again later.'
      },
    };
  }
};

const RecruiterMyTalent: React.FC<MyTalentProps> = ({ initialCandidates, user, error, connectionError }) => {
  const router = useRouter();
  const { refresh } = router.query;
  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(initialCandidates);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(error || connectionError || null);
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
        candidate.experience?.map(exp => exp.company)
      ).filter(Boolean);
      const uniqueCompanies = Array.from(new Set(allCompanies));
      setIndustryOptions(uniqueCompanies);
      
      // Extract unique education degrees
      const allDegrees = candidates.flatMap(candidate => 
        candidate.education?.map(edu => edu.degree)
      ).filter(Boolean);
      const uniqueDegrees = Array.from(new Set(allDegrees));
      setEducationOptions(uniqueDegrees);
    }
  }, [candidates]);
  
  // Always refresh candidates when the page loads or when refresh query param changes
  useEffect(() => {
    refreshCandidates();
  }, [refresh]);
  
  // Handle clicking outside the manual entry modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (manualEntryModalRef.current && !manualEntryModalRef.current.contains(event.target as Node)) {
        setShowManualEntry(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const refreshCandidates = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const res = await fetch('/api/recruiter/my-talent');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
        setFilteredCandidates(data);
      } else {
        console.error(`Failed to refresh candidates: ${res.status} ${res.statusText}`);
        setErrorMessage(`Failed to refresh candidates: ${res.statusText || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error refreshing candidates:', error);
      setErrorMessage('Failed to connect to the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(candidates);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = candidates.filter(candidate => {
      return (
        candidate.name?.toLowerCase().includes(searchTermLower) ||
        candidate.email?.toLowerCase().includes(searchTermLower) ||
        candidate.phone?.toLowerCase().includes(searchTermLower) ||
        candidate.skills?.some(skill => skill.toLowerCase().includes(searchTermLower))
      );
    });
    
    setFilteredCandidates(filtered);
  };
  
  const handleDeleteCandidate = async (id: string) => {
    setCandidateToDelete(id);
    setShowDeleteConfirm(true);
  };
  
  const confirmDeleteCandidate = async () => {
    if (!candidateToDelete) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/recruiter/my-talent/${candidateToDelete}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // Update UI
        setCandidates(candidates.filter(c => c.id !== candidateToDelete));
        setFilteredCandidates(filteredCandidates.filter(c => c.id !== candidateToDelete));
        setDeleteStatus({
          success: true,
          message: 'Candidate deleted successfully'
        });
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setDeleteStatus(null);
        }, 3000);
      } else {
        const errorData = await res.json();
        setDeleteStatus({
          success: false,
          message: errorData.error || 'Failed to delete candidate'
        });
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      setDeleteStatus({
        success: false,
        message: 'An error occurred while deleting the candidate'
      });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setCandidateToDelete(null);
    }
  };
  
  const handleExcelUpload = async (excelData: Candidate[]) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/recruiter/my-talent/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candidates: excelData }),
      });
      
      if (res.ok) {
        const result = await res.json();
        setSuccessMessage(`Successfully imported ${result.imported} candidates`);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        
        // Refresh candidates list
        refreshCandidates();
      } else {
        const errorData = await res.json();
        setDeleteStatus({
          success: false,
          message: errorData.error || 'Failed to import candidates'
        });
      }
    } catch (error) {
      console.error('Error importing candidates:', error);
      setDeleteStatus({
        success: false,
        message: 'An error occurred while importing candidates'
      });
    } finally {
      setIsLoading(false);
      setShowExcelUploader(false);
    }
  };
  
  const handleExportCandidates = (filters: ExportFilters) => {
    let candidatesToExport = [...filteredCandidates];
    
    // Apply filters if any are set
    if (filters.skills.length > 0) {
      candidatesToExport = candidatesToExport.filter(candidate => 
        candidate.skills.some(skill => filters.skills.includes(skill))
      );
    }
    
    if (filters.industries.length > 0) {
      candidatesToExport = candidatesToExport.filter(candidate => 
        candidate.experience.some(exp => filters.industries.includes(exp.company))
      );
    }
    
    if (filters.educationLevels.length > 0) {
      candidatesToExport = candidatesToExport.filter(candidate => 
        candidate.education.some(edu => filters.educationLevels.includes(edu.degree))
      );
    }
    
    if (filters.minExperience) {
      candidatesToExport = candidatesToExport.filter(candidate => {
        // Calculate years of experience based on the experience entries
        const totalMonths = candidate.experience.reduce((total, exp) => {
          const startDate = new Date(exp.startDate);
          const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
          const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth());
          return total + months;
        }, 0);
        
        // Convert months to years
        const yearsExperience = totalMonths / 12;
        return yearsExperience >= (filters.minExperience || 0);
      });
    }
    
    // Call utility function to generate and download Excel file
    exportCandidatesToExcel(candidatesToExport);
    setShowExportModal(false);
  };
  
  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const res = await fetch('/api/recruiter/my-talent/delete-all', {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setCandidates([]);
        setFilteredCandidates([]);
        setDeleteStatus({
          success: true,
          message: 'All candidates deleted successfully'
        });
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setDeleteStatus(null);
        }, 3000);
      } else {
        const errorData = await res.json();
        setDeleteStatus({
          success: false,
          message: errorData.error || 'Failed to delete all candidates'
        });
      }
    } catch (error) {
      console.error('Error deleting all candidates:', error);
      setDeleteStatus({
        success: false,
        message: 'An error occurred while deleting all candidates'
      });
    } finally {
      setIsDeletingAll(false);
      setShowDeleteAllConfirm(false);
    }
  };
  
  const handleSubmitCandidate = async (candidate: Candidate) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Make sure source is set to 'recruiter' for tracking purposes
      candidate.source = 'recruiter';
      
      const res = await fetch('/api/recruiter/my-talent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidate),
      });
      
      if (res.ok) {
        const newCandidate = await res.json();
        setCandidates([newCandidate, ...candidates]);
        setFilteredCandidates([newCandidate, ...filteredCandidates]);
        setSuccessMessage('Candidate added successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        
        // Close the modal
        setShowManualEntry(false);
      } else {
        const errorData = await res.json();
        console.error('Failed to add candidate:', errorData);
        setErrorMessage(errorData.error || 'Failed to add candidate');
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      setErrorMessage('An error occurred while adding the candidate');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCandidateView = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };
  
  return (
    <RecruiterLayout>
      <Head>
        <title>My Talent | Recruiter Dashboard</title>
      </Head>
      
      <div className="space-y-6">
        {/* Confirmation dialogs */}
        <ConfirmationDialog
          isOpen={showDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDeleteCandidate}
          title="Delete Candidate"
          message="Are you sure you want to delete this candidate? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          type="danger"
        />
        
        <ConfirmationDialog
          isOpen={showDeleteAllConfirm}
          onCancel={() => setShowDeleteAllConfirm(false)}
          onConfirm={handleDeleteAll}
          title="Delete All Candidates"
          message="Are you sure you want to delete ALL candidates? This action cannot be undone and will remove all your saved talent."
          confirmLabel="Delete All"
          cancelLabel="Cancel"
          type="danger"
        />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Talent</h1>
            <p className="text-gray-600">Manage your talent pool of candidates</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowManualEntry(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Add Candidate
            </button>
            
            <button
              onClick={() => setShowExcelUploader(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md flex items-center hover:bg-gray-50 transition-colors"
            >
              <FaUpload className="mr-2" />
              Import Excel
            </button>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md flex items-center hover:bg-gray-50 transition-colors"
              disabled={filteredCandidates.length === 0}
            >
              <FaFileExcel className="mr-2" />
              Export
            </button>
            
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md flex items-center hover:bg-gray-50 transition-colors"
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={filteredCandidates.length === 0}
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

        {errorMessage && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-6">
            {errorMessage}
          </div>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center p-4 mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}
        
        {/* Candidate Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-800">All Candidates</h2>
          </div>
          
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
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-800 font-medium text-sm">
                                  {candidate.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{candidate.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{candidate.phone || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.slice(0, 3).map((skill, skillIndex) => (
                                <span 
                                  key={skillIndex} 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.length > 3 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  +{candidate.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link href={`/recruiter/my-talent/${candidate.id}`}>
                                <button
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="View Candidate"
                                >
                                  <FaEye size={16} />
                                </button>
                              </Link>
                              <button
                                onClick={() => handleDeleteCandidate(candidate.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Candidate"
                              >
                                <FaTrash size={16} />
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
        
        {/* Manual Entry Modal */}
        {showManualEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div ref={manualEntryModalRef} className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Add New Candidate</h2>
                <button 
                  onClick={() => setShowManualEntry(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="p-6">
                <CandidateForm onSubmit={handleSubmitCandidate} onCancel={() => setShowManualEntry(false)} />
              </div>
            </div>
          </div>
        )}
        
        {/* Excel Uploader Modal */}
        {showExcelUploader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Import Candidates from Excel</h2>
                <button 
                  onClick={() => setShowExcelUploader(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="p-6">
                <ExcelUploader onUpload={handleExcelUpload} />
              </div>
            </div>
          </div>
        )}
        
        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Export Candidates</h2>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="p-6">
                <ExportFilterModal 
                  onExport={handleExportCandidates} 
                  onCancel={() => setShowExportModal(false)}
                  skillOptions={skillOptions}
                  industryOptions={industryOptions}
                  educationOptions={educationOptions}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};

export default RecruiterMyTalent; 