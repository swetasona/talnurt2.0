import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { JobPosting, JobApplication } from '@/types';
import ApplicationForm from '@/components/Public/ApplicationForm';
import ApplyButton from '@/components/Job/ApplyButton';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaBriefcase, FaBuilding } from 'react-icons/fa';
import { useSession, signOut } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

interface JobDetailsProps {
  job: JobPosting;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { id } = context.params || {};
    
    if (!id || typeof id !== 'string') {
      return { notFound: true };
    }
    
    // Fetch job from API
    const isProduction = process.env.NODE_ENV === 'production';
    const protocol = isProduction ? 'https' : 'http';
    const host = isProduction ? (process.env.VERCEL_URL || 'localhost:3000') : 'localhost:3000';
    const res = await fetch(`${protocol}://${host}/api/jobs/${id}`);
    
    if (!res.ok) {
      console.error(`Failed to fetch job with ID ${id}. Status: ${res.status}`);
      return { notFound: true };
    }
    
    const job = await res.json();
    console.log('Fetched job for details page:', job);
    
    return {
      props: {
        job,
      },
    };
  } catch (error) {
    console.error('Error in job details getServerSideProps:', error);
    return { notFound: true };
  }
};

const JobDetailsPage: React.FC<JobDetailsProps> = ({ job }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Format salary with currency symbol
  let formattedSalary = "Salary Undisclosed";
  if (job.salary) {
    // Get currency code
    const currencyCode = 
      job.currency === "USD" ? "USD" : 
      job.currency === "CAD" ? "CAD" : 
      job.currency === "AUD" ? "AUD" : 
      job.currency || "USD";
    
    // Check if salary is a range
    let salaryText = "";
    if (typeof job.salary === 'string' && job.salary.includes('-')) {
      // Split by dash and format each part
      const parts = job.salary.split('-').map(part => {
        const trimmed = part.trim();
        // Add comma separators to numbers
        return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      });
      salaryText = `${parts[0]} - ${parts[1]}`;
    } else {
      // Format with comma separators
      salaryText = job.salary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    formattedSalary = `${currencyCode} ${salaryText}`;
  }
  
  // Define job type styling
  let jobTypeStyle = "";
  let jobTypeText = "";
  
  if (job.workMode?.toLowerCase() === "remote") {
    jobTypeStyle = "text-orange-600 bg-orange-50";
    jobTypeText = "Remote";
  } else if (job.workMode?.toLowerCase() === "hybrid") {
    jobTypeStyle = "text-blue-600 bg-blue-50";
    jobTypeText = "Hybrid";
  } else {
    jobTypeStyle = "text-rose-600 bg-rose-50";
    jobTypeText = "On-site";
  }
  
  const handleApplicationSubmit = async (application: JobApplication) => {
    setIsSubmitting(true);
    
    try {
      // Submit application to API
      const res = await fetch('/api/job-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(application),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Failed to submit application. Status: ${res.status}, Error: ${errorText}`);
        throw new Error('Failed to submit application');
      }
      
      // Show success message
      setShowSuccess(true);
      
      // After showing success message, redirect back to job listings
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full text-center p-8">
          <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Application Submitted!</h2>
          <p className="text-gray-600 mb-8">
            Thank you for your interest in the {job.title} position. We will review your application and get back to you soon.
          </p>
          <Link href="/" className="inline-block bg-gradient-to-r from-primary to-indigo-600 text-white py-3 px-6 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            Back to Job Listings
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 w-full overflow-hidden">
      <Head>
        <title>{job.title} | Talnurt</title>
        <meta name="description" content={`Apply for the ${job.title} position at ${job.company}. ${job.description?.substring(0, 150)}...`} />
      </Head>
      <Navbar />
      
      <div className="py-14 sm:py-18 md:py-20 bg-gradient-to-r from-primary to-indigo-600 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>
        
        <div className="relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <Link href="/jobs" className="inline-flex items-center text-white/90 hover:text-white mb-6 group">
            <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
            Back to Job Listings
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                <div className="flex items-center">
                  <FaBuilding className="mr-2" />
                  <span>{job.company || "Company"}</span>
                </div>
                <span className="text-white/60">•</span>
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{job.location}</span>
                </div>
                <span className="text-white/60">•</span>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  <span>Posted {new Date(job.postedDate).toISOString().split('T')[0].replace(/-/g, '/')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <span className={`${jobTypeStyle} px-4 py-1.5 rounded-full font-medium text-sm`}>
                {jobTypeText}
              </span>
              
              {new Date().getTime() - new Date(job.postedDate).getTime() < 7 * 24 * 60 * 60 * 1000 && (
                <span className="bg-green-600/20 text-green-200 px-4 py-1.5 rounded-full font-medium text-sm">
                  New
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 border border-gray-100/80 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Overview</h2>
                  <p className="text-gray-500">All the essential information about this position</p>
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaBriefcase className="text-primary text-2xl" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <FaDollarSign className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Salary Range</h3>
                    <p className="text-gray-900 font-semibold">{formattedSalary}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <FaMapMarkerAlt className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                    <p className="text-gray-900 font-semibold">{job.location}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Work Type</h3>
                    <p className="text-gray-900 font-semibold">{jobTypeText}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <FaCalendarAlt className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Posted Date</h3>
                    <p className="text-gray-900 font-semibold">{new Date(job.postedDate).toISOString().split('T')[0].replace(/-/g, '/')}</p>
                  </div>
                </div>

                {job.applicationUrl && (
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Company Website</h3>
                      <a 
                        href={job.applicationUrl.startsWith('http') ? job.applicationUrl : `https://${job.applicationUrl}`} 
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-primary font-semibold hover:underline"
                      >
                        Visit Website
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-blue-100 text-primary p-1.5 rounded-lg mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  Job Description
                </h3>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</div>
              </div>
              
              {job.summary && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Job Summary
                  </h3>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed">{job.summary}</div>
                </div>
              )}
              
              {job.responsibilities && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </span>
                    Responsibilities
                  </h3>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed">{job.responsibilities}</div>
                </div>
              )}
              
              {job.skills && job.skills.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-sky-100 text-sky-600 p-1.5 rounded-lg mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </span>
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {job.benefits && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </span>
                    Benefits
                  </h3>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed">{job.benefits}</div>
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-green-100 text-green-600 p-1.5 rounded-lg mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </span>
                  Requirements
                </h3>
                <ul className="space-y-3">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-center sm:justify-start">
                <Link href="/jobs" className="px-6 py-3 bg-white border border-gray-200 rounded-full text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center">
                  <FaArrowLeft className="mr-2" /> 
                  Back to Job Listings
                </Link>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 border border-gray-100/80 hover:shadow-lg transition-all duration-300 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Apply for this Position</h3>
              
              {status === 'authenticated' ? (
                <div className="space-y-6">
                  {/* Show different content based on user role */}
                  {session?.user?.role === 'recruiter' || session?.user?.role === 'admin' || session?.user?.role === 'superadmin' || session?.user?.role === 'super_admin' ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-amber-800">
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Recruiters Cannot Apply</span>
                      </div>
                      <p className="text-sm">As a {session?.user?.role}, you cannot apply for jobs. Please use an applicant account if you wish to apply for positions.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800">
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Apply with your profile</span>
                        </div>
                        <p className="text-sm">Click the button below to apply with your existing profile information.</p>
                      </div>
                      
                      <ApplyButton jobId={job.id} jobStatus={job.status} />
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800">
                    <div className="flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Registration Required</span>
                    </div>
                    <p className="text-sm">You must be registered and signed in to apply for this job. This helps us maintain quality applications and connect you with employers.</p>
                    <p className="text-sm mt-2 text-blue-600">Note: Only applicant accounts can apply for jobs. Recruiters and administrators should use the platform to post and manage jobs.</p>
                  </div>
                  
                  <div className="flex justify-center mb-4">
                    <div className="flex gap-3 flex-col sm:flex-row">
                      <Link 
                        href={`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}&role=applicant`} 
                        className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign in as Applicant
                      </Link>
                      <Link 
                        href={`/auth/signup?callbackUrl=${encodeURIComponent(router.asPath)}&role=applicant`} 
                        className="w-full bg-white border border-primary text-primary py-3 px-4 rounded-lg text-sm font-medium hover:bg-primary/5 transition-all duration-300 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Register as Applicant
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default JobDetailsPage; 