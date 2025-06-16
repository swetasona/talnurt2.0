import React, { useState, useRef, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { JobPosting } from '@/types';
import PublicJobCard from '@/components/Public/PublicJobCard';
import { FaSearch, FaBriefcase, FaMapMarkerAlt, FaBuilding } from 'react-icons/fa';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

interface JobsPageProps {
  jobs: JobPosting[];
  initialSearch?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get search query from URL if present
    const searchQuery = context.query.search as string || '';
    
    // Fetch jobs from API
    const isProduction = process.env.NODE_ENV === 'production';
    const protocol = isProduction ? 'https' : 'http';
    const host = isProduction ? (process.env.VERCEL_URL || 'localhost:3000') : 'localhost:3000';
    const res = await fetch(`${protocol}://${host}/api/jobs`);
    
    if (!res.ok) {
      console.error(`Failed to fetch jobs. Status: ${res.status}`);
      throw new Error('Failed to fetch jobs');
    }
    
    const allJobs = await res.json();
    
    // Filter to show only jobs with 'open' status
    const openJobs = allJobs.filter((job: JobPosting) => job.status?.toLowerCase() === 'open');
    
    console.log(`Fetched ${allJobs.length} jobs, ${openJobs.length} are open for public listing`);
    
    return {
      props: {
        jobs: openJobs,
        initialSearch: searchQuery || '',
      },
    };
  } catch (error) {
    console.error('Error fetching jobs for public page:', error);
    return {
      props: {
        jobs: [],
        initialSearch: '',
      },
    };
  }
};

