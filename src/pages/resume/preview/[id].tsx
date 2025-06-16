import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaArrowLeft, FaFilePdf, FaFileAlt, FaExternalLinkAlt, FaDownload } from 'react-icons/fa';
import AdminLayout from '@/components/Layout/AdminLayout';

const ResumePreview: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [candidate, setCandidate] = useState<any>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchCandidate = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/candidates/${id}`);
        
        if (!response.ok) {
          console.error('API response error:', response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch candidate (Status: ${response.status})`);
        }
        
        const data = await response.json();
        setCandidate(data);
        
        // Fetch parsed resume data for this candidate
        fetchParsedResume(data.id);
      } catch (error: any) {
        console.error('Error fetching candidate:', error);
        setError(error.message || 'Failed to load candidate details');
        setIsLoading(false);
      }
    };
    
    const fetchParsedResume = async (candidateId: string) => {
      try {
        const response = await fetch(`/api/parsed-resume/${candidateId}`);
        if (response.ok) {
          const data = await response.json();
          setResumeData(data);
        } else {
          console.log('No parsed resume found for this candidate');
        }
      } catch (error) {
        console.error('Error fetching parsed resume:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCandidate();
  }, [id]);

  // Function to download the resume
  const handleDownload = () => {
    if (candidate?.resumeUrl) {
      window.open(`/api/resume/download?url=${encodeURIComponent(candidate.resumeUrl)}`, '_blank');
    }
  };

  // Helper function to render skill categories
  const renderSkillCategory = (title: string, skills: string[], iconColor: string, bgColor: string, textColor: string) => {
    if (!skills || skills.length === 0) return null;
    
    return (
      <div className="mb-6">
        <div className={`flex items-center mb-3 ${textColor}`}>
          <svg className={`w-6 h-6 mr-2 ${iconColor}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 10V3L4 14H11V21L20 10H13Z" fill="currentColor" />
          </svg>
          <h3 className="text-lg font-medium">{title} <span className="text-gray-500 text-sm ml-1">({skills.length})</span></h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span key={index} className={`px-3 py-1.5 ${bgColor} ${textColor} rounded-full text-sm`}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Function to render the parsed resume skills
  const renderParsedResumeSkills = (parsedData: any) => {
    if (!parsedData) return null;
    
    // Check for skill object first (new format)
    const hasSkillObject = parsedData.skill && typeof parsedData.skill === 'object';
    
    // Check for all possible skill arrays
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
      <div className="space-y-4">
        {renderSkillCategory("Technical Skills", technicalSkills, "text-blue-500", "bg-blue-100", "text-blue-800")}
        {renderSkillCategory("Soft Skills", softSkills, "text-green-500", "bg-green-100", "text-green-800")}
        {renderSkillCategory("Tools", tools, "text-amber-500", "bg-amber-100", "text-amber-800")}
        {renderSkillCategory("Languages", languageSkills, "text-purple-500", "bg-purple-100", "text-purple-800")}
        {renderSkillCategory("Other Skills", generalSkills, "text-gray-500", "bg-gray-100", "text-gray-800")}
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 border-r-2 border-b-2 border-gray-200"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading resume preview...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !candidate) {
  return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="mb-4">{error || "Couldn't load the candidate's resume"}</p>
            <div className="mt-4">
              <Link href="/admin/my-talent" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                <FaArrowLeft className="mr-2" />
                Back to My Talent
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with navigation and actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Link 
              href={`/admin/candidates/${id}`} 
              className="text-blue-600 hover:text-blue-800 flex items-center mr-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Candidate
            </Link>
            <h1 className="text-2xl font-bold">{candidate.name}'s Resume</h1>
          </div>
          <div className="flex space-x-3">
            {candidate.resumeUrl && (
              <>
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center hover:bg-indigo-700 transition-colors"
                >
                  <FaExternalLinkAlt className="mr-2" />
                  Open in New Tab
                </a>
            <button
              onClick={handleDownload}
                  className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center hover:bg-green-700 transition-colors"
            >
                  <FaDownload className="mr-2" />
                  Download
            </button>
              </>
            )}
          </div>
        </div>

      {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar with candidate info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
                <h2 className="text-2xl font-bold text-white">{candidate.name}</h2>
                {resumeData && resumeData.parsedData && (
                  <p className="text-blue-100">
                    {((resumeData.parsedData as any).highlights?.career_level || (resumeData.parsedData as any).title || "Candidate")}
                  </p>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h3>
                <div className="space-y-4">
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">GITHUB</p>
                        <a 
                          href={candidate.githubUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          {candidate.githubUrl.replace('https://github.com/', '')}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn URL */}
                  {candidate.linkedinUrl && (
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
          </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">LINKEDIN</p>
                        <a 
                          href={candidate.linkedinUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          {candidate.linkedinUrl.replace('https://www.linkedin.com/in/', '').replace('https://linkedin.com/in/', '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Skills section in sidebar */}
              {resumeData && (
                <div className="border-t border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Skills</h3>
                  {renderParsedResumeSkills(resumeData.parsedData || {})}
                </div>
              )}
            </div>
          </div>
          
          {/* Main resume content area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Resume header */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaFileAlt className="mr-3 text-indigo-600" size={20} />
                  Resume Preview
                </h3>
              </div>
              
              {/* Resume content */}
              <div className="p-0 overflow-hidden">
                {candidate.resumeUrl ? (
                  <div className="h-[calc(100vh-250px)] w-full">
                    <iframe 
                      src={candidate.resumeUrl} 
                      className="w-full h-full border-0" 
                      title={`${candidate.name}'s Resume`}
                    />
                  </div>
                ) : resumeData ? (
                  <div className="p-6 space-y-6">
                    {/* Personal Info - already shown in sidebar */}
                    
                    {/* Summary section if available */}
                    {resumeData.parsedData && resumeData.parsedData.summary && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Summary</h3>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                          <p className="text-gray-700 italic leading-relaxed">
                            {typeof resumeData.parsedData.summary === 'object' 
                              ? JSON.stringify(resumeData.parsedData.summary) 
                              : resumeData.parsedData.summary}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Experience */}
                    {resumeData.parsedData && resumeData.parsedData.experience && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Experience</h3>
                        <div className="space-y-4">
                          {Array.isArray(resumeData.parsedData.experience) && resumeData.parsedData.experience.map((exp: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <div className="flex justify-between items-start flex-wrap">
                                <div>
                                  <h4 className="font-semibold text-gray-800">{exp.position || exp.title}</h4>
                                  <p className="text-blue-600">{exp.company}</p>
                                </div>
                                <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm mt-1 md:mt-0">
                                  {exp.date || exp.startDate || ''}
                                  {exp.endDate && ` - ${exp.endDate}`}
                                </div>
                              </div>
                              {exp.description && (
                                <p className="mt-3 text-gray-600 whitespace-pre-line">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Education */}
                    {resumeData.parsedData && resumeData.parsedData.education && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Education</h3>
                        <div className="space-y-4">
                          {Array.isArray(resumeData.parsedData.education) && resumeData.parsedData.education.map((edu: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <div className="flex justify-between items-start flex-wrap">
                                <div>
                                  <h4 className="font-semibold text-gray-800">{edu.degree}</h4>
                                  <p className="text-indigo-600">{edu.institution}</p>
                                </div>
                                <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-sm mt-1 md:mt-0">
                                  {edu.date || edu.startDate || ''}
                                  {edu.endDate && ` - ${edu.endDate}`}
                                </div>
                              </div>
                              {edu.description && (
                                <p className="mt-3 text-gray-600">{edu.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
          </div>
        ) : (
                  <div className="text-center py-12">
                    <FaFilePdf className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resume available</h3>
                    <p className="text-gray-500">We couldn't find any resume data for this candidate.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
    </AdminLayout>
  );
};

export default ResumePreview; 