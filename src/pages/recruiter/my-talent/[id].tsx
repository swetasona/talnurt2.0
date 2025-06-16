import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import CandidateForm from '@/components/Talent/CandidateForm';
import { Candidate } from '@/types';
import { FaArrowLeft, FaEdit, FaSave, FaTimes, FaCheck, FaExclamationTriangle, FaEye, FaFilePdf, FaFileAlt, FaTrash, FaGithub, FaLinkedin } from 'react-icons/fa';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';

interface CandidateDetailProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

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

  return {
    props: {
      user: {
        id: session.user.id || '',
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role || 'recruiter',
      },
    },
  };
};

const CandidateDetail: React.FC<CandidateDetailProps> = ({ user }) => {
  const router = useRouter();
  const { id } = router.query;
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchCandidate = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/recruiter/my-talent/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch candidate details');
        }
        
        const data = await response.json();
        setCandidate(data);
      } catch (err) {
        console.error('Error fetching candidate:', err);
        setError('Failed to load candidate details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCandidate();
  }, [id]);
  
  const handleUpdate = async (updatedCandidate: Candidate) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/recruiter/my-talent/${id}`, {
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
      setCandidate(data);
      setIsEditing(false);
      setSuccessMessage('Candidate updated successfully');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating candidate:', err);
      setError('Failed to update candidate. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/recruiter/my-talent/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete candidate');
      }
      
      router.push('/recruiter/my-talent?refresh=true');
    } catch (err) {
      console.error('Error deleting candidate:', err);
      setError('Failed to delete candidate. Please try again later.');
      setIsLoading(false);
    }
  };
  
  const renderSkills = (skills: string[]) => {
    if (!skills || skills.length === 0) return <p className="text-gray-500">No skills listed</p>;
    
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => {
          // Use different color backgrounds for different skills
          const skillColors = [
            { bg: "bg-blue-100", text: "text-blue-800" },
            { bg: "bg-indigo-100", text: "text-indigo-800" },
            { bg: "bg-purple-100", text: "text-purple-800" }
          ];
          const colorIndex = index % skillColors.length;
          
          return (
            <span 
              key={index} 
              className={`${skillColors[colorIndex].bg} ${skillColors[colorIndex].text} px-3 py-1.5 rounded-full text-sm`}
            >
              {skill}
            </span>
          );
        })}
      </div>
    );
  };
  
  const renderExperience = (experience: any[]) => {
    if (!experience || experience.length === 0) return <p className="text-gray-500">No experience listed</p>;
    
    return (
      <div className="space-y-6">
        {experience.map((exp, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-lg text-gray-800">{exp.title}</h4>
                <div className="text-blue-600 font-medium">{exp.company}</div>
              </div>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm mt-1 md:mt-0">
                {exp.start_date ? new Date(exp.start_date).toLocaleDateString() : ''} - {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Present'}
              </div>
            </div>
            
            {exp.description && (
              <div className="mt-3 text-gray-600">
                <p>{exp.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  const renderEducation = (education: any[]) => {
    if (!education || education.length === 0) return <p className="text-gray-500">No education listed</p>;
    
    return (
      <div className="space-y-6">
        {education.map((edu, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-lg text-gray-800">
                  {edu.degree} {edu.field && <span>in {edu.field}</span>}
                </h4>
                <div className="text-indigo-600 font-medium">{edu.institution}</div>
              </div>
              <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm mt-1 md:mt-0">
                {edu.start_date ? new Date(edu.start_date).toLocaleDateString() : ''} - {edu.end_date ? new Date(edu.end_date).toLocaleDateString() : 'Graduated'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <RecruiterLayout>
      <Head>
        <title>
          {isLoading
            ? 'Loading Candidate...'
            : candidate
            ? `${candidate.name} | Recruiter My Talent`
            : 'Candidate Not Found'}
        </title>
      </Head>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/recruiter/my-talent" className="flex items-center text-blue-600 hover:text-blue-800">
            <FaArrowLeft className="mr-2" />
            Back to Candidates
          </Link>
          
          {candidate && !isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 flex items-center text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <FaEdit className="mr-2" />
                Edit
              </button>
              
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="px-4 py-2 flex items-center text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <FaTrash className="mr-2" />
                Delete
              </button>
            </div>
          )}
          
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 flex items-center text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
          )}
        </div>
        
        {/* Delete confirmation dialog */}
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          title="Delete Candidate"
          message="Are you sure you want to delete this candidate? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteDialogOpen(false)}
          type="danger"
        />
        
        {/* Success message */}
        {successMessage && (
          <div className="p-4 rounded-md bg-green-50 text-green-800 border border-green-100">
            {successMessage}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="p-4 rounded-md bg-red-50 text-red-800 border border-red-100 flex items-start">
            <FaExclamationTriangle className="mr-3 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* No candidate found */}
        {!isLoading && !candidate && !error && (
          <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Candidate Not Found</h2>
            <p className="text-gray-600 mb-6">
              The candidate you are looking for does not exist or has been removed.
            </p>
            <Link href="/recruiter/my-talent" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Return to Talent Pool
            </Link>
          </div>
        )}
        
        {/* Candidate details */}
        {!isLoading && candidate && !isEditing && (
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
                <h2 className="text-3xl font-bold text-white mb-1">{candidate.name}</h2>
                <p className="text-blue-100 text-lg">
                  {candidate.skills && candidate.skills.length > 0 ? candidate.skills[0] : "Candidate"}
                </p>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate.email && (
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">EMAIL</p>
                        <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">{candidate.email}</a>
                      </div>
                    </div>
                  )}
                  
                  {candidate.phone && (
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">PHONE</p>
                        <a href={`tel:${candidate.phone}`} className="text-green-600 hover:underline">{candidate.phone}</a>
                      </div>
                    </div>
                  )}
                  
                  {/* GitHub URL */}
                  {candidate.githubUrl && (
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 mr-3">
                        <FaGithub className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">GITHUB</p>
                        <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Profile</a>
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn URL */}
                  {candidate.linkedinUrl && (
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                        <FaLinkedin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">LINKEDIN</p>
                        <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn Profile</a>
                      </div>
                    </div>
                  )}
                  
                  {/* Resume URL */}
                  {candidate.resumeUrl && (
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                        <FaFilePdf className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">RESUME</p>
                        <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">View Resume</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Skills Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Skills
                </h3>
              </div>
              <div className="p-6">
                {renderSkills(candidate.skills || [])}
              </div>
            </div>
            
            {/* Experience */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Work Experience
                </h3>
              </div>
              <div className="p-6">
                {renderExperience(candidate.experience || [])}
              </div>
            </div>
            
            {/* Education */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                  Education
                </h3>
              </div>
              <div className="p-6">
                {renderEducation(candidate.education || [])}
              </div>
            </div>
          </div>
        )}
        
        {/* Edit form */}
        {!isLoading && candidate && isEditing && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Candidate</h2>
            <CandidateForm 
              initialData={candidate}
              onSubmit={handleUpdate}
              isEdit={true}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};

export default CandidateDetail; 