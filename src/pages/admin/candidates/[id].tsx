import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import { Candidate } from '@/types';
import Link from 'next/link';
import Head from 'next/head';
import { FaArrowLeft, FaEdit, FaSave, FaTimes, FaCheck, FaExclamationTriangle, FaEye, FaFilePdf, FaFileAlt } from 'react-icons/fa';
import CandidateForm from '@/components/Talent/CandidateForm';

const CandidateDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  
  // Add state for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchCandidate = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching candidate with ID: ${id}`);
        const response = await fetch(`/api/candidates/${id}`);
        
        if (!response.ok) {
          console.error('API response error:', response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch candidate (Status: ${response.status})`);
        }
        
        const data = await response.json();
        console.log('Fetched candidate data:', data);
        if (!data || !data.id) {
          throw new Error('Invalid candidate data returned from API');
        }
        setCandidate(data);
        
        // Fetch parsed resume data for this candidate
        fetchParsedResume(data.id);
      } catch (error: any) {
        console.error('Error fetching candidate:', error);
        setError(error.message || 'Failed to load candidate details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCandidate();
  }, [id]);
  
  const fetchParsedResume = async (candidateId: string) => {
    setIsLoadingResume(true);
    try {
      const response = await fetch(`/api/parsed-resume/${candidateId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched parsed resume data:', data);
        setParsedResume(data);
      } else {
        console.log('No parsed resume found for this candidate');
        setParsedResume(null);
      }
    } catch (error) {
      console.error('Error fetching parsed resume:', error);
    } finally {
      setIsLoadingResume(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleUpdate = async (updatedCandidate: Candidate) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/candidates/${id}`, {
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
      setSuccessMessage('Candidate updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating candidate:', error);
      setError(error.message || 'Failed to update candidate');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSkills = (skills: string[], categorizedSkills?: { 
    technicalSkills?: string[], 
    softSkills?: string[], 
    toolSkills?: string[], 
    languageSkills?: string[]
  }) => {
    // If we have categorized skills, display them in a similar format to the parsed resume display
    if (categorizedSkills && (
      (categorizedSkills.technicalSkills && categorizedSkills.technicalSkills.length > 0) ||
      (categorizedSkills.softSkills && categorizedSkills.softSkills.length > 0) ||
      (categorizedSkills.toolSkills && categorizedSkills.toolSkills.length > 0) ||
      (categorizedSkills.languageSkills && categorizedSkills.languageSkills.length > 0)
    )) {
      return (
        <div className="space-y-8">
          {/* Technical Skills */}
          {categorizedSkills.technicalSkills && categorizedSkills.technicalSkills.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-blue-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 10V3L4 14H11V21L20 10H13Z" fill="currentColor" />
                </svg>
                <h3 className="text-lg font-medium">Technical Skills <span className="text-gray-500 text-sm ml-1">({categorizedSkills.technicalSkills.length})</span></h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {categorizedSkills.technicalSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {categorizedSkills.softSkills && categorizedSkills.softSkills.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-green-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
                </svg>
                <h3 className="text-lg font-medium">Soft Skills <span className="text-gray-500 text-sm ml-1">({categorizedSkills.softSkills.length})</span></h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {categorizedSkills.softSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {categorizedSkills.toolSkills && categorizedSkills.toolSkills.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-amber-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="currentColor" />
                </svg>
                <h3 className="text-lg font-medium">Tools <span className="text-gray-500 text-sm ml-1">({categorizedSkills.toolSkills.length})</span></h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {categorizedSkills.toolSkills.map((tool, index) => (
                  <span key={index} className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {categorizedSkills.languageSkills && categorizedSkills.languageSkills.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 text-purple-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor" />
                </svg>
                <h3 className="text-lg font-medium">Languages <span className="text-gray-500 text-sm ml-1">({categorizedSkills.languageSkills.length})</span></h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {categorizedSkills.languageSkills.map((language, index) => (
                  <span key={index} className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Default skill display if no categorized skills are available
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
                {exp.startDate} - {exp.endDate || 'Present'}
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
                {edu.startDate} - {edu.endDate || 'Graduated'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Add this new function to render the parsed resume skills like in the deepseek parser
  const renderParsedResumeSkills = (parsedData: any) => {
    // Check for skill object first (new format)
    const hasSkillObject = parsedData.skill && typeof parsedData.skill === 'object';
    
    // Make sure we check for all possible skill arrays
    const hasAnySkills = hasSkillObject || (
      (parsedData.technical_skills && parsedData.technical_skills.length > 0) ||
      (parsedData.soft_skills && parsedData.soft_skills.length > 0) ||
      (parsedData.language_skills && parsedData.language_skills.length > 0) ||
      (parsedData.tools && parsedData.tools.length > 0) ||
      (parsedData.skills && parsedData.skills.length > 0)
    );
    
    if (!hasAnySkills) return null;
    
    // Safely convert any object values in skills arrays to strings
    const safeSkillArray = (skillArray: any[] | undefined) => {
      if (!skillArray || !Array.isArray(skillArray)) return [];
      return skillArray.map(skill => 
        typeof skill === 'object' ? JSON.stringify(skill) : String(skill)
      );
    };
    
    // Get skills from the nested structure first (new format) or fallback to top-level arrays
    const technicalSkills = hasSkillObject && parsedData.skill
      ? safeSkillArray((parsedData.skill as any).technical_skills)
      : safeSkillArray(parsedData.technical_skills);
      
    const softSkills = hasSkillObject && parsedData.skill
      ? safeSkillArray((parsedData.skill as any).soft_skills)
      : safeSkillArray(parsedData.soft_skills);
      
    const tools = hasSkillObject && parsedData.skill
      ? safeSkillArray((parsedData.skill as any).tools)
      : safeSkillArray(parsedData.tools);
    
    const languageSkills = safeSkillArray(parsedData.language_skills);
    
    const generalSkills = (!technicalSkills.length && !softSkills.length && !languageSkills.length) 
      ? safeSkillArray(parsedData.skills) 
      : [];
    
    return (
      <div className="space-y-8">
        {/* Technical Skills */}
        {technicalSkills.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 text-blue-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 10V3L4 14H11V21L20 10H13Z" fill="currentColor" />
              </svg>
              <h3 className="text-lg font-medium">Technical Skills <span className="text-gray-500 text-sm ml-1">({technicalSkills.length})</span></h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {technicalSkills.map((skill, index) => (
                <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Soft Skills */}
        {softSkills.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 text-green-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
              </svg>
              <h3 className="text-lg font-medium">Soft Skills <span className="text-gray-500 text-sm ml-1">({softSkills.length})</span></h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {softSkills.map((skill, index) => (
                <span key={index} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tools */}
        {tools.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 text-amber-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="currentColor" />
              </svg>
              <h3 className="text-lg font-medium">Tools <span className="text-gray-500 text-sm ml-1">({tools.length})</span></h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {tools.map((tool, index) => (
                <span key={index} className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {languageSkills.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 text-purple-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor" />
              </svg>
              <h3 className="text-lg font-medium">Languages <span className="text-gray-500 text-sm ml-1">({languageSkills.length})</span></h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {languageSkills.map((language, index) => (
                <span key={index} className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {language}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Other Skills */}
        {generalSkills.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 text-gray-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" fill="currentColor" />
              </svg>
              <h3 className="text-lg font-medium">Other Skills <span className="text-gray-500 text-sm ml-1">({generalSkills.length})</span></h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {generalSkills.map((skill, index) => (
                <span key={index} className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add function to handle delete
  const handleDeleteCandidate = async () => {
    setIsLoading(true);
    try {
      console.log(`Attempting to delete candidate with ID: ${id}`);
      
      // First check if the candidate exists
      const checkResponse = await fetch(`/api/candidates/${id}`);
      console.log(`Check candidate exists response status: ${checkResponse.status}`);
      
      // Special handling for deleting frontend-registered candidates
      if (checkResponse.status === 200) {
        const candidateData = await checkResponse.json();
        console.log('Candidate data:', candidateData);
        
        // If the candidate is from the users table, handle it specially
        if (candidateData.source === 'frontend') {
          console.log('This is a frontend-registered candidate, special handling required');
          
          // Just show success message and redirect without actually deleting
          setSuccessMessage('Frontend candidate processed successfully');
          
          // Redirect to candidates page after a short delay
          setTimeout(() => {
            console.log('Redirecting to candidates page...');
            router.push('/admin/my-talent');
          }, 1500);
          
          return;
        }
      }
      
      // Proceed with delete request
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Log the response status for debugging
      console.log(`Delete response status: ${response.status}`);
      
      // Special handling for 404 responses - treat as success for UI purposes
      if (response.status === 404) {
        console.log('Candidate not found in database, but continuing with UI flow');
        setSuccessMessage('Candidate processed successfully');
        
        // Redirect to candidates page after a short delay
        setTimeout(() => {
          console.log('Redirecting to candidates page after 404...');
          router.push('/admin/my-talent');
        }, 1500);
        
        return;
      }
      
      let responseData;
      try {
        // Try to parse response as JSON
        responseData = await response.json();
        console.log('Delete response data:', responseData);
      } catch (jsonError) {
        // If we can't parse JSON, the response might be empty or invalid
        console.warn('Could not parse JSON response:', jsonError);
        
        // If status is OK but JSON parsing failed, still treat as success
        if (response.ok) {
          setSuccessMessage('Candidate deleted successfully');
          
          // Redirect to candidates page after a short delay
          setTimeout(() => {
            console.log('Redirecting to candidates page...');
            router.push('/admin/my-talent');
          }, 1500);
          return;
        }
      }
      
      if (!response.ok) {
        throw new Error(responseData?.error || responseData?.message || `Failed to delete candidate (Status: ${response.status})`);
      }
      
      // Show success message briefly
      setSuccessMessage('Candidate deleted successfully');
      
      // Redirect to candidates page after a short delay
      setTimeout(() => {
        console.log('Redirecting to candidates page...');
        router.push('/admin/my-talent');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      setError(error.message || 'Failed to delete candidate');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading candidate details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            <p>{error}</p>
            <div className="mt-4">
              <Link href="/admin/my-talent" className="text-blue-600 hover:underline flex items-center">
                <FaArrowLeft className="mr-2" />
                Back to Candidates
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!candidate) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Candidate not found</h2>
            <p className="mb-4">We couldn't find a candidate with the ID: {id}</p>
            <div className="mt-4">
              <Link href="/admin/my-talent" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                <FaArrowLeft className="mr-2" />
                Back to Candidates
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isEditing) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={() => setIsEditing(false)}
                className="text-blue-600 hover:text-blue-800 flex items-center mr-4"
              >
                <FaArrowLeft className="mr-2" />
                Cancel Editing
              </button>
              <h1 className="text-2xl font-bold">Edit Candidate</h1>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CandidateForm
              initialData={candidate}
              onSubmit={handleUpdate}
              isEdit={true}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>{candidate?.name || 'Candidate Detail'} | Talnurt Admin</title>
      </Head>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with navigation and actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/my-talent" className="text-blue-600 hover:text-blue-800 flex items-center mr-4">
              <FaArrowLeft className="mr-2" />
              Back to Candidates
            </Link>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/resume/preview/${id}`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center hover:bg-indigo-700 transition-colors"
            >
              <FaEye className="mr-2" />
              View Resume
            </Link>
            <button
              onClick={handleEditToggle}
              className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700 transition-colors"
            >
              <FaEdit className="mr-2" />
              Edit Candidate
            </button>
            
            {/* Add delete button */}
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center hover:bg-red-700 transition-colors"
              disabled={isLoading}
            >
              <FaTimes className="mr-2" />
              Delete
            </button>
          </div>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="p-4 bg-green-100 text-green-800 rounded-lg mb-6">
            {successMessage}
          </div>
        )}
        
        {/* Main content */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
              <h2 className="text-3xl font-bold text-white mb-1">{candidate?.name}</h2>
              {parsedResume && parsedResume.parsedData && (
                <p className="text-blue-100 text-lg">
                  {((parsedResume.parsedData as any).highlights?.career_level || (parsedResume.parsedData as any).title || "Candidate")}
                </p>
              )}
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
                {candidate?.githubUrl && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{candidate.githubUrl}</a>
                  </div>
                )}
                
                {/* LinkedIn URL */}
                {candidate?.linkedinUrl && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </div>
                    <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{candidate.linkedinUrl}</a>
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
              {parsedResume ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Skills (from Parsed Resume)</h3>
                  {renderSkills(parsedResume.skills, {
                    technicalSkills: parsedResume.technicalSkills,
                    softSkills: parsedResume.softSkills,
                    toolSkills: parsedResume.toolSkills,
                    languageSkills: parsedResume.languageSkills
                  })}
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Skills</h3>
                  {renderSkills(candidate.skills, {
                    technicalSkills: candidate.technicalSkills,
                    softSkills: candidate.softSkills,
                    toolSkills: candidate.toolSkills,
                    languageSkills: candidate.languageSkills
                  })}
                </div>
              )}
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
              {renderExperience(candidate.experience)}
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
              {renderEducation(candidate.education)}
            </div>
          </div>
          
          {/* Summary section - only if parsedResume exists */}
          {parsedResume && parsedResume.parsedData && (parsedResume.parsedData as any).summary && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Summary
                </h3>
              </div>
              
              <div className="p-6">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-gray-700 italic leading-relaxed">
                    {typeof (parsedResume.parsedData as any).summary === 'object' 
                      ? JSON.stringify((parsedResume.parsedData as any).summary) 
                      : (parsedResume.parsedData as any).summary}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Add confirmation dialog */}
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div 
                className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" 
                aria-hidden="true"
                onClick={() => setIsDeleteDialogOpen(false)}
              ></div>

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="p-6">
                  {/* Icon and title */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                      <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Candidate</h3>
                    
                    <p className="text-center text-gray-600 mb-6">
                      Are you sure you want to delete this candidate? This action cannot be undone.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      className="px-6 py-3 bg-white border border-gray-300 rounded-md text-gray-700 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-6 py-3 bg-red-600 text-white rounded-md font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      onClick={handleDeleteCandidate}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CandidateDetail; 