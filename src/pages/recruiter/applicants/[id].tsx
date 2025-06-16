import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaArrowLeft, FaExclamationTriangle, FaDownload, FaEnvelope, FaPhone, FaGithub, FaLinkedin, FaGlobe, FaMapMarkerAlt, FaTrash, FaSave, FaCheckCircle } from 'react-icons/fa';

interface ApplicantDetailProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface ApplicantData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  skills: string[];
  resumeUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  experience: any[];
  education: any[];
  applicationDetails: {
    applicationId: string;
    jobId: string;
    jobTitle: string;
    jobCompany: string;
    jobLocation: string;
    status: string;
    appliedDate: string;
  };
  isInTalentPool: boolean;
}

const ApplicantDetailPage: React.FC<ApplicantDetailProps> = ({ user }) => {
  const router = useRouter();
  const { id } = router.query;
  
  const [applicant, setApplicant] = useState<ApplicantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingToTalent, setIsSavingToTalent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchApplicant = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/recruiter/applicants/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch applicant data');
        }
        
        const data = await response.json();
        setApplicant(data);
      } catch (error) {
        console.error('Error fetching applicant:', error);
        setError('Failed to load applicant data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplicant();
  }, [id]);
  
  const handleDelete = async () => {
    if (!applicant) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/recruiter/applicants/${id}?applicationId=${applicant.applicationDetails.applicationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete application');
      }
      
      router.push('/recruiter/applicants');
    } catch (error) {
      console.error('Error deleting application:', error);
      setError('Failed to delete application. Please try again.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleSaveToTalent = async () => {
    if (!applicant) return;
    
    try {
      setIsSavingToTalent(true);
      const response = await fetch(`/api/recruiter/applicants/${id}?action=save-to-talent`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to save to talent pool');
      }
      
      setSaveSuccess(true);
      // Refetch to update isInTalentPool status
      const refreshResponse = await fetch(`/api/recruiter/applicants/${id}`);
      const updatedData = await refreshResponse.json();
      setApplicant(updatedData);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving to talent pool:', error);
      setError('Failed to save to talent pool. Please try again.');
    } finally {
      setIsSavingToTalent(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const renderSkills = (skills: string[]) => {
    if (!skills || skills.length === 0) return <p className="text-gray-500 italic">No skills listed</p>;
    
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span key={index} className="px-2 py-1 bg-[#4154ef]/10 text-[#4154ef] text-sm rounded-full">
            {skill}
          </span>
        ))}
      </div>
    );
  };
  
  const renderExperience = (experience: any[]) => {
    if (!experience || experience.length === 0) return <p className="text-gray-500 italic">No experience listed</p>;
    
    return (
      <div className="space-y-4">
        {experience.map((exp, index) => (
          <div key={index} className="border-l-2 border-gray-200 pl-4">
            <h4 className="font-medium text-gray-900">{exp.title}</h4>
            <p className="text-gray-700">{exp.company}</p>
            <p className="text-sm text-gray-500">
              {exp.startDate && formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
            </p>
            {exp.description && <p className="mt-2 text-gray-600">{exp.description}</p>}
          </div>
        ))}
      </div>
    );
  };
  
  const renderEducation = (education: any[]) => {
    if (!education || education.length === 0) return <p className="text-gray-500 italic">No education listed</p>;
    
    return (
      <div className="space-y-4">
        {education.map((edu, index) => (
          <div key={index} className="border-l-2 border-gray-200 pl-4">
            <h4 className="font-medium text-gray-900">{edu.degree} {edu.field && `in ${edu.field}`}</h4>
            <p className="text-gray-700">{edu.institution}</p>
            {(edu.startDate || edu.endDate) && (
              <p className="text-sm text-gray-500">
                {edu.startDate && formatDate(edu.startDate)} 
                {edu.endDate && ` - ${formatDate(edu.endDate)}`}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'interviewed': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <RecruiterLayout>
        <Head>
          <title>Loading Applicant | Recruiter Dashboard</title>
        </Head>
        <div className="max-w-5xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-100 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-24 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </RecruiterLayout>
    );
  }
  
  if (error) {
    return (
      <RecruiterLayout>
        <Head>
          <title>Error | Recruiter Dashboard</title>
        </Head>
        <div className="max-w-5xl mx-auto p-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Link 
              href="/recruiter/applicants"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#4154ef] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4154ef]"
            >
              <FaArrowLeft className="mr-2" />
              Back to Applicants
            </Link>
          </div>
        </div>
      </RecruiterLayout>
    );
  }
  
  if (!applicant) {
    return (
      <RecruiterLayout>
        <Head>
          <title>Applicant Not Found | Recruiter Dashboard</title>
        </Head>
        <div className="max-w-5xl mx-auto p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Applicant Not Found</h2>
            <p className="text-gray-600 mb-6">The applicant you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link 
              href="/recruiter/applicants"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#4154ef] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4154ef]"
            >
              <FaArrowLeft className="mr-2" />
              Back to Applicants
            </Link>
          </div>
        </div>
      </RecruiterLayout>
    );
  }
  
  return (
    <RecruiterLayout>
      <Head>
        <title>{applicant.name} | Recruiter Dashboard</title>
      </Head>
      
      <div className="max-w-5xl mx-auto p-6">
        {/* Header with navigation and actions */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <Link 
              href="/recruiter/applicants"
              className="flex items-center text-[#4154ef] hover:text-blue-700 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Back to Applicants
            </Link>
            <div className="h-6 w-px bg-gray-300 mx-4"></div>
            <h1 className="text-2xl font-bold text-gray-900">{applicant.name}</h1>
          </div>
          
          <div className="flex space-x-3">
            {!applicant.isInTalentPool ? (
              <button
                onClick={handleSaveToTalent}
                disabled={isSavingToTalent}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4154ef] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSavingToTalent ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save to Talent Pool
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600">
                <FaCheckCircle className="mr-2" />
                In Talent Pool
              </div>
            )}
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FaTrash className="mr-2" />
              Delete Application
            </button>
          </div>
        </div>
        
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaCheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-green-700">Candidate successfully added to your talent pool!</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Application Details Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="bg-[#4154ef] px-6 py-4">
            <h2 className="text-lg font-bold text-white">Application Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Position</h3>
                <p className="text-gray-900">{applicant.applicationDetails.jobTitle}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Company</h3>
                <p className="text-gray-900">{applicant.applicationDetails.jobCompany}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                <p className="text-gray-900">{applicant.applicationDetails.jobLocation}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Applied On</h3>
                <p className="text-gray-900">{formatDate(applicant.applicationDetails.appliedDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(applicant.applicationDetails.status)}`}>
                  {applicant.applicationDetails.status.charAt(0).toUpperCase() + applicant.applicationDetails.status.slice(1)}
                </span>
              </div>
              <div>
                <Link
                  href={`/recruiter/jobs/edit/${applicant.applicationDetails.jobId}`}
                  className="text-[#4154ef] hover:text-blue-700 text-sm font-medium"
                >
                  View Job Posting &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Applicant Info Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="bg-[#4154ef] px-6 py-4">
            <h2 className="text-lg font-bold text-white">Applicant Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                <p className="text-gray-900">{applicant.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <div className="flex items-center">
                  <FaEnvelope className="text-gray-400 mr-2" />
                  <a href={`mailto:${applicant.email}`} className="text-[#4154ef] hover:text-blue-700">
                    {applicant.email}
                  </a>
                </div>
              </div>
              {applicant.phone && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                  <div className="flex items-center">
                    <FaPhone className="text-gray-400 mr-2" />
                    <a href={`tel:${applicant.phone}`} className="text-[#4154ef] hover:text-blue-700">
                      {applicant.phone}
                    </a>
                  </div>
                </div>
              )}
              {applicant.location && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="text-gray-400 mr-2" />
                    <p className="text-gray-900">{applicant.location}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {applicant.resumeUrl && (
                <a
                  href={applicant.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4154ef]"
                >
                  <FaDownload className="mr-2 text-gray-500" />
                  Resume
                </a>
              )}
              {applicant.linkedinUrl && (
                <a
                  href={applicant.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4154ef]"
                >
                  <FaLinkedin className="mr-2 text-blue-600" />
                  LinkedIn
                </a>
              )}
              {applicant.githubUrl && (
                <a
                  href={applicant.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4154ef]"
                >
                  <FaGithub className="mr-2 text-gray-800" />
                  GitHub
                </a>
              )}
              {applicant.website && (
                <a
                  href={applicant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4154ef]"
                >
                  <FaGlobe className="mr-2 text-gray-500" />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Bio Section */}
        {applicant.bio && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="bg-[#4154ef] px-6 py-4">
              <h2 className="text-lg font-bold text-white">Bio</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700">{applicant.bio}</p>
            </div>
          </div>
        )}
        
        {/* Skills Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="bg-[#4154ef] px-6 py-4">
            <h2 className="text-lg font-bold text-white">Skills</h2>
          </div>
          <div className="p-6">
            {renderSkills(applicant.skills)}
          </div>
        </div>
        
        {/* Experience Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="bg-[#4154ef] px-6 py-4">
            <h2 className="text-lg font-bold text-white">Experience</h2>
          </div>
          <div className="p-6">
            {renderExperience(applicant.experience)}
          </div>
        </div>
        
        {/* Education Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-[#4154ef] px-6 py-4">
            <h2 className="text-lg font-bold text-white">Education</h2>
          </div>
          <div className="p-6">
            {renderEducation(applicant.education)}
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <FaExclamationTriangle className="text-red-500 text-xl mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this application? This action cannot be undone.
                {applicant.isInTalentPool && (
                  <span className="block mt-2 text-sm italic">
                    Note: This applicant will still remain in your talent pool.
                  </span>
                )}
              </p>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Application'}
                </button>
              </div>
            </div>
          </div>
        )}
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

export default ApplicantDetailPage; 