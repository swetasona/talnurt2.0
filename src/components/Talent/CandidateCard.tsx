import React, { useState, useRef, useEffect } from 'react';
import { Candidate } from '@/types';
import CandidateForm from './CandidateForm';
import { FaTrash, FaEdit, FaEye, FaDownload } from 'react-icons/fa';

interface CandidateCardProps {
  candidate: Candidate;
  showScore?: boolean;
  onSelect?: (candidate: Candidate) => void;
  onUpdate?: (updatedCandidate: Candidate) => void;
  onDelete?: (candidateId: string) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ 
  candidate, 
  showScore = false,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  
  const profileModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // For profile modal
      if (showProfile && profileModalRef.current && 
          !profileModalRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      
      // For delete confirmation modal
      if (showDeleteConfirm && deleteModalRef.current && 
          !deleteModalRef.current.contains(event.target as Node)) {
        setShowDeleteConfirm(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile, showDeleteConfirm]);
  
  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProfile(true);
  };
  
  const handleCloseProfile = () => {
    setShowProfile(false);
  };
  
  const handleUpdateCandidate = async (updatedCandidate: Candidate) => {
    try {
      // Call the API to update the candidate
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCandidate),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update candidate');
      }
      
      const data = await response.json();
      
      // Call the onUpdate callback if provided
      if (onUpdate) {
        onUpdate(data);
      }
      
      // Close the profile modal
      setShowProfile(false);
    } catch (error) {
      console.error('Error updating candidate:', error);
      alert('Failed to update candidate information');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };
  
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };
  
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      console.log('Deleting candidate:', candidate.id);
      
      // Make API call to delete the candidate
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Parse the response data
      const data = await response.json();
      console.log('Delete response:', data);
      
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to delete candidate from database');
      }
      
      // Close the confirmation modal
      setShowDeleteConfirm(false);
      
      // If we have a successful response with confirmation of database deletion, show brief confirmation
      if (data.success) {
        alert('Candidate successfully deleted from database');
      }
      
      // Notify the parent component
      if (onDelete) {
        onDelete(candidate.id);
      }
    } catch (error: any) {
      console.error('Error deleting candidate from database:', error);
      alert(`Failed to delete candidate from database: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleViewResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowResumeModal(true);
  };
  
  // Resume modal component
  const ResumeModal = () => {
    if (!showResumeModal) return null;
    
    // Determine file type from URL extension
    const getFileType = (url: string) => {
      if (!url) return 'unknown';
      const extension = url.split('.').pop()?.toLowerCase();
      return extension === 'pdf' ? 'pdf' : 
             extension === 'docx' || extension === 'doc' ? 'docx' : 'unknown';
    };

    const fileType = candidate?.resumeUrl ? getFileType(candidate.resumeUrl) : 'unknown';
    
    return (
      <div 
        className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50"
        onClick={() => setShowResumeModal(false)}
      >
        <div 
          className="bg-white rounded-lg w-full max-w-4xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()} // Prevent clicks on the modal content from closing it
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center">
              <FaEye className="mr-3" size={20} />
              {candidate?.name}'s Resume
            </h2>
            <button
              className="text-white hover:text-gray-200 transition-colors rounded-full hover:bg-white hover:bg-opacity-20 p-1"
              onClick={() => setShowResumeModal(false)}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-0 overflow-y-auto flex-grow">
            {candidate?.resumeUrl ? (
              fileType === 'pdf' ? (
              <iframe 
                  src={`${candidate.resumeUrl}#view=FitH`}
                className="w-full h-full min-h-[70vh]" 
                title={`${candidate.name}'s Resume`}
              />
              ) : fileType === 'docx' ? (
                <div className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[70vh]">
                  <div className="mb-6 text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9h6" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17h6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Word Document Preview</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Word documents cannot be previewed directly in the browser. You can download the document to view its contents.
                  </p>
                  <a 
                    href={candidate.resumeUrl}
                    download
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <FaDownload className="mr-2" size={16} />
                    Download Document
                  </a>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Unsupported file format</h3>
                  <p className="text-gray-500 mb-4">The resume is in a format that cannot be previewed.</p>
                  <a 
                    href={candidate.resumeUrl}
                    download
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <FaDownload className="mr-2" size={16} />
                    Download File
                  </a>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resume available</h3>
                <p className="text-gray-500">This candidate doesn't have a resume uploaded.</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t flex justify-between">
            {candidate?.resumeUrl && (
              <a 
                href={candidate.resumeUrl}
                download
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <FaDownload className="mr-2" size={16} />
                Download
              </a>
            )}
            <button
              onClick={() => setShowResumeModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 p-5 transition-all duration-200 cursor-pointer relative overflow-hidden" 
        onClick={() => onSelect && onSelect(candidate)}
      >
        {/* Status indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#3245df]"></div>
        
        <div className="absolute top-3 right-3 flex gap-1">
          <button 
            className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            onClick={handleViewResume}
            title="View Resume"
          >
            <FaEye size={16} />
          </button>
          <button 
            className="text-gray-400 hover:text-[#3245df] p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            onClick={handleViewProfile}
            title="Edit candidate"
          >
            <FaEdit size={16} />
          </button>
          <button 
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            onClick={handleDeleteClick}
            title="Delete candidate"
          >
            <FaTrash size={16} />
          </button>
        </div>
      
        <div className="flex justify-between items-start mt-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{candidate.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{candidate.email}</p>
            {candidate.phone && <p className="text-gray-500 text-sm">{candidate.phone}</p>}
          </div>
          
          {showScore && candidate.relevancyScore !== undefined && (
            <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-white ${
              candidate.relevancyScore >= 80 ? 'bg-green-600' : 
              candidate.relevancyScore >= 60 ? 'bg-[#3245df]' :
              candidate.relevancyScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {candidate.relevancyScore}%
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills.map((skill, index) => (
              <span 
                key={index} 
                className="bg-blue-50 text-[#3245df] text-xs px-2.5 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length === 0 && (
              <span className="text-sm text-gray-400 italic">No skills listed</span>
            )}
          </div>
        </div>
        
        {candidate.experience && candidate.experience.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Experience</h4>
            <div className="bg-gray-50 p-2.5 rounded border border-gray-100">
              <p className="text-sm font-medium text-gray-800">
                {candidate.experience[0].title}
              </p>
              <p className="text-sm text-gray-600">
                {candidate.experience[0].company}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {candidate.experience[0].startDate} - {candidate.experience[0].endDate || 'Present'}
              </p>
            </div>
          </div>
        )}
        
        {candidate.education && candidate.education.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Education</h4>
            <div className="bg-gray-50 p-2.5 rounded border border-gray-100">
              <p className="text-sm font-medium text-gray-800">
                {candidate.education[0].degree} in {candidate.education[0].field}
              </p>
              <p className="text-sm text-gray-600">
                {candidate.education[0].institution}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {candidate.education[0].startDate} - {candidate.education[0].endDate || 'Graduated'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={profileModalRef}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto shadow-xl"
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-800 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-semibold">Edit Candidate</h2>
              <button
                className="text-white hover:text-gray-200"
                onClick={handleCloseProfile}
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <CandidateForm 
                initialData={candidate}
                onSubmit={handleUpdateCandidate}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={deleteModalRef}
            className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
          >
            <div className="text-center mb-5">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Delete Candidate</h2>
              <p className="text-gray-600">
                Are you sure you want to delete <span className="font-medium">{candidate.name}</span>? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors flex items-center"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Resume Modal */}
      <ResumeModal />
    </>
  );
};

export default CandidateCard; 