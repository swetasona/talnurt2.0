import React, { useState } from 'react';
import SkillBadge from './shared/SkillBadge';

const EnhancedResumeParserResult = ({ parserResult }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedExp, setExpandedExp] = useState(null);
  const [expandedEdu, setExpandedEdu] = useState(null);
  const [expandedSkills, setExpandedSkills] = useState(null);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);

  if (!parserResult || !parserResult.success) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
        <h3 className="font-bold">Error Parsing Resume</h3>
        <p>{parserResult?.error || 'Unknown error occurred'}</p>
        {parserResult?.details && <p className="text-sm mt-2">{parserResult.details}</p>}
      </div>
    );
  }

  const { 
    name, email, phone, linkedin, github, website,
    summary, education, experience, 
    highlights, organizations, locations,
    certifications, projects, publications, awards, interests
  } = parserResult;

  // Extract skills - handle both nested and flat structures
  let technical_skills = [], soft_skills = [], language_skills = [], tools = [], skills = [];
  
  // Check if skills are in the nested structure
  if (parserResult.skills && typeof parserResult.skills === 'object' && !Array.isArray(parserResult.skills)) {
    // Nested structure (e.g., from deepseek_resume_parser.py)
    technical_skills = parserResult.skills.technical_skills || [];
    soft_skills = parserResult.skills.soft_skills || [];
    tools = parserResult.skills.tools || [];
    // Other uncategorized skills
    skills = Array.isArray(parserResult.skills.skills) ? parserResult.skills.skills : [];
  } else {
    // Flat structure (backward compatibility)
    technical_skills = parserResult.technical_skills || [];
    soft_skills = parserResult.soft_skills || [];
    language_skills = parserResult.language_skills || [];
    tools = parserResult.tools || [];
    skills = Array.isArray(parserResult.skills) ? parserResult.skills : [];
  }

  // Combine all skills for the skills cloud
  const allSkills = [
    ...technical_skills.map(skill => ({ skill, category: 'technical' })),
    ...soft_skills.map(skill => ({ skill, category: 'soft' })),
    ...language_skills.map(skill => ({ skill, category: 'languages' })),
    ...tools.map(skill => ({ skill, category: 'tools' })),
    ...skills.map(skill => ({ skill, category: 'uncategorized' }))
  ];

  const toggleExpSkills = (index) => {
    if (expandedSkills === index) {
      setExpandedSkills(null);
    } else {
      setExpandedSkills(index);
    }
  };

  const toggleExpExp = (index) => {
    if (expandedExp === index) {
      setExpandedExp(null);
    } else {
      setExpandedExp(index);
    }
  };

  const toggleExpEdu = (index) => {
    if (expandedEdu === index) {
      setExpandedEdu(null);
    } else {
      setExpandedEdu(index);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">Parsed Resume Data</h2>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex flex-wrap -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'experience'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Experience
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'education'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Education
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'skills'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Skills
          </button>
          {(projects || certifications || publications || awards) && (
            <button
              onClick={() => setActiveTab('extras')}
              className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === 'extras'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Additional Info
            </button>
          )}
        </nav>
      </div>
      
      {/* Content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Personal Information */}
              <div className="col-span-1 md:col-span-2">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 border-b pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-gray-600 font-medium">Name:</span> 
                      <span className="ml-2">{name || 'Not detected'}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-gray-600 font-medium">Email:</span> 
                      <span className="ml-2">{email || 'Not detected'}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-gray-600 font-medium">Phone:</span> 
                      <span className="ml-2">{phone || 'Not detected'}</span>
                    </div>
                    {linkedin && (
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600 font-medium">LinkedIn:</span> 
                        <a href={`https://${linkedin}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">{linkedin}</a>
                      </div>
                    )}
                    {github && (
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600 font-medium">GitHub:</span> 
                        <a href={`https://${github}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">{github}</a>
                      </div>
                    )}
                    {website && (
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600 font-medium">Website:</span> 
                        <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">{website}</a>
                      </div>
                    )}
                  </div>
                </div>
              
                {/* Summary */}
                {summary && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 border-b pb-2">Professional Summary</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="whitespace-pre-line">{summary}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profile Summary */}
              <div className="col-span-1">
                <div className="border rounded-lg p-4 bg-blue-50 h-full">
                  <h3 className="text-lg font-semibold mb-3 border-b border-blue-200 pb-2">Profile Highlights</h3>
                  <ul className="space-y-3">
                    {highlights?.years_experience > 0 && (
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span><strong>{highlights.years_experience}+ years</strong> of experience</span>
                      </li>
                    )}
                    {highlights?.highest_education && (
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                        <span><strong>{highlights.highest_education.charAt(0).toUpperCase() + highlights.highest_education.slice(1)}</strong> degree</span>
                      </li>
                    )}
                    {highlights?.career_level && (
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span><strong>{highlights.career_level.charAt(0).toUpperCase() + highlights.career_level.slice(1)}</strong> professional</span>
                      </li>
                    )}
                    {highlights?.leadership_experience && (
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Has <strong>leadership experience</strong></span>
                      </li>
                    )}
                    {highlights?.industries && highlights.industries.length > 0 && (
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span><strong>Industries:</strong> {highlights.industries.slice(0, 3).join(", ")}</span>
                      </li>
                    )}
                  </ul>
                  
                  {/* Top Skills */}
                  {technical_skills && technical_skills.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm text-gray-600 mb-2">Top Technical Skills:</h4>
                      <div>
                        {technical_skills.slice(0, 5).map((skill, index) => (
                          <SkillBadge key={index} skill={skill} category="technical" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sections Overview */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold border-b pb-1 mb-2">Experience</h3>
                <p className="text-2xl font-bold text-gray-700">{experience ? experience.length : 0} <span className="text-sm font-normal">entries</span></p>
                {experience && experience.length > 0 && (
                  <button 
                    onClick={() => setActiveTab('experience')}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    View details
                  </button>
                )}
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold border-b pb-1 mb-2">Education</h3>
                <p className="text-2xl font-bold text-gray-700">{education ? education.length : 0} <span className="text-sm font-normal">entries</span></p>
                {education && education.length > 0 && (
                  <button 
                    onClick={() => setActiveTab('education')}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    View details
                  </button>
                )}
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold border-b pb-1 mb-2">Skills</h3>
                <p className="text-2xl font-bold text-gray-700">{allSkills.length} <span className="text-sm font-normal">total</span></p>
                {allSkills.length > 0 && (
                  <button 
                    onClick={() => setActiveTab('skills')}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    View skill details
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'experience' && (
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Work Experience</h3>
            {experience && experience.length > 0 ? (
              <div className="space-y-4">
                {experience.map((exp, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-4 cursor-pointer flex justify-between items-center"
                      onClick={() => toggleExpExp(index)}
                    >
                      <div>
                        <h4 className="font-semibold">{exp.position || exp.company || 'Unnamed Position'}</h4>
                        {exp.company && exp.position && <p className="text-gray-600 mt-1">{exp.company}</p>}
                        {exp.date && <p className="text-gray-500 text-sm mt-1">{exp.date}</p>}
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transform ${expandedExp === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {expandedExp === index && (
                      <div className="p-4 border-t">
                        {exp.description && (
                          <div className="mb-3">
                            <p className="whitespace-pre-line">{exp.description}</p>
                          </div>
                        )}
                        
                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-700 mb-1">Responsibilities:</h5>
                            <ul className="list-disc pl-5 space-y-1">
                              {exp.responsibilities.map((item, i) => (
                                <li key={i} className="text-gray-700">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {exp.achievements && exp.achievements.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Achievements:</h5>
                            <ul className="list-disc pl-5 space-y-1">
                              {exp.achievements.map((item, i) => (
                                <li key={i} className="text-gray-700">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No work experience detected</p>
            )}
          </div>
        )}
        
        {activeTab === 'education' && (
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Education History</h3>
            {education && education.length > 0 ? (
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-4 cursor-pointer flex justify-between items-center"
                      onClick={() => toggleExpEdu(index)}
                    >
                      <div>
                        <h4 className="font-semibold">{edu.degree || 'Unnamed Degree'}</h4>
                        {edu.institution && <p className="text-gray-600 mt-1">{edu.institution}</p>}
                        {edu.date && <p className="text-gray-500 text-sm mt-1">{edu.date}</p>}
                      </div>
                      <svg className={`w-5 h-5 text-gray-500 transform ${expandedEdu === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {expandedEdu === index && (
                      <div className="p-4 border-t">
                        {edu.description && (
                          <div className="mb-3">
                            <p className="whitespace-pre-line">{edu.description}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No education history detected</p>
            )}
          </div>
        )}
        
        {activeTab === 'skills' && (
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Skills Analysis</h3>

            <div className="space-y-4">
              {/* Technical Skills Card */}
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleExpSkills(0)}
                >
                  <div className="flex items-center">
                    <div className="bg-blue-200 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-800">Technical Skills</h4>
                      <p className="text-gray-600 text-sm">{technical_skills?.length || 0} skills detected</p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-500 transform ${expandedSkills === 0 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {expandedSkills === 0 && (
                  <div className="p-4 border-t bg-white">
                    <div className="flex flex-wrap">
                      {technical_skills && technical_skills.length > 0 ? (
                        technical_skills.map((skill, index) => (
                          <SkillBadge key={index} skill={skill} category="technical" />
                        ))
                      ) : (
                        <p className="text-gray-500 italic">No technical skills detected</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Soft Skills Card */}
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-50 to-green-100 p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleExpSkills(1)}
                >
                  <div className="flex items-center">
                    <div className="bg-green-200 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-800">Soft Skills</h4>
                      <p className="text-gray-600 text-sm">{soft_skills?.length || 0} skills detected</p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-500 transform ${expandedSkills === 1 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {expandedSkills === 1 && (
                  <div className="p-4 border-t bg-white">
                    <div className="flex flex-wrap">
                      {soft_skills && soft_skills.length > 0 ? (
                        soft_skills.map((skill, index) => (
                          <SkillBadge key={index} skill={skill} category="soft" />
                        ))
                      ) : (
                        <p className="text-gray-500 italic">No soft skills detected</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tools Card */}
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleExpSkills(2)}
                >
                  <div className="flex items-center">
                    <div className="bg-yellow-200 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800">Tools</h4>
                      <p className="text-gray-600 text-sm">{tools?.length || 0} tools detected</p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-500 transform ${expandedSkills === 2 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {expandedSkills === 2 && (
                  <div className="p-4 border-t bg-white">
                    <div className="flex flex-wrap">
                      {tools && tools.length > 0 ? (
                        tools.map((skill, index) => (
                          <SkillBadge key={index} skill={skill} category="tools" />
                        ))
                      ) : (
                        <p className="text-gray-500 italic">No tools detected</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Languages Card */}
              {language_skills && language_skills.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 cursor-pointer flex justify-between items-center"
                    onClick={() => toggleExpSkills(3)}
                  >
                    <div className="flex items-center">
                      <div className="bg-purple-200 p-2 rounded-full mr-3">
                        <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-800">Languages</h4>
                        <p className="text-gray-600 text-sm">{language_skills?.length || 0} languages detected</p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-500 transform ${expandedSkills === 3 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {expandedSkills === 3 && (
                    <div className="p-4 border-t bg-white">
                      <div className="flex flex-wrap">
                        {language_skills.map((skill, index) => (
                          <SkillBadge key={index} skill={skill} category="languages" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Other Skills Card */}
              {skills && skills.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 cursor-pointer flex justify-between items-center"
                    onClick={() => toggleExpSkills(4)}
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-200 p-2 rounded-full mr-3">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Other Skills</h4>
                        <p className="text-gray-600 text-sm">{skills?.length || 0} skills detected</p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-500 transform ${expandedSkills === 4 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {expandedSkills === 4 && (
                    <div className="p-4 border-t bg-white">
                      <div className="flex flex-wrap">
                        {skills.map((skill, index) => (
                          <SkillBadge key={index} skill={skill} category="uncategorized" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Show JSON button (for debugging) */}
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => setIsOutputExpanded(!isOutputExpanded)}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {isOutputExpanded ? 'Hide Raw JSON Data' : 'Show Raw JSON Data'}
                </button>
                {isOutputExpanded && (
                  <div className="mt-2 bg-gray-800 text-gray-200 p-4 rounded overflow-auto max-h-96">
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">Original Skills Structure:</p>
                      <pre className="text-xs">{JSON.stringify(parserResult.skills, null, 2)}</pre>
                    </div>
                    <div className="border-t border-gray-700 pt-3 mt-3">
                      <p className="text-xs text-gray-400 mb-1">Processed Skills Data:</p>
                      <pre className="text-xs">{JSON.stringify({
                        technical_skills,
                        soft_skills,
                        language_skills,
                        tools,
                        skills
                      }, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'extras' && (
          <div>
            {/* Projects */}
            {projects && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Projects</h3>
                <div className="bg-gray-50 p-4 rounded whitespace-pre-line">
                  {typeof projects === 'string' ? projects : (
                    Array.isArray(projects) ? projects.map((project, index) => (
                      <div key={index} className="mb-3">
                        <p>{project}</p>
                      </div>
                    )) : <p>No projects found</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Certifications */}
            {certifications && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Certifications</h3>
                <div className="bg-gray-50 p-4 rounded whitespace-pre-line">
                  {typeof certifications === 'string' ? certifications : (
                    Array.isArray(certifications) ? certifications.map((cert, index) => (
                      <div key={index} className="mb-3">
                        <p>{cert}</p>
                      </div>
                    )) : <p>No certifications found</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Publications */}
            {publications && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Publications</h3>
                <div className="bg-gray-50 p-4 rounded whitespace-pre-line">
                  {typeof publications === 'string' ? publications : (
                    Array.isArray(publications) ? publications.map((pub, index) => (
                      <div key={index} className="mb-3">
                        <p>{pub}</p>
                      </div>
                    )) : <p>No publications found</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Awards */}
            {awards && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Awards & Achievements</h3>
                <div className="bg-gray-50 p-4 rounded whitespace-pre-line">
                  {typeof awards === 'string' ? awards : (
                    Array.isArray(awards) ? awards.map((award, index) => (
                      <div key={index} className="mb-3">
                        <p>{award}</p>
                      </div>
                    )) : <p>No awards found</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Interests */}
            {interests && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Interests</h3>
                <div className="bg-gray-50 p-4 rounded whitespace-pre-line">
                  {typeof interests === 'string' ? interests : (
                    Array.isArray(interests) ? interests.map((interest, index) => (
                      <div key={index} className="mb-3">
                        <p>{interest}</p>
                      </div>
                    )) : <p>No interests found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedResumeParserResult; 