import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaFileAlt, FaPlus, FaHistory, FaUserTie, FaBuilding, FaChartLine, 
         FaBold, FaItalic, FaUnderline, FaListUl, FaListOl, FaLink, FaAlignLeft, 
         FaAlignCenter, FaAlignRight, FaTimes, FaEye, FaCalendarAlt, FaUserCircle, FaCheckCircle, FaShieldAlt, FaExclamationTriangle, FaFilter, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useNotifications } from '@/contexts/NotificationsContext';

interface ReportsPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  console.log('GetServerSideProps for reports page. Session:', session ? `Found for ${session.user.email}` : 'Not found');

  // List of valid roles that can access reports
  const validReportRoles = ['employer', 'manager', 'employee'];
  
  if (!session || !validReportRoles.includes(session.user.role)) {
    console.log('User not authorized for reports page:', session?.user?.role || 'No session');
    return {
      redirect: {
        destination: '/recruiter/dashboard',
        permanent: false,
      },
    };
  }
  
  console.log(`User ${session.user.name} (${session.user.role}) authorized for reports page`);

  // Return the user data to the page
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

// Add interface for Report type
interface Report {
  id: string;
  title: string;
  content: string;
  date: string;
  recipient: string;
  recipientId: string;
  authorId: string;
  authorName?: string;
  authorRole?: string;
  status: 'Read' | 'Unread';
  isMultipleRecipients?: boolean;
  totalRecipients?: number;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ user }) => {
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [reportTemplateOption, setReportTemplateOption] = useState('blank');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Update to use Report interface
  const [previousReports, setPreviousReports] = useState<Report[]>([]);
  
  // Add state for team reports
  const [teamReports, setTeamReports] = useState<Report[]>([]);
  const [isTeamReportsLoading, setIsTeamReportsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(user.role === 'employer' ? 'team-reports' : 'my-reports');
  
  // Add a sub-tab for employer to filter between manager and employee reports
  const [employerReportFilter, setEmployerReportFilter] = useState<'managers' | 'employees'>('managers');
  
  // Add state for tracking unread reports
  const [unreadCount, setUnreadCount] = useState<{
    managers: number;
    employees: number;
    total: number;
  }>({ managers: 0, employees: 0, total: 0 });
  
  // Modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);

  // Add separate loading state for recipients
  const [isRecipientsLoading, setIsRecipientsLoading] = useState(true);
  
  // Add search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Make sure to call the function
  const [availableRecipients, setAvailableRecipients] = useState<Array<{
    id: string;
    name: string;
    role: string;
  }>>([]);

  // Use notifications context
  const { unreadReports, refreshUnreadReports, markReportAsRead } = useNotifications();

  // Add a ref to track if component is mounted
  const isMounted = useRef(true);
  // Add a ref to track if data is already being fetched
  const isDataFetching = useRef(false);
  // Add a ref to track last fetch time
  const lastFetchTime = useRef(0);
  // Cache timeout - 30 seconds
  const CACHE_TIMEOUT = 30000;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch recipients with debounce
  useEffect(() => {
    const fetchRecipients = async () => {
      if (isDataFetching.current) return;
      
      try {
        isDataFetching.current = true;
        setIsRecipientsLoading(true);
        const response = await axios.get('/api/reports/recipients');
        
        if (!isMounted.current) return;
        
        // Filter out any options with "Super Administrator" or "(Admin)" in the name
        const filteredRecipients = response.data.filter(
          (recipient: {id: string; name: string; role: string}) => 
            !recipient.name.includes('Super Administrator') && 
            !recipient.name.includes('(Admin)')
        );
        
        // Apply additional role-specific filtering
        let finalRecipients = filteredRecipients;
        
        // For employees, only show their direct manager and employers from their company
        if (user.role === 'employee') {
          finalRecipients = filteredRecipients.filter(
            (recipient: {id: string; name: string; role: string}) => 
              // Only include managers and employers
              (recipient.role === 'manager' || recipient.role === 'employer')
          );
        }
        
        // Remove any parenthetical suffixes from the name
        finalRecipients = finalRecipients.map(
          (recipient: {id: string; name: string; role: string}) => ({
            ...recipient,
            name: recipient.name.replace(/\s*\([^)]*\)/g, '')
          })
        );
        
        setAvailableRecipients(finalRecipients);
      } catch (error) {
        console.error('Error fetching recipients:', error);
        if (isMounted.current) {
          setError('Failed to load recipient list. Please try again later.');
        }
      } finally {
        if (isMounted.current) {
          setIsRecipientsLoading(false);
        }
        isDataFetching.current = false;
      }
    };
    
    fetchRecipients();
  }, [user.role, user.id]);

  // Memoized fetch functions to prevent recreating them on each render
  const fetchReports = useCallback(async () => {
    // Skip if already fetching or if cache is still valid
    const now = Date.now();
    if (isDataFetching.current || (now - lastFetchTime.current < CACHE_TIMEOUT)) {
      return;
    }
    
    try {
      isDataFetching.current = true;
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get('/api/reports');
      
      if (!isMounted.current) return;
      
      setPreviousReports(response.data);
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.error('Error fetching reports:', error);
      if (isMounted.current) {
        setError('Failed to load reports. Please try again later.');
        setPreviousReports([]);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      isDataFetching.current = false;
    }
  }, []);

  const fetchTeamReports = useCallback(async () => {
    if (!['manager', 'employer', 'admin'].includes(user.role)) {
      setTeamReports([]);
      setIsTeamReportsLoading(false);
      return;
    }
    
    // Skip if already fetching or if cache is still valid
    const now = Date.now();
    if (isDataFetching.current || (now - lastFetchTime.current < CACHE_TIMEOUT)) {
      return;
    }
    
    try {
      isDataFetching.current = true;
      setIsTeamReportsLoading(true);
      
      console.log(`Fetching team reports for ${user.name} (${user.role})`);
      const response = await axios.get('/api/reports/team');
      
      if (!isMounted.current) return;
      
      console.log('Team reports API response:', response.data);
      
      // Validate the response data before setting it
      if (Array.isArray(response.data)) {
        setTeamReports(response.data);
        
        // Set unread counts from context
        if (user.role === 'employer') {
          setUnreadCount({
            managers: unreadReports.managers,
            employees: unreadReports.employees,
            total: unreadReports.total
          });
        }
        
        lastFetchTime.current = Date.now();
      } else {
        console.error('Invalid team reports data format:', response.data);
        setTeamReports([]);
      }
    } catch (error) {
      console.error('Error fetching team reports:', error);
      if (isMounted.current) {
        setTeamReports([]);
      }
    } finally {
      if (isMounted.current) {
        setIsTeamReportsLoading(false);
      }
      isDataFetching.current = false;
    }
  }, [user.id, user.role, user.name, unreadReports]);

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Fetch team reports and refresh unread reports count
  useEffect(() => {
    fetchTeamReports();
    
    // Also refresh the global unread reports count, but only once
    const timer = setTimeout(() => {
      refreshUnreadReports();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [fetchTeamReports, refreshUnreadReports]);

  // Use an effect to log teamReports when they change (for debugging)
  useEffect(() => {
    if (activeTab === 'team-reports' && teamReports.length > 0) {
      console.log('Team reports data:', teamReports);
    }
  }, [teamReports, activeTab]);

  // Template options for different report types
  const reportTemplates = {
    blank: '',
    weekly: `# Weekly Progress Report\n\n## Activities Completed\n• \n• \n• \n\n## Challenges Faced\n• \n• \n\n## Next Week's Plan\n• \n• \n• \n\n## Additional Notes\n`,
    performance: `# Performance Report\n\n## Key Achievements\n• \n• \n\n## Areas of Excellence\n• \n• \n\n## Development Opportunities\n• \n• \n\n## Goals for Next Period\n• \n• \n`,
    project: `# Project Status Report\n\n## Project Name\n\n## Current Status\n- [ ] On Track\n- [ ] At Risk\n- [ ] Behind Schedule\n\n## Key Milestones\n• \n• \n\n## Issues/Risks\n• \n• \n\n## Action Items\n• \n• \n`
  };

  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = e.target.value;
    setReportTemplateOption(template);
    setReportContent(reportTemplates[template as keyof typeof reportTemplates]);
  };

  // Text formatting functions
  const formatText = (formatType: string) => {
    const textarea = document.getElementById('reportContent') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = '';
    let cursorPosition = 0;

    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorPosition = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorPosition = 1;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        cursorPosition = 3;
        break;
      case 'ul':
        formattedText = `\n• ${selectedText}`;
        cursorPosition = 3;
        break;
      case 'ol':
        formattedText = `\n1. ${selectedText}`;
        cursorPosition = 4;
        break;
      case 'h1':
        formattedText = `\n# ${selectedText}`;
        cursorPosition = 3;
        break;
      case 'h2':
        formattedText = `\n## ${selectedText}`;
        cursorPosition = 4;
        break;
      case 'h3':
        formattedText = `\n### ${selectedText}`;
        cursorPosition = 5;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        cursorPosition = selectedText.length + 3;
        break;
      default:
        return;
    }

    // Insert the formatted text
    const newContent = 
      textarea.value.substring(0, start) + 
      formattedText + 
      textarea.value.substring(end);
    
    setReportContent(newContent);
    
    // Set cursor position after the operation
    setTimeout(() => {
      textarea.focus();
      if (selectedText.length === 0) {
        // If no text was selected, place cursor inside formatting marks
        textarea.selectionStart = start + cursorPosition;
        textarea.selectionEnd = start + cursorPosition;
      } else {
        // If text was selected, place cursor after the formatted text
        textarea.selectionStart = start + formattedText.length;
        textarea.selectionEnd = start + formattedText.length;
      }
    }, 0);
  };

  // Simple markdown to HTML renderer for preview
  const renderMarkdown = (text: string) => {
    if (!text) return '';
    
    let html = text
      // Headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      // Bold, italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^\s*•\s*(.*$)/gm, '<li>$1</li>')
      .replace(/^\s*\d+\.\s*(.*$)/gm, '<li>$1</li>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Checkboxes
      .replace(/- \[ \] (.*$)/gm, '<div class="flex items-center"><input type="checkbox" class="mr-2" disabled> <span>$1</span></div>')
      .replace(/- \[x\] (.*$)/gim, '<div class="flex items-center"><input type="checkbox" class="mr-2" checked disabled> <span>$1</span></div>')
      // Paragraphs and line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    return `<p>${html}</p>`;
  };

  // Make report writing available to all roles
  const canSubmitReports = true;

  // Update the submit report handler to use API
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    
    try {
      // Validate the form fields
      if (!reportTitle.trim()) {
        throw new Error("Please enter a report title");
      }
      
      if (!reportContent.trim()) {
        throw new Error("Please enter report content");
      }
      
      if (selectedRecipients.length === 0) {
        throw new Error("Please select at least one recipient");
      }

      // First, ensure the reports table exists by calling setup
      try {
        console.log('Calling setup endpoint to ensure table exists');
        await axios.get('/api/reports/setup');
      } catch (setupError) {
        console.error('Error setting up reports table:', setupError);
        // Continue anyway, as the main API will also try to create the table
      }
      
      // Create the report data
      const reportData = {
        title: reportTitle,
        content: reportContent,
        recipientIds: selectedRecipients
      };
      
      console.log('Submitting report with data:', reportData);
      
      // Send the report to the API with credentials
      const response = await axios.post('/api/reports', reportData, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      console.log('Report submitted successfully:', response.data);
      
      // Add the new reports to the list
      if (response.data.reports) {
        // Multiple reports created
        const reportsToAdd = response.data.reports.map((report: any) => ({
          ...report,
          // Add info about multiple recipients
          isMultipleRecipients: response.data.reports.length > 1,
          totalRecipients: response.data.reports.length
        }));
        
        setPreviousReports(prevReports => [...reportsToAdd, ...prevReports]);
        
        // Show success message with recipient count
        setSubmitSuccess(true);
        setSuccessMessage(`Report sent to ${response.data.reports.length} recipient${response.data.reports.length > 1 ? 's' : ''}.`);
        
        // Show warning if some reports failed
        if (response.data.warning) {
          // Show as a non-blocking warning
          setError(response.data.warning);
          setTimeout(() => setError(null), 5000);
        }
      } else {
        // Single report created (backward compatibility)
        setPreviousReports(prevReports => [response.data, ...prevReports]);
        setSubmitSuccess(true);
        setSuccessMessage('Report submitted successfully!');
      }
      
      setShowNewReportForm(false);
      
      // Reset form
      setReportTitle('');
      setReportContent('');
      setSelectedRecipients([]);
      setReportTemplateOption('blank');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setError('You are not authorized to submit reports. Please log in again.');
        } else {
          setError(error.response.data?.error || 'Failed to submit report. Please try again.');
        }
      } else {
        setError(error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Update view report handler
  const handleViewReport = async (report: Report) => {
    try {
      // Fetch the full report details
      const response = await axios.get(`/api/reports/${report.id}`);
      setCurrentReport(response.data);
      setIsViewModalOpen(true);
      
      // Update the status to "Read" if it was "Unread" and the current user is the recipient
      if (report.status === 'Unread' && report.recipientId === user.id) {
        // Update in the UI
        setPreviousReports(prevReports => 
          prevReports.map(r => 
            r.id === report.id ? {...r, status: 'Read'} : r
          )
        );
        
        // Update team reports status if it exists there too
        setTeamReports(prevReports => 
          prevReports.map(r => 
            r.id === report.id ? {...r, status: 'Read'} : r
          )
        );
        
        // Update unread counts if this is an employer
        if (user.role === 'employer') {
          // Update local state
          setUnreadCount(prevCounts => {
            const authorRole = report.authorRole || '';
            if (authorRole === 'manager') {
              return {
                ...prevCounts,
                managers: Math.max(0, prevCounts.managers - 1),
                total: Math.max(0, prevCounts.total - 1)
              };
            } else if (authorRole === 'employee') {
              return {
                ...prevCounts,
                employees: Math.max(0, prevCounts.employees - 1),
                total: Math.max(0, prevCounts.total - 1)
              };
            }
            return prevCounts;
          });
          
          // Update global notifications state
          markReportAsRead(report.id, report.authorRole);
        }
        
        // Update in the database
        await axios.patch(`/api/reports/${report.id}/status`, { status: 'Read' });
        
        // Refresh the global unread reports count
        setTimeout(() => {
          refreshUnreadReports();
        }, 500); // Small delay to ensure DB update completes
      }
    } catch (error) {
      console.error('Error viewing report:', error);
      setError('Failed to load report details. Please try again.');
    }
  };

  // Close modal function
  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setCurrentReport(null);
  };

  // Function to filter reports based on search and filters
  const getFilteredReports = (reports: Report[]) => {
    if (!reports || reports.length === 0) return [];
    
    return reports.filter(report => {
      // Search term filter (search in title, author name, recipient, etc.)
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        report.title.toLowerCase().includes(searchTermLower) ||
        (report.authorName && report.authorName.toLowerCase().includes(searchTermLower)) ||
        report.recipient.toLowerCase().includes(searchTermLower) ||
        (report.authorRole && report.authorRole.toLowerCase().includes(searchTermLower));
      
      // Date range filter
      const reportDate = new Date(report.date);
      const matchesStartDate = !startDate || reportDate >= new Date(startDate);
      const matchesEndDate = !endDate || reportDate <= new Date(endDate);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || report.status.toLowerCase() === statusFilter.toLowerCase();
      
      // For employer, filter by role
      const matchesRole = user.role !== 'employer' || 
                       (employerReportFilter === 'managers' && report.authorRole === 'manager') || 
                       (employerReportFilter === 'employees' && report.authorRole === 'employee');
      
      return matchesSearch && matchesStartDate && matchesEndDate && matchesStatus && matchesRole;
    });
  };
  
  // Filtered reports
  const filteredPreviousReports = getFilteredReports(previousReports);
  const filteredTeamReports = getFilteredReports(teamReports);
  
  // Function to clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setEmployerReportFilter('managers');
  };

  return (
    <RecruiterLayout>
      <Head>
        <title>Reports | Talnurt Recruitment Portal</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <FaFileAlt className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Reports</h1>
                <p className="text-blue-100 mt-1">
                  {user.role === 'employer' 
                    ? "View reports from your managers and employees" 
                    : "Submit and track reports to your superiors"}
                </p>
              </div>
            </div>
            {user.role !== 'employer' && (
              <button
                onClick={() => setShowNewReportForm(!showNewReportForm)}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaPlus />
                <span>{showNewReportForm ? 'Cancel' : 'New Report'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
            <div className="flex">
              <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Write Report Button - More prominent for users to see (hide for employers) */}
        {!showNewReportForm && user.role !== 'employer' && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <FaFileAlt className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Write a New Report</h2>
              <p className="text-gray-600 mb-6 max-w-md">
                Create and submit detailed reports to your superiors with our rich text editor and templates.
              </p>
              <button
                onClick={() => setShowNewReportForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <FaPlus />
                <span>Write New Report</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* New Report Form */}
        {showNewReportForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">Submit New Report</h2>
            <form onSubmit={handleSubmitReport} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="reportTitle" className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                  <input
                    id="reportTitle"
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Weekly Progress Report"
                  />
                </div>

                <div>
                  <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 mb-1">
                    {user.role === 'employee' ? 'Recipients' : 'Recipient'}
                  </label>
                  {isRecipientsLoading ? (
                    <div className="animate-pulse flex h-12 bg-gray-200 rounded-md w-full"></div>
                  ) : availableRecipients.length > 0 ? (
                    <div className="relative">
                      {user.role === 'employee' ? (
                        <>
                          <div className="border border-gray-300 rounded-md shadow-sm">
                            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-blue-50 rounded-t-md">
                              <h4 className="text-sm font-medium text-blue-700">Select recipients</h4>
                              {selectedRecipients.length > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {selectedRecipients.length} selected
                                </span>
                              )}
                            </div>
                            <div className="p-3 max-h-48 overflow-y-auto">
                              {availableRecipients.map(recipient => {
                                const isSelected = selectedRecipients.includes(recipient.id);
                                return (
                                  <div 
                                    key={recipient.id} 
                                    className={`flex items-center p-2 mb-2 last:mb-0 rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                                      isSelected ? 'bg-blue-50 border border-blue-100' : ''
                                    }`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedRecipients(selectedRecipients.filter(id => id !== recipient.id));
                                      } else {
                                        setSelectedRecipients([...selectedRecipients, recipient.id]);
                                      }
                                    }}
                                  >
                                    <div className={`flex-shrink-0 h-5 w-5 border rounded flex items-center justify-center ${
                                      isSelected 
                                        ? 'bg-blue-600 border-blue-600' 
                                        : 'border-gray-300'
                                    }`}>
                                      {isSelected && (
                                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                      )}
                                    </div>
                                    <label 
                                      className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer"
                                    >
                                      {recipient.name} ({recipient.role.charAt(0).toUpperCase() + recipient.role.slice(1)})
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm">
                            <div className="flex items-center text-blue-600">
                              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                              </svg>
                              <p className="text-xs">
                                You can send reports to both your manager and employer at the same time.
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <select
                          id="recipients"
                          value={selectedRecipients}
                          onChange={(e) => {
                            const options = Array.from(e.target.selectedOptions, option => option.value);
                            setSelectedRecipients(options);
                          }}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                        >
                          <option value="">Select a recipient</option>
                          {availableRecipients.map(recipient => (
                            <option key={`${recipient.id}-${recipient.name}`} value={recipient.id}>
                              {recipient.name === 'Administrator' 
                                ? recipient.name 
                                : `${recipient.name} (${recipient.role.charAt(0).toUpperCase() + recipient.role.slice(1)})`
                              }
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-500 py-2 px-3 border border-red-200 rounded-md bg-red-50">
                      No recipients available based on your role. Please contact an administrator.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">Report Template</label>
                <select
                  id="template"
                  value={reportTemplateOption}
                  onChange={handleTemplateChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                >
                  <option value="blank">Blank Report</option>
                  <option value="weekly">Weekly Progress Report</option>
                  <option value="performance">Performance Report</option>
                  <option value="project">Project Status Report</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="reportContent" className="block text-sm font-medium text-gray-700">Report Content</label>
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                  >
                    {isPreviewMode ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Edit Mode</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Preview</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Text formatting toolbar */}
                {!isPreviewMode && (
                  <div className="flex flex-wrap gap-1 border border-gray-300 rounded-t-md p-3 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => formatText('bold')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                      title="Bold"
                    >
                      <FaBold />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('italic')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                      title="Italic"
                    >
                      <FaItalic />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('underline')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                      title="Underline"
                    >
                      <FaUnderline />
                    </button>
                    <span className="mx-1 text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => formatText('h1')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700 font-bold"
                      title="Heading 1"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('h2')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700 font-bold"
                      title="Heading 2"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('h3')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700 font-bold"
                      title="Heading 3"
                    >
                      H3
                    </button>
                    <span className="mx-1 text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => formatText('ul')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                      title="Bullet List"
                    >
                      <FaListUl />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('ol')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                      title="Numbered List"
                    >
                      <FaListOl />
                    </button>
                    <span className="mx-1 text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => formatText('link')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                      title="Insert Link"
                    >
                      <FaLink />
                    </button>
                  </div>
                )}

                {/* Content area - either textarea or preview */}
                {isPreviewMode ? (
                  <div 
                    className="w-full px-4 py-4 border border-gray-300 rounded-md rounded-t-none bg-white min-h-[300px] prose max-w-none overflow-auto"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(reportContent) }}
                  />
                ) : (
                  <textarea
                    id="reportContent"
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    required
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md rounded-t-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono transition-colors"
                    placeholder="Enter your report details here..."
                  />
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Format your text using the toolbar or markdown: <span className="font-mono">**bold**</span>, <span className="font-mono">*italic*</span>, <span className="font-mono"># Heading</span>, <span className="font-mono">## Subheading</span>, <span className="font-mono">• list item</span>
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewReportForm(false)}
                  className="mr-4 px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75 transition-colors"
                >
                  {submitLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </div>
                  ) : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Previous Reports Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-gray-900">
                {user.role === 'employer' && activeTab === 'team-reports' 
                  ? (
                    <div className="flex items-center">
                      <span>Reports from Subordinates</span>
                      {unreadCount.total > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium leading-none text-white bg-red-500 rounded-full">
                          {unreadCount.total}
                        </span>
                      )}
                    </div>
                  )
                  : 'Reports'}
              </h2>
              
              {/* Show tabs for managers and above */}
              {['manager', 'employer', 'admin'].includes(user.role) && (
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  {user.role !== 'employer' && (
                    <button
                      onClick={() => setActiveTab('my-reports')}
                      className={`px-3 py-1.5 text-sm font-medium ${
                        activeTab === 'my-reports' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {user.role === 'manager' ? 'Reports to Employer' : 'My Reports'}
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {!showNewReportForm && user.role !== 'employer' && (
                <button
                  onClick={() => setShowNewReportForm(true)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded flex items-center gap-1 transition-colors text-sm"
                >
                  <FaPlus size={12} />
                  <span>New Report</span>
                </button>
              )}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-colors text-sm"
              >
                <FaFilter size={12} />
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          {showFilters && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="searchTerm"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Search by name, title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    id="startDate"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    id="endDate"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    id="statusFilter"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="read">Read</option>
                    <option value="unread">Unread</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <FaTimes size={12} />
                  <span>Clear Filters</span>
                </button>
              </div>
              
              {/* Filter results info */}
              <div className="mt-2 text-sm text-gray-500">
                {activeTab === 'my-reports' && (
                  <p>Showing {filteredPreviousReports.length} of {previousReports.length} reports</p>
                )}
                {activeTab === 'team-reports' && (
                  <p>Showing {filteredTeamReports.length} of {teamReports.length} reports</p>
                )}
              </div>
            </div>
          )}
          
          {/* My Reports Tab */}
          {activeTab === 'my-reports' && (
            isLoading ? (
              <div className="py-20 flex justify-center items-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full mb-3"></div>
                  <div className="h-4 w-40 bg-blue-100 rounded mb-2"></div>
                  <div className="h-3 w-32 bg-gray-100 rounded"></div>
                </div>
              </div>
            ) : filteredPreviousReports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPreviousReports.map((report) => (
                      <tr 
                        key={report.id} 
                        className={`hover:bg-gray-50 ${
                          report.status === 'Unread' ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap relative">
                          {report.status === 'Unread' && (
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                          <div className={`text-sm font-medium text-gray-900 pl-3 ${
                            report.status === 'Unread' ? 'font-semibold' : ''
                          }`}>{report.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{report.date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{report.recipient}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            report.status === 'Read' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900 mr-3 flex items-center"
                            onClick={() => handleViewReport(report)}
                          >
                            <FaEye className="mr-1" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {searchTerm || startDate || endDate || statusFilter !== 'all' 
                    ? "No matching reports found" 
                    : user.role === 'manager' 
                      ? "Reports submitted by your employees will appear here."
                      : user.role === 'employer' 
                        ? "Reports submitted by your subordinates will appear here."
                        : "Reports from your team members will appear here."}
                </h3>
                <p className="mt-1 text-gray-500 max-w-md mx-auto">
                  {searchTerm || startDate || endDate || statusFilter !== 'all' 
                    ? "Try adjusting your search filters to find what you're looking for." 
                    : user.role === 'manager' 
                      ? "Reports submitted by your employees will appear here."
                      : user.role === 'employer' 
                        ? "Reports submitted by your subordinates will appear here."
                        : "Reports from your team members will appear here."}
                </p>
              </div>
            )
          )}
          
          {/* Team Reports Tab */}
          {activeTab === 'team-reports' && (
            isTeamReportsLoading ? (
              <div className="py-20 flex justify-center items-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full mb-3"></div>
                  <div className="h-4 w-40 bg-blue-100 rounded mb-2"></div>
                  <div className="h-3 w-32 bg-gray-100 rounded"></div>
                </div>
              </div>
            ) : filteredTeamReports && filteredTeamReports.length > 0 ? (
              <div>
                {/* Add role filter tabs for employer */}
                {user.role === 'employer' && (
                  <div className="mb-4">
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden w-fit">
                      <button
                        onClick={() => setEmployerReportFilter('managers')}
                        className={`px-4 py-2 text-sm font-medium ${
                          employerReportFilter === 'managers' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <span>From Managers</span>
                          {unreadCount.managers > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium leading-none text-white bg-red-500 rounded-full">
                              {unreadCount.managers}
                            </span>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => setEmployerReportFilter('employees')}
                        className={`px-4 py-2 text-sm font-medium ${
                          employerReportFilter === 'employees' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <span>From Employees</span>
                          {unreadCount.employees > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium leading-none text-white bg-red-500 rounded-full">
                              {unreadCount.employees}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          From
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTeamReports.map((report) => {
                        // Check if the report has all required fields before rendering
                        if (!report || !report.id || !report.title) {
                          console.error('Invalid report data:', report);
                          return null;
                        }
                        
                        return (
                          <tr 
                            key={report.id} 
                            className={`hover:bg-gray-50 ${
                              report.status === 'Unread' ? 'bg-blue-50' : ''
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap relative">
                              {report.status === 'Unread' && (
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></span>
                              )}
                              <div className={`text-sm font-medium text-gray-900 pl-3 ${
                                report.status === 'Unread' ? 'font-semibold' : ''
                              }`}>{report.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{report.date}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {report.authorName || 'Unknown'} ({report.authorRole || 'Unknown'})
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                report.status === 'Read' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button 
                                className="text-indigo-600 hover:text-indigo-900 mr-3 flex items-center"
                                onClick={() => handleViewReport(report)}
                              >
                                <FaEye className="mr-1" /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {searchTerm || startDate || endDate || statusFilter !== 'all' 
                    ? "No matching reports found" 
                    : user.role === 'manager' 
                      ? "Reports submitted by your employees will appear here."
                      : user.role === 'employer' 
                        ? "Reports submitted by your subordinates will appear here."
                        : "Reports from your team members will appear here."}
                </h3>
                <p className="mt-1 text-gray-500 max-w-md mx-auto">
                  {searchTerm || startDate || endDate || statusFilter !== 'all' 
                    ? "Try adjusting your search filters to find what you're looking for." 
                    : user.role === 'manager' 
                      ? "Reports submitted by your employees will appear here."
                      : user.role === 'employer' 
                        ? "Reports submitted by your subordinates will appear here."
                        : "Reports from your team members will appear here."}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Report View Modal */}
      {isViewModalOpen && currentReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={handleCloseModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={handleCloseModal}
                >
                  <span className="sr-only">Close</span>
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
              
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    {/* Report header */}
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <h3 className="text-2xl leading-6 font-bold text-gray-900" id="modal-title">
                        {currentReport.title}
                      </h3>
                      <div className="mt-4 flex flex-wrap items-center text-sm text-gray-600 gap-4">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-blue-500" />
                          <span>Submitted on {currentReport.date}</span>
                        </div>
                        <div className="flex items-center">
                          <FaUserCircle className="mr-2 text-blue-500" />
                          <span>To: {currentReport.recipient}</span>
                        </div>
                        <div className="flex items-center">
                          <FaCheckCircle className={`mr-2 ${currentReport.status === 'Read' ? 'text-green-500' : 'text-yellow-500'}`} />
                          <span>Status: {currentReport.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Report content */}
                    <div 
                      className="prose max-w-none overflow-auto px-2 py-4 max-h-[60vh]"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(currentReport.content || '') }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => window.print()}
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RecruiterLayout>
  );
};

export default ReportsPage; 