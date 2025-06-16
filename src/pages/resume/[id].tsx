import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { FaArrowLeft, FaDownload, FaPrint } from 'react-icons/fa';

interface ResumeData {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  education: {
    degree: string;
    institution: string;
    yearRange: string;
  }[];
  experience: {
    position: string;
    company: string;
    yearRange: string;
    responsibilities: string[];
  }[];
  skills: string[];
  projects: {
    title: string;
    description: string[];
  }[];
}

interface ResumeViewerProps {
  resumeId: string;
  initialData?: ResumeData;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  
  if (!id || typeof id !== 'string') {
    return { notFound: true };
  }
  
  try {
    // Fetch resume content from API
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.VERCEL_URL || 'localhost:3000';
    
    const res = await fetch(`${protocol}://${host}/api/resume/${id}`);
    
    if (!res.ok) {
      throw new Error('Failed to fetch resume');
    }
    
    const data = await res.json();
    
    return {
      props: {
        resumeId: id,
        initialData: data,
      },
    };
  } catch (error) {
    console.error('Error fetching resume:', error);
    
    return {
      props: {
        resumeId: id,
        initialData: null,
      },
    };
  }
};

const ResumeViewer: React.FC<ResumeViewerProps> = ({ resumeId, initialData }) => {
  const router = useRouter();
  const [resumeData, setResumeData] = useState<ResumeData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Print resume
  const handlePrint = () => {
    window.print();
  };
  
  // Download resume as JSON
  const handleDownload = () => {
    if (!resumeData) return;
    
    const jsonString = JSON.stringify(resumeData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${resumeId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load resume data if not provided during SSR
  useEffect(() => {
    if (!initialData) {
      const loadResume = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const res = await fetch(`/api/resume/${resumeId}`);
          
          if (!res.ok) {
            throw new Error('Failed to load resume');
          }
          
          const data = await res.json();
          setResumeData(data);
        } catch (err) {
          console.error('Error loading resume:', err);
          setError('Failed to load resume. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadResume();
    }
  }, [resumeId, initialData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#4154ef]">Resume Viewer</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.back()}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              <FaArrowLeft className="mr-2" /> Back
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-[#4154ef] rounded-md shadow-sm hover:bg-[#3245df]"
              disabled={!resumeData}
            >
              <FaDownload className="mr-2" /> Download
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              <FaPrint className="mr-2" /> Print
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center p-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4154ef]"></div>
            <p className="mt-2 text-gray-600">Loading resume...</p>
          </div>
        ) : error || !resumeData ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <p className="text-red-500">{error || "Failed to load resume"}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#4154ef] rounded-md shadow-sm hover:bg-[#3245df]"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-6 border-b pb-6">
                <h1 className="text-3xl font-bold text-gray-900">{resumeData.name}</h1>
                <div className="mt-2 text-gray-600">
                  <p>{resumeData.email} | {resumeData.phone}</p>
                  <p>{resumeData.location}</p>
                </div>
              </div>
              
              {/* Education */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#4154ef] border-b border-gray-200 pb-2 mb-3">Education</h2>
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                      <span className="text-gray-600">{edu.yearRange}</span>
                    </div>
                    <p className="text-gray-600">{edu.institution}</p>
                  </div>
                ))}
              </div>
              
              {/* Experience */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#4154ef] border-b border-gray-200 pb-2 mb-3">Experience</h2>
                {resumeData.experience.map((exp, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-gray-900">{exp.position}</h3>
                      <span className="text-gray-600">{exp.yearRange}</span>
                    </div>
                    <p className="text-gray-700 mb-2">{exp.company}</p>
                    <ul className="list-disc list-inside text-gray-600">
                      {exp.responsibilities.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              
              {/* Skills */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#4154ef] border-b border-gray-200 pb-2 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="bg-gray-100 px-3 py-1 rounded-full text-gray-700 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Projects */}
              <div>
                <h2 className="text-xl font-semibold text-[#4154ef] border-b border-gray-200 pb-2 mb-3">Projects</h2>
                {resumeData.projects.map((project, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="font-medium text-gray-900">{project.title}</h3>
                    <ul className="list-disc list-inside text-gray-600 mt-1">
                      {project.description.map((desc, i) => (
                        <li key={i}>{desc}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; 2025 Talnurt Recruitment Portal. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            padding: 20px;
            font-size: 12pt;
          }
        }
      `}</style>
    </div>
  );
};

export default ResumeViewer; 