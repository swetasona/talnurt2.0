import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaDownload, FaEnvelope, FaGithub, FaLinkedin, FaPhone, FaUserCircle, FaStar, FaRegStar } from 'react-icons/fa';

interface Candidate {
  id: string;
  name: string;
  email: string;
  resumeUrl?: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills: string[];
  savedDate: string;
}

interface CandidatesPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const CandidatesPage: React.FC<CandidatesPageProps> = ({ user }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [allSkills, setAllSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/recruiter/candidates');
        
        if (!response.ok) {
          throw new Error('Failed to fetch candidates');
        }
        
        const data = await response.json();
        setCandidates(data);
        
        // Extract unique skills for filter
        const skills = new Set<string>();
        data.forEach((candidate: Candidate) => {
          candidate.skills.forEach((skill: string) => {
            skills.add(skill);
          });
        });
        
        setAllSkills(Array.from(skills));
      } catch (error) {
        console.error('Error fetching candidates:', error);
        setError('Failed to load candidates. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const removeSavedCandidate = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/recruiter/candidates/${candidateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove candidate');
      }

      // Update local state
      setCandidates(prevCandidates => 
        prevCandidates.filter(candidate => candidate.id !== candidateId)
      );
    } catch (error) {
      console.error('Error removing candidate:', error);
      setError('Failed to remove candidate. Please try again.');
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (!skillFilter) return true;
    return candidate.skills.some(skill => 
      skill.toLowerCase().includes(skillFilter.toLowerCase())
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <RecruiterLayout>
      <Head>
        <title>My Talent | Recruiter Dashboard</title>
      </Head>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">My Talent</h1>
            <p className="text-gray-600">View and manage your saved candidates</p>
          </div>

          <div className="mt-4 md:mt-0 w-full md:w-64">
            <div>
              <label htmlFor="skillFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Skill
              </label>
              <input
                id="skillFilter"
                type="text"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                placeholder="Enter skill..."
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-blue-100 rounded mb-3"></div>
                <div className="h-3 w-24 bg-blue-50 rounded"></div>
              </div>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="bg-gray-50 py-16 px-4 flex flex-col items-center justify-center">
              <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <FaUserCircle className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">No candidates found</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto text-center">
                {skillFilter
                  ? 'No candidates match your current filter. Try a different skill or browse all candidates.'
                  : 'You have not saved any candidates yet. Browse jobs and save candidates that match your requirements.'}
              </p>
              <Link
                href="/recruiter/jobs"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Candidate
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Skills
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Saved On
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            {candidate.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FaEnvelope className="mr-1 h-3 w-3" />
                              <a href={`mailto:${candidate.email}`} className="hover:text-blue-600">
                                {candidate.email}
                              </a>
                            </div>
                            {candidate.phoneNumber && (
                              <div className="flex items-center text-sm text-gray-500">
                                <FaPhone className="mr-1 h-3 w-3" />
                                <a href={`tel:${candidate.phoneNumber}`} className="hover:text-blue-600">
                                  {candidate.phoneNumber}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(candidate.savedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {candidate.resumeUrl && (
                            <a
                              href={candidate.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                              title="Download Resume"
                            >
                              <FaDownload />
                            </a>
                          )}
                          {candidate.linkedinUrl && (
                            <a
                              href={candidate.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                              title="LinkedIn Profile"
                            >
                              <FaLinkedin />
                            </a>
                          )}
                          {candidate.githubUrl && (
                            <a
                              href={candidate.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                              title="GitHub Profile"
                            >
                              <FaGithub />
                            </a>
                          )}
                          <button
                            onClick={() => removeSavedCandidate(candidate.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove from saved"
                          >
                            <FaRegStar />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RecruiterLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || session.user.role !== 'recruiter') {
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
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: session.user.role || 'recruiter',
      },
    },
  };
};

export default CandidatesPage; 