const JobsPage: React.FC<JobsPageProps> = ({ jobs, initialSearch = '' }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [displayedJobs, setDisplayedJobs] = useState<JobPosting[]>(jobs);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Filter displayed jobs based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setDisplayedJobs(jobs);
    } else {
      const filtered = jobs.filter(job => 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setDisplayedJobs(filtered);
    }
  }, [searchTerm, jobs]);

  // Update dropdown width when search input changes size or dropdown becomes visible
  useEffect(() => {
    const updateDropdownWidth = () => {
      if (inputRef.current) {
        setDropdownWidth(inputRef.current.offsetWidth);
      }
    };
    
    // Update on initial render and when dropdown visibility changes
    updateDropdownWidth();
    
    // Update on window resize
    window.addEventListener('resize', updateDropdownWidth);
    
    return () => {
      window.removeEventListener('resize', updateDropdownWidth);
    };
  }, [showDropdown]);

  // Filter jobs based on search term for dropdown
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredJobs([]);
      setShowDropdown(false);
      return;
    }

    const filtered = jobs.filter(job => 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredJobs(filtered.slice(0, 5)); // Limit to 5 results for dropdown
    setShowDropdown(true);
  }, [searchTerm, jobs]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle initial search from URL parameter
  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
      
      // Update the URL without the search parameter to make it cleaner
      // after the initial load
      const { pathname } = router;
      router.replace(pathname, undefined, { shallow: true });
    }
  }, [initialSearch, router]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredJobs.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      if (filteredJobs[activeIndex]?.id) {
        window.location.href = `/jobs/${filteredJobs[activeIndex].id}`;
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 w-full overflow-hidden">
      <Head>
        <title>Jobs | Talnurt</title>
        <meta name="description" content="Browse jobs on Talnurt Recruitment Portal." />
      </Head>
      <Navbar />
      
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-blue-100 transform -skew-y-6 origin-top-right -translate-y-32 z-0"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="max-w-lg">
              <div className="inline-block px-4 py-1.5 bg-blue-100 text-primary rounded-full text-sm font-semibold mb-6">
                #1 Job Portal for Professionals
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Discover Your <span className="text-primary">Perfect</span> Career Path
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Connect with industry leaders and find opportunities that align with your expertise and aspirations.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">10,000+ Jobs</span>
                </div>
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Top Companies</span>
                </div>
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">Remote Options</span>
                </div>
              </div>
            </div>
            
            {/* Right Column - Search Widget */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-200 rounded-full opacity-50"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full opacity-50"></div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Find Your Dream Job</h3>
              
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  ref={inputRef}
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-transparent focus:outline-none"
                  placeholder="Job title, company, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.trim() !== '' && setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-transparent focus:outline-none"
                  placeholder="Location (city, state, or remote)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <input type="checkbox" id="remote" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                  <label htmlFor="remote" className="ml-2 text-gray-700">Remote Only</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="fulltime" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                  <label htmlFor="fulltime" className="ml-2 text-gray-700">Full-Time</label>
                </div>
              </div>
              
              <button 
                className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:shadow-xl text-white py-4 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center font-medium text-lg"
                onClick={() => setShowDropdown(searchTerm.trim() !== '')}
              >
                <FaSearch className="mr-2" />
                Search Jobs
              </button>
              
              {/* Search Results Dropdown */}
              {showDropdown && filteredJobs.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute z-[100] mt-2 left-8 right-8 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200"
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}
                >
                  <div className="py-2">
                    {filteredJobs.map((job, index) => (
                      <Link 
                        key={job.id} 
                        href={`/jobs/${job.id}`}
                        className={`block px-4 py-3 hover:bg-blue-50 transition-colors ${activeIndex === index ? 'bg-blue-50' : ''}`}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FaBriefcase className="text-primary text-lg" />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-medium text-gray-900 mb-0.5">{job.title}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              {job.company && (
                                <span className="inline-block">
                                  {job.company}
                                </span>
                              )}
                              {job.company && job.location && (
                                <span className="mx-1 text-gray-300">•</span>
                              )}
                              {job.location && (
                                <span className="inline-block">
                                  {job.location}
                                </span>
                              )}
                            </div>
                          </div>
                          {job.isNew || (
                            new Date().getTime() - new Date(job.postedDate).getTime() < 7 * 24 * 60 * 60 * 1000
                          ) && (
                            <div className="ml-2 flex-shrink-0">
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">New</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                    
                    <div className="flex justify-center mt-1 px-4 py-2 border-t border-gray-100">
                      <Link 
                        href="/jobs" 
                        className="text-sm text-primary font-medium flex items-center hover:underline"
                        onClick={() => setShowDropdown(false)}
                      >
                        View all jobs
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              
              {showDropdown && filteredJobs.length === 0 && searchTerm.trim() !== '' && (
                <div 
                  className="absolute z-[100] mt-2 left-8 right-8 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200"
                >
                  <div className="p-4 text-center">
                    <p className="text-gray-500">No jobs found matching "{searchTerm}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-[1px] w-10 bg-primary"></div>
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-primary text-sm font-medium rounded-full">
              {searchTerm ? 'Search Results' : 'Available Positions'}
            </span>
            <div className="h-[1px] w-10 bg-primary"></div>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5">
            <span className="relative inline-block">
              {searchTerm ? `Results for "${searchTerm}"` : 'Latest Job Openings'}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-primary rounded-full"></div>
            </span>
          </h2>
          <p className="text-gray-600 mt-6 max-w-2xl mx-auto text-lg">
            {searchTerm 
              ? `Found ${displayedJobs.length} job${displayedJobs.length !== 1 ? 's' : ''} matching your search criteria`
              : 'Explore our most recent opportunities from top employers across various industries'
            }
          </p>
        </div>
        
        {displayedJobs.length === 0 ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow text-center border border-gray-100">
            <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              {searchTerm ? 'No matching jobs found' : 'No jobs available'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search criteria or browse all jobs'
                : 'Check back later for new opportunities'
              }
            </p>
            {searchTerm && (
              <button 
                onClick={clearSearch}
                className="px-5 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-full hover:shadow-lg transition-shadow inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedJobs.map((job, index) => (
              <PublicJobCard key={job.id} job={job} index={index} />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default JobsPage; 