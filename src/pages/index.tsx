import React, { useState, useEffect, useRef } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { JobPosting } from '@/types';
import PublicJobCard from '@/components/Public/PublicJobCard';
import { motion } from 'framer-motion';
import { FaBriefcase, FaSearch, FaUserTie, FaBuilding, FaMapMarkerAlt, FaTimesCircle, FaUserGraduate, FaCloud, FaMoneyBillWave, FaDatabase, FaExclamationTriangle, FaRocket, FaClipboardCheck, FaLightbulb, FaShareAlt } from 'react-icons/fa';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

interface HomeProps {
  jobs: JobPosting[];
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch jobs from API - use HTTP for localhost during development
    const isProduction = process.env.NODE_ENV === 'production';
    const protocol = isProduction ? 'https' : 'http';
    const host = isProduction ? (process.env.VERCEL_URL || 'localhost:3000') : 'localhost:3000';
    const res = await fetch(`${protocol}://${host}/api/jobs`);
    
    if (!res.ok) {
      console.error(`Failed to fetch jobs for homepage. Status: ${res.status}`);
      throw new Error('Failed to fetch jobs');
    }
    
    const allJobs = await res.json();
    
    // Filter to only show open jobs
    const openJobs = allJobs.filter((job: any) => job.status?.toLowerCase() === 'open');
    
    console.log(`Fetched ${allJobs.length} jobs, ${openJobs.length} open jobs for homepage`);
    
    return {
      props: {
        jobs: openJobs,
      },
    };
  } catch (error) {
    console.error('Error fetching jobs for homepage:', error);
    return {
      props: {
        jobs: [],
      },
    };
  }
};

const HomePage: React.FC<HomeProps> = ({ jobs }) => {
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>(jobs);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonialSliderRef = useRef<HTMLDivElement>(null);
  
  // New refs and state for search functionality
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<JobPosting[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | null>(null);
  
  // Stats counter states
  const [jobCount, setJobCount] = useState(0);
  const [candidateCount, setCandidateCount] = useState(0);
  const [satisfactionRate, setSatisfactionRate] = useState(0);
  const [countersStarted, setCountersStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Add state and ref for animated counters at the top of HomePage
  const [yearsCount, setYearsCount] = useState(0);
  const [placementsCount, setPlacementsCount] = useState(0);
  const [consultantsCount, setConsultantsCount] = useState(0);
  const [industriesCount, setIndustriesCount] = useState(0);
  
  useEffect(() => {
    setFilteredJobs(
      jobs.filter(job => 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, jobs]);

  // Update dropdown width when search input changes size or dropdown becomes visible
  useEffect(() => {
    const updateDropdownWidth = () => {
      if (searchInputRef.current) {
        setDropdownWidth(searchInputRef.current.offsetWidth);
      }
    };
    
    // Update on initial render and when dropdown visibility changes
    updateDropdownWidth();
    
    // Update on window resize
    window.addEventListener('resize', updateDropdownWidth);
    
    return () => {
      window.removeEventListener('resize', updateDropdownWidth);
    };
  }, [showSearchDropdown]);

  // Search functionality for real-time dropdown
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const filtered = jobs.filter(job => 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSearchResults(filtered.slice(0, 5)); // Limit to 5 results for dropdown
    setShowSearchDropdown(true);
  }, [searchTerm, jobs]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node) && 
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSearchIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSearchIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && activeSearchIndex >= 0) {
      e.preventDefault();
      if (searchResults[activeSearchIndex]?.id) {
        window.location.href = `/jobs/${searchResults[activeSearchIndex].id}`;
      }
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
    }
  };
  
  // Stats counter animation
  useEffect(() => {
    // Create the observer
    const observer = new IntersectionObserver(
      (entries) => {
        // If stats section is visible and animation hasn't started yet
        if (entries[0].isIntersecting && !countersStarted) {
          setCountersStarted(true);
          // Animate years counter from 0 to 20
          let yearsValue = 0;
          const yearsTarget = 20;
          const yearsDuration = 1000;
          const yearsStep = Math.ceil(yearsTarget / (yearsDuration / 25));
          const yearsInterval = setInterval(() => {
            yearsValue += yearsStep;
            if (yearsValue >= yearsTarget) {
              setYearsCount(yearsTarget);
              clearInterval(yearsInterval);
            } else {
              setYearsCount(yearsValue);
            }
          }, 25);
          // Animate placements counter from 0 to 10,000
          let placementsValue = 0;
          const placementsTarget = 10000;
          const placementsDuration = 1200;
          const placementsStep = Math.ceil(placementsTarget / (placementsDuration / 25));
          const placementsInterval = setInterval(() => {
            placementsValue += placementsStep;
            if (placementsValue >= placementsTarget) {
              setPlacementsCount(placementsTarget);
              clearInterval(placementsInterval);
            } else {
              setPlacementsCount(placementsValue);
            }
          }, 25);
          // Animate consultants counter from 0 to 100
          let consultantsValue = 0;
          const consultantsTarget = 100;
          const consultantsDuration = 1000;
          const consultantsStep = Math.ceil(consultantsTarget / (consultantsDuration / 25));
          const consultantsInterval = setInterval(() => {
            consultantsValue += consultantsStep;
            if (consultantsValue >= consultantsTarget) {
              setConsultantsCount(consultantsTarget);
              clearInterval(consultantsInterval);
            } else {
              setConsultantsCount(consultantsValue);
            }
          }, 25);
          // Animate industries counter from 0 to 40
          let industriesValue = 0;
          const industriesTarget = 40;
          const industriesDuration = 1000;
          const industriesStep = Math.ceil(industriesTarget / (industriesDuration / 25));
          const industriesInterval = setInterval(() => {
            industriesValue += industriesStep;
            if (industriesValue >= industriesTarget) {
              setIndustriesCount(industriesTarget);
              clearInterval(industriesInterval);
            } else {
              setIndustriesCount(industriesValue);
            }
          }, 25);
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) {
      observer.observe(statsRef.current);
    }
    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [countersStarted]);
  
  // Auto-scrolling effect for company logos
  useEffect(() => {
    if (!sliderRef.current) return;
    
    // Reset the scroll position to start when the component mounts
    sliderRef.current.scrollLeft = 0;
    
    let animationId: number;
    let position = 0;
    const speed = 1.5; // pixels per frame - adjusted for smoother movement
    
    const animate = () => {
      if (!sliderRef.current || isSliderHovered) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      
      // Get the total width to determine when to reset
      const totalWidth = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      
      // Increment position for left-to-right movement
      position += speed;
      
      // Reset position when it reaches the end (right side)
      if (position >= totalWidth) {
        // Smoothly reset to the beginning
        position = 0;
        sliderRef.current.scrollTo({
          left: position,
          behavior: 'auto'
        });
      } else {
        // Apply the scroll position
        sliderRef.current.scrollLeft = position;
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isSliderHovered]);
  
  const handleToggleView = () => {
    setShowAdminPortal(prev => !prev);
  };
  
  // Auto-sliding effect for testimonials
  useEffect(() => {
    if (!testimonialSliderRef.current) return;
    
    const autoSlideInterval = setInterval(() => {
      if (!testimonialSliderRef.current) return;
      
      // Only auto-slide if not being hovered
      if (!isSliderHovered) {
        const newIndex = activeTestimonial === 2 ? 0 : activeTestimonial + 1;
        setActiveTestimonial(newIndex);
        const scrollAmount = (testimonialSliderRef.current.clientWidth) * newIndex;
        testimonialSliderRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
      }
    }, 5000); // Change testimonial every 5 seconds
    
    return () => {
      clearInterval(autoSlideInterval);
    };
  }, [activeTestimonial, isSliderHovered]);
  
  if (showAdminPortal) {
    // Redirect to admin dashboard
    // In a real app, you would check authentication first
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center bg-white p-10 rounded-xl shadow-xl max-w-md w-full"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaUserTie className="text-primary text-3xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Admin Portal</h1>
          <p className="text-lg text-gray-600 mb-8">You are being redirected to the admin portal.</p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
            <Link href="/admin/dashboard" className="btn btn-primary w-full sm:w-auto">
              Go to Dashboard
            </Link>
            <button onClick={handleToggleView} className="btn btn-secondary w-full sm:w-auto">
              Back to Public View
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 w-full overflow-hidden">
      <Head>
        <title>Talnurt | Find Your Dream Job</title>
        <meta name="description" content="Connect with top employers and discover opportunities that match your skills and career goals at Talnurt Recruitment Portal." />
      </Head>
      <Navbar />
      
      {/* Hero Section */}
      <div className="py-14 sm:py-18 md:py-24 mb-0 bg-gradient-to-r from-primary to-indigo-600 text-white shadow-xl overflow-hidden relative w-full">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>
        
        {/* Content */}
        <div className="relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col md:flex-row items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="md:w-1/2 text-center md:text-left mb-12 md:mb-0"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              Find Your <span className="text-yellow-300 relative inline-block">
                Dream Job
                <span className="absolute bottom-0 left-0 w-full h-1.5 bg-yellow-300/40 rounded-full"></span>
              </span> Today
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-xl leading-relaxed">
              Connect with top employers and discover opportunities that match your skills and career goals.
            </p>
            <div className="w-full max-w-xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-primary/60" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="block w-full pl-12 pr-20 py-4 text-gray-700 bg-white border-0 rounded-full focus:ring-2 focus:ring-primary/50 shadow-lg focus:outline-none"
                  placeholder="Search for jobs, companies, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.trim() !== '' && setShowSearchDropdown(true)}
                  onKeyDown={handleSearchKeyDown}
                />
                <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="mr-2 text-gray-400 hover:text-primary focus:outline-none transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <button 
                    className="bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02]"
                    onClick={() => {
                      if(searchTerm.trim() !== '') {
                        window.location.href = `/jobs?search=${encodeURIComponent(searchTerm)}`;
                      }
                    }}
                  >
                    Search
                  </button>
                </div>
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div 
                  ref={searchDropdownRef}
                  className="absolute z-[100] mt-2 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200"
                  style={{
                    width: dropdownWidth ? `${dropdownWidth}px` : '100%',
                    left: 0,
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}
                >
                  <div className="py-2">
                    {searchResults.map((job, index) => (
                      <Link 
                        key={job.id} 
                        href={`/jobs/${job.id}`}
                        className={`block px-4 py-3 hover:bg-blue-50 transition-colors ${activeSearchIndex === index ? 'bg-blue-50' : ''}`}
                        onMouseEnter={() => setActiveSearchIndex(index)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <FaBriefcase className="text-yellow-500 text-lg" />
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
                        href={`/jobs?search=${encodeURIComponent(searchTerm)}`}
                        className="text-sm text-primary font-medium flex items-center hover:underline"
                        onClick={() => setShowSearchDropdown(false)}
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
              
              {showSearchDropdown && searchResults.length === 0 && searchTerm.trim() !== '' && (
                <div 
                  className="absolute z-[100] mt-2 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200"
                  style={{
                    width: dropdownWidth ? `${dropdownWidth}px` : '100%',
                    left: 0
                  }}
                >
                  <div className="p-4 text-center">
                    <p className="text-gray-500">No jobs found matching "{searchTerm}"</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:w-1/2 flex justify-center"
          >
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-1 rounded-2xl bg-white/30 blur-xl"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="text-sm ml-2 opacity-70">Job Search</div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/20 p-4 rounded-xl hover:bg-white/30 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FaBriefcase className="text-yellow-300 text-lg" />
                      <div>
                        <div className="text-sm font-medium">Software Engineer</div>
                        <div className="text-xs opacity-70">Google • Remote</div>
                      </div>
                      <div className="ml-auto bg-green-400/30 text-green-300 text-xs px-2 py-1 rounded-full">New</div>
                    </div>
                  </div>
                  <div className="bg-white/20 p-4 rounded-xl hover:bg-white/30 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FaBriefcase className="text-yellow-300 text-lg" />
                      <div>
                        <div className="text-sm font-medium">Product Manager</div>
                        <div className="text-xs opacity-70">Microsoft • Hybrid</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/20 p-4 rounded-xl hover:bg-white/30 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FaBriefcase className="text-yellow-300 text-lg" />
                      <div>
                        <div className="text-sm font-medium">UX Designer</div>
                        <div className="text-xs opacity-70">Apple • On-site</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Link href="/jobs" className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]">
                      <span>View all jobs</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Top Jobs Hiring Now Section */}
      <section className="py-20 px-4 w-full bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-[1px] w-10 bg-primary"></div>
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-primary text-sm font-medium rounded-full">Latest Opportunities</span>
              <div className="h-[1px] w-10 bg-primary"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5">
              <span className="relative inline-block">
                Top Jobs <span className="text-primary">Hiring Now</span>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-primary rounded-full"></div>
              </span>
            </h2>
            <p className="text-gray-600 mt-6 max-w-2xl mx-auto text-lg mb-10">
              Explore top opportunities from leading companies across various industries
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {jobs.length > 0 ? (
              // Sort by posted date (most recent first) and limit to 4 jobs
              jobs
                .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
                .slice(0, 4)
                .map((job, index) => {
                  // Define job type styling
                  let jobTypeStyle = "";
                  let jobTypeText = "";
                  
                  if (job.workMode?.toLowerCase() === "remote") {
                    jobTypeStyle = "text-orange-600";
                    jobTypeText = "remote";
                  } else if (job.workMode?.toLowerCase() === "hybrid") {
                    jobTypeStyle = "text-blue-600";
                    jobTypeText = "hybrid";
                  } else {
                    jobTypeStyle = "text-rose-600";
                    jobTypeText = "on-site";
                  }
                  
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
                  
                  // Define color based on index
                  const colors = [
                    "bg-blue-500", // Blue for first card
                    "bg-indigo-500", // Indigo for second card
                    "bg-purple-500", // Purple for third card
                    "bg-teal-500" // Teal for fourth card
                  ];
                  
                  const cardColor = colors[index % colors.length];
                  const iconBgColors = [
                    "bg-blue-100", "bg-indigo-100", "bg-purple-100", "bg-teal-100"
                  ];
                  const iconColor = index % 4 === 0 ? "text-blue-500" : 
                                   index % 4 === 1 ? "text-indigo-500" :
                                   index % 4 === 2 ? "text-purple-500" : 
                                   "text-teal-500";
                  
                  return (
                    <div 
                      key={job.id} 
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border border-gray-100"
                    >
                      <div className={`h-3 ${cardColor} w-full`}></div>
              <div className="p-6">
                        <div className="flex gap-4 mb-4">
                          <div className={`${iconBgColors[index % 4]} w-12 h-12 rounded-lg flex items-center justify-center shrink-0`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="8" y1="6" x2="21" y2="6"></line>
                              <line x1="8" y1="12" x2="21" y2="12"></line>
                              <line x1="8" y1="18" x2="21" y2="18"></line>
                              <line x1="3" y1="6" x2="3.01" y2="6"></line>
                              <line x1="3" y1="12" x2="3.01" y2="12"></line>
                              <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                  </div>
                  <div>
                            <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                            <p className="text-gray-500 text-sm">{job.company || "Company"}</p>
              </div>
            </div>
            
                        <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                          <span>{job.location}</span>
                  </div>
                        
                <div className="flex justify-between items-center mb-4">
                          <span className={`${jobTypeStyle} text-sm lowercase`}>
                            {jobTypeText}
                          </span>
                          <div className="text-gray-900 font-medium">
                            {formattedSalary}
                            <span className="text-xs text-gray-500"> / yr</span>
              </div>
            </div>
            
                        <Link 
                          href={`/jobs/${job.id}`}
                          className="w-full bg-primary text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center"
                        >
                  <span>Apply Now</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                        </Link>
              </div>
            </div>
                  );
                })
            ) : (
              // Display placeholder if no jobs are available
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center p-8">
                <p className="text-gray-500">No job listings available at the moment. Please check back soon!</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-center mt-12">
            <Link href="/jobs" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-800 hover:text-primary hover:border-primary transition-colors duration-300 font-medium py-3 px-6 rounded-full shadow-sm hover:shadow">
              <span>View all jobs</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* What We Offer Section */}
      <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="py-20 px-4 w-full bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-[1px] w-10 bg-primary"></div>
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-primary text-sm font-medium rounded-full">Services built for scale</span>
              <div className="h-[1px] w-10 bg-primary"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5">
              <span className="relative inline-block">
                What We <span className="text-primary">Offer</span>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-primary rounded-full"></div>
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* For Job Seekers */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
              whileHover={{ y: -8, boxShadow: '0 8px 32px 0 rgba(80,120,255,0.10)' }}
              className="relative group h-full bg-white rounded-xl p-8 shadow-sm flex flex-col justify-between border border-gray-100 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-xl"></div>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 animate-pulse group-hover:scale-110 transition-transform duration-300">
                <FaUserGraduate className="text-blue-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-center">For Job Seekers</h3>
              <p className="text-gray-600 text-center">A powerful job search platform connecting them with global career opportunities.</p>
            </motion.div>
            {/* For Employers & Recruiters */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 8px 32px 0 rgba(80,120,255,0.10)' }}
              className="relative group h-full bg-white rounded-xl p-8 shadow-sm flex flex-col justify-between border border-gray-100 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-xl"></div>
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 animate-pulse group-hover:scale-110 transition-transform duration-300">
                <FaUserTie className="text-indigo-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-center">For Employers &amp; Recruiters</h3>
              <p className="text-gray-600 text-center">A cost-effective hiring solution to post jobs, manage applications, and access a curated talent pool via a smart dashboard.</p>
            </motion.div>
            {/* Cloud-Integrated System */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, boxShadow: '0 8px 32px 0 rgba(80,120,255,0.10)' }}
              className="relative group h-full bg-white rounded-xl p-8 shadow-sm flex flex-col justify-between border border-gray-100 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500 rounded-t-xl"></div>
              <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 animate-pulse group-hover:scale-110 transition-transform duration-300">
                <FaCloud className="text-teal-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-center">Cloud-Integrated System</h3>
              <p className="text-gray-600 text-center">A scalable and secure AWS-backed infrastructure with both a front-end job portal and a back-end recruitment dashboard.</p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* The Problem We Solve Section */}
      <section className="py-20 px-4 w-full bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-[1px] w-10 bg-primary"></div>
              <span className="inline-block px-4 py-1.5 bg-red-100 text-primary text-sm font-medium rounded-full">Redefining what's possible</span>
              <div className="h-[1px] w-10 bg-primary"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5">
              <span className="relative inline-block">
                The Problem We <span className="text-primary">Solve</span>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-primary rounded-full"></div>
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* High Costs of Traditional Platforms */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
              whileHover={{ y: -8, boxShadow: '0 8px 32px 0 rgba(255,99,132,0.10)' }}
              className="relative group h-full bg-white rounded-xl p-8 shadow-sm flex flex-col justify-between border border-gray-100 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-xl"></div>
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 animate-pulse group-hover:scale-110 transition-transform duration-300">
                <FaMoneyBillWave className="text-red-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-center">High Costs of Traditional Platforms</h3>
              <p className="text-gray-600 text-center">Existing ATS, ERPs, and Job Portals are too expensive for recruiters and companies to hire the right talent.</p>
            </motion.div>
            {/* Candidate Databases Management */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 8px 32px 0 rgba(255,193,7,0.10)' }}
              className="relative group h-full bg-white rounded-xl p-8 shadow-sm flex flex-col justify-between border border-gray-100 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500 rounded-t-xl"></div>
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 animate-pulse group-hover:scale-110 transition-transform duration-300">
                <FaDatabase className="text-yellow-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-center">Candidate Databases Management</h3>
              <p className="text-gray-600 text-center">Many recruiters, SMEs, and Hiring Managers struggle to maintain structured databases for efficient hiring.</p>
            </motion.div>
            {/* Fake Job Listings */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)' }}
              className="relative group h-full bg-white rounded-xl p-8 shadow-sm flex flex-col justify-between border border-gray-100 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-xl"></div>
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 animate-pulse group-hover:scale-110 transition-transform duration-300">
                <FaExclamationTriangle className="text-indigo-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-center">Fake Job Listings</h3>
              <p className="text-gray-600 text-center">The market is flooded with unverified and misleading job openings, affecting job seekers' trust and recruiters' efficiency.</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <motion.section ref={statsRef} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="py-16 px-4 w-full bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center flex flex-col items-center group transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 transition-transform duration-300 group-hover:scale-110">
                {yearsCount}+
              </p>
              <p className="text-base text-gray-600">Years of Market Leadership</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 text-center flex flex-col items-center group transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 transition-transform duration-300 group-hover:scale-110">
                {placementsCount.toLocaleString()}+
              </p>
              <p className="text-base text-gray-600">Placements till date</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 text-center flex flex-col items-center group transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 transition-transform duration-300 group-hover:scale-110">
                {consultantsCount}+
              </p>
              <p className="text-base text-gray-600">Recruitment Consultants</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 text-center flex flex-col items-center group transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 transition-transform duration-300 group-hover:scale-110">
                {industriesCount}+
              </p>
              <p className="text-base text-gray-600">Industries Covered</p>
            </div>
          </div>
        </div>
      </motion.section>
      
      {/* How we Nuture a Talent? Section */}
      <section className="py-20 px-4 w-full bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-[1px] w-10 bg-primary"></div>
              <span className="inline-block px-4 py-1.5 bg-yellow-100 text-primary text-sm font-medium rounded-full">Talent Journey</span>
              <div className="h-[1px] w-10 bg-primary"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5">
              <span className="relative inline-block">
                How we <span className="text-primary">Nuture a Talent?</span>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-primary rounded-full"></div>
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Job */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
              whileHover={{ y: -8, scale: 1.05, boxShadow: '0 8px 32px 0 rgba(59,130,246,0.10)' }}
              className="bg-blue-50 rounded-xl p-10 flex flex-col items-center shadow-md transition-all duration-300 group cursor-pointer"
            >
              <span className="mb-6 bg-blue-100 rounded-full p-5 flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                <FaRocket className="text-blue-500 text-4xl group-hover:scale-110 transition-transform duration-300" />
              </span>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Job</h3>
              <p className="text-gray-600 text-center">Find your dream Job</p>
            </motion.div>
            {/* Prep */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, scale: 1.05, boxShadow: '0 8px 32px 0 rgba(34,197,94,0.10)' }}
              className="bg-green-50 rounded-xl p-10 flex flex-col items-center shadow-md transition-all duration-300 group cursor-pointer"
            >
              <span className="mb-6 bg-green-100 rounded-full p-5 flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
                <FaClipboardCheck className="text-green-500 text-4xl group-hover:scale-110 transition-transform duration-300" />
              </span>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Prep</h3>
              <p className="text-gray-600 text-center">Prepare for interviews</p>
            </motion.div>
            {/* Learn */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, scale: 1.05, boxShadow: '0 8px 32px 0 rgba(253,224,71,0.10)' }}
              className="bg-yellow-50 rounded-xl p-10 flex flex-col items-center shadow-md transition-all duration-300 group cursor-pointer"
            >
              <span className="mb-6 bg-yellow-100 rounded-full p-5 flex items-center justify-center group-hover:bg-yellow-200 transition-colors duration-300">
                <FaLightbulb className="text-yellow-500 text-4xl group-hover:scale-110 transition-transform duration-300" />
              </span>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Learn</h3>
              <p className="text-gray-600 text-center">Enhance your skills</p>
            </motion.div>
            {/* Network */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, scale: 1.05, boxShadow: '0 8px 32px 0 rgba(236,72,153,0.10)' }}
              className="bg-pink-100 rounded-xl p-10 flex flex-col items-center shadow-md transition-all duration-300 group cursor-pointer"
            >
              <span className="mb-6 bg-pink-200 rounded-full p-5 flex items-center justify-center group-hover:bg-pink-300 transition-colors duration-300">
                <FaShareAlt className="text-pink-500 text-4xl group-hover:scale-110 transition-transform duration-300" />
              </span>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Network</h3>
              <p className="text-gray-600 text-center">Connect with verified Recruiters</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="py-20 px-4 w-full bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-[1px] w-10 bg-primary"></div>
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-primary text-sm font-medium rounded-full">Success Stories</span>
              <div className="h-[1px] w-10 bg-primary"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5">
              <span className="relative inline-block">
                What Our <span className="text-primary">Users Say</span>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-primary rounded-full"></div>
              </span>
            </h2>
            <p className="text-gray-600 mt-6 max-w-2xl mx-auto text-lg">
              Discover how our platform has helped candidates and employers achieve their goals
            </p>
          </div>
          
          {/* Testimonial Slider */}
          <div 
            className="relative"
            onMouseEnter={() => setIsSliderHovered(true)}
            onMouseLeave={() => setIsSliderHovered(false)}
          >
            <div className="overflow-hidden">
              <div 
                ref={testimonialSliderRef}
                className="flex flex-nowrap snap-x snap-mandatory overflow-x-auto scrollbar-hide py-8"
                style={{ 
                  scrollBehavior: 'smooth',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                }}
              >
                {/* Add CSS to hide scrollbar for WebKit browsers */}
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                
                {/* Testimonial 1 */}
                <div className={`w-full lg:w-1/2 flex-shrink-0 px-4 snap-center ${activeTestimonial === 0 ? 'opacity-100' : 'opacity-50 lg:opacity-100'}`}>
                  <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100/80 h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-center mb-6">
                      <div className="mr-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          J
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">Jessica Miller</h3>
                        <p className="text-sm text-gray-600">Software Engineer at Google</p>
                      </div>
                      <div className="ml-auto">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-100 opacity-80">
                          <path d="M14.028 6C6.684 11.184 1.5 19.68 1.5 29.64C1.5 36.384 5.556 41.4 11.388 41.4C16.596 41.4 20.652 37.512 20.652 32.16C20.652 26.976 16.764 23.592 12.06 23.592C11.052 23.592 9.54 23.928 9.036 24.096C10.38 18.408 16.428 13.392 21.996 10.848L14.028 6ZM38.796 6C31.452 11.184 26.268 19.68 26.268 29.64C26.268 36.384 30.324 41.4 36.156 41.4C41.364 41.4 45.42 37.512 45.42 32.16C45.42 26.976 41.532 23.592 36.828 23.592C35.82 23.592 34.308 23.928 33.804 24.096C35.148 18.408 41.196 13.392 46.764 10.848L38.796 6Z" fill="currentColor"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 italic mb-6">"Talnurt completely transformed my job search. The AI matching technology connected me with opportunities that perfectly aligned with my skills. Within two weeks, I landed my dream job at Google. The platform's ease of use and personalized approach sets it apart from other job sites."</p>
                    <p className="text-sm text-gray-500">Joined May 2023 • Found job in 14 days</p>
                  </div>
                </div>
                
                {/* Testimonial 2 */}
                <div className={`w-full lg:w-1/2 flex-shrink-0 px-4 snap-center ${activeTestimonial === 1 ? 'opacity-100' : 'opacity-50 lg:opacity-100'}`}>
                  <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100/80 h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-center mb-6">
                      <div className="mr-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          M
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">Michael Chen</h3>
                        <p className="text-sm text-gray-600">HR Director at TechCorp</p>
                      </div>
                      <div className="ml-auto">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-100 opacity-80">
                          <path d="M14.028 6C6.684 11.184 1.5 19.68 1.5 29.64C1.5 36.384 5.556 41.4 11.388 41.4C16.596 41.4 20.652 37.512 20.652 32.16C20.652 26.976 16.764 23.592 12.06 23.592C11.052 23.592 9.54 23.928 9.036 24.096C10.38 18.408 16.428 13.392 21.996 10.848L14.028 6ZM38.796 6C31.452 11.184 26.268 19.68 26.268 29.64C26.268 36.384 30.324 41.4 36.156 41.4C41.364 41.4 45.42 37.512 45.42 32.16C45.42 26.976 41.532 23.592 36.828 23.592C35.82 23.592 34.308 23.928 33.804 24.096C35.148 18.408 41.196 13.392 46.764 10.848L38.796 6Z" fill="currentColor"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 italic mb-6">"As an employer, Talnurt has revolutionized our hiring process. The quality of candidates we receive is exceptional, saving our recruitment team countless hours. The platform's verification system ensures we only interact with serious, qualified professionals. We've reduced our time-to-hire by 40%."</p>
                    <p className="text-sm text-gray-500">Hiring partner since 2022 • 45+ positions filled</p>
                  </div>
                </div>
                
                {/* Testimonial 3 */}
                <div className={`w-full lg:w-1/2 flex-shrink-0 px-4 snap-center ${activeTestimonial === 2 ? 'opacity-100' : 'opacity-50 lg:opacity-100'}`}>
                  <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100/80 h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-center mb-6">
                      <div className="mr-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          S
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">Sarah Johnson</h3>
                        <p className="text-sm text-gray-600">UX Designer at Apple</p>
                      </div>
                      <div className="ml-auto">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-100 opacity-80">
                          <path d="M14.028 6C6.684 11.184 1.5 19.68 1.5 29.64C1.5 36.384 5.556 41.4 11.388 41.4C16.596 41.4 20.652 37.512 20.652 32.16C20.652 26.976 16.764 23.592 12.06 23.592C11.052 23.592 9.54 23.928 9.036 24.096C10.38 18.408 16.428 13.392 21.996 10.848L14.028 6ZM38.796 6C31.452 11.184 26.268 19.68 26.268 29.64C26.268 36.384 30.324 41.4 36.156 41.4C41.364 41.4 45.42 37.512 45.42 32.16C45.42 26.976 41.532 23.592 36.828 23.592C35.82 23.592 34.308 23.928 33.804 24.096C35.148 18.408 41.196 13.392 46.764 10.848L38.796 6Z" fill="currentColor"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 italic mb-6">"The career coaching services at Talnurt were game-changing for me. After struggling to break into UX design, their expert advice helped me refine my portfolio and interview skills. The personalized feedback and industry insights were invaluable. I'm now working at my dream company thanks to Talnurt!"</p>
                    <p className="text-sm text-gray-500">Career transition success • 3 months from start to hire</p>
                  </div>
                </div>
                
              </div>
            </div>
            
            {/* Navigation Dots */}
            <div className="flex justify-center mt-8 space-x-2">
              <button 
                onClick={() => {
                  setActiveTestimonial(0);
                  testimonialSliderRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
                }}
                className={`w-3 h-3 rounded-full transition-colors ${activeTestimonial === 0 ? 'bg-primary' : 'bg-gray-300 hover:bg-primary/70'}`}
              ></button>
              <button 
                onClick={() => {
                  setActiveTestimonial(1);
                  const scrollAmount = testimonialSliderRef.current?.clientWidth || 0;
                  testimonialSliderRef.current?.scrollTo({ left: scrollAmount, behavior: 'smooth' });
                }}
                className={`w-3 h-3 rounded-full transition-colors ${activeTestimonial === 1 ? 'bg-primary' : 'bg-gray-300 hover:bg-primary/70'}`}
              ></button>
              <button 
                onClick={() => {
                  setActiveTestimonial(2);
                  const scrollAmount = (testimonialSliderRef.current?.clientWidth || 0) * 2;
                  testimonialSliderRef.current?.scrollTo({ left: scrollAmount, behavior: 'smooth' });
                }}
                className={`w-3 h-3 rounded-full transition-colors ${activeTestimonial === 2 ? 'bg-primary' : 'bg-gray-300 hover:bg-primary/70'}`}
              ></button>
            </div>
            
            {/* Slider Controls */}
            <button 
              onClick={() => {
                const newIndex = activeTestimonial === 0 ? 2 : activeTestimonial - 1;
                setActiveTestimonial(newIndex);
                const scrollAmount = (testimonialSliderRef.current?.clientWidth || 0) * newIndex;
                testimonialSliderRef.current?.scrollTo({ left: scrollAmount, behavior: 'smooth' });
              }}
              className="absolute top-1/2 -left-4 sm:left-0 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-2 text-primary hover:scale-110 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => {
                const newIndex = activeTestimonial === 2 ? 0 : activeTestimonial + 1;
                setActiveTestimonial(newIndex);
                const scrollAmount = (testimonialSliderRef.current?.clientWidth || 0) * newIndex;
                testimonialSliderRef.current?.scrollTo({ left: scrollAmount, behavior: 'smooth' });
              }}
              className="absolute top-1/2 -right-4 sm:right-0 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-2 text-primary hover:scale-110 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </motion.section>
      
      {/* Newsletter Section */}
      <section className="py-16 px-4 w-full bg-gradient-to-r from-primary to-indigo-600 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/30"></div>
          <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white/20"></div>
          <div className="absolute bottom-10 left-1/4 w-20 h-20 rounded-full bg-white/20"></div>
          <svg className="absolute right-0 bottom-0" width="350" height="350" viewBox="0 0 350 350" fill="none">
            <path d="M350 350C350 156.7 193.3 0 0 0V350H350Z" fill="rgba(255,255,255,0.05)"></path>
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2">
              <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full inline-block mb-4">
                Stay Updated
              </span>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">Join our talent network</h3>
              <p className="text-white/90 text-lg mb-6 max-w-md">
                Get job alerts and be the first to hear about new opportunities that match your profile
              </p>
              
              <div className="flex space-x-4 mb-6 md:mb-0">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <span className="text-white">Weekly updates</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-white">Custom job alerts</span>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 max-w-md w-full">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 shadow-xl">
                <div className="flex flex-col space-y-4">
                  <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    className="px-4 py-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-all"
                  />
                  <div className="flex items-center mb-2">
                    <input type="checkbox" id="consent" className="mr-2 h-4 w-4 accent-yellow-300"/>
                    <label htmlFor="consent" className="text-white/80 text-sm">I agree to receive job alerts and marketing communications</label>
                  </div>
                  <button className="bg-white hover:bg-yellow-50 text-primary font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center group">
                    <span>Get Started</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Remove the old footer section and add the new Footer component */}
      <Footer />
    </div>
  );
};

export default HomePage;