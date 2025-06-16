import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaArrowLeft, FaUser, FaFileAlt, FaEye, FaCheck, FaTimes, FaFilter, FaSearch, FaUserPlus, FaEdit, FaTrash, FaUserSlash, FaFilePdf } from 'react-icons/fa';
import Link from 'next/link';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';

// Define interfaces for type safety
interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ProfileAllocation {
  id: string;
  jobTitle: string;
  jobDescription?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience?: string;
  education?: string;
  resumeUrl?: string;
  status: string;
  createdAt: string;
  submittedBy: {
    id: string;
    name: string;
  };
  notes?: string;
}

const EmployeeCandidatesPage: React.FC = () => {
  const router = useRouter();
  const { id, employeeId } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  
  // State
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [profileAllocation, setProfileAllocation] = useState<ProfileAllocation | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingCandidateId, setUpdatingCandidateId] = useState<string | null>(null);
  interface DebugInfo {
    employee?: Employee;
    profileAllocation?: ProfileAllocation;
    candidatesResponse?: any;
    candidatesError?: string;
    mainError?: string;
  }
  
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch data
  useEffect(() => {
    console.log('Router query params:', router.query);
    console.log('Session status:', sessionStatus);
    console.log('Session data:', session);
    
    if (id && employeeId && session?.user?.id && sessionStatus === 'authenticated') {
      console.log('All requirements met, fetching data...');
      fetchData();
    } else {
      console.log('Missing requirements for data fetch:', { 
        id: id || 'missing', 
        employeeId: employeeId || 'missing', 
        userId: session?.user?.id || 'missing',
        sessionStatus
      });
    }
  }, [id, employeeId, session, sessionStatus, router.isReady]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching data with params:', { id, employeeId, session });
      
      // Fetch employee details
      console.log('Fetching employee details...');
      const employeeResponse = await fetch(`/api/recruiter/employer/employees/${employeeId}`);
      console.log('Employee response status:', employeeResponse.status);
      
      if (!employeeResponse.ok) {
        const errorData = await employeeResponse.json().catch(() => ({}));
        console.error('Employee fetch failed:', { status: employeeResponse.status, error: errorData });
        throw new Error(`Failed to fetch employee details: ${errorData.error || employeeResponse.statusText}`);
      }
      
      const employeeData = await employeeResponse.json();
      console.log('Employee data received:', employeeData);
      setEmployee(employeeData);
      setDebugInfo((prev: DebugInfo) => ({ ...prev, employee: employeeData }));
      
      // Fetch profile allocation details
      console.log('Fetching profile allocation details...');
      const allocationResponse = await fetch(`/api/recruiter/employer/profile-allocations/${id}`);
      console.log('Profile allocation response status:', allocationResponse.status);
      
      if (!allocationResponse.ok) {
        const errorData = await allocationResponse.json().catch(() => ({}));
        console.error('Profile allocation fetch failed:', { status: allocationResponse.status, error: errorData });
        throw new Error(`Failed to fetch profile allocation details: ${errorData.error || allocationResponse.statusText}`);
      }
      
      const allocationData = await allocationResponse.json();
      console.log('Profile allocation data received:', allocationData);
      setProfileAllocation(allocationData);
      setDebugInfo((prev: DebugInfo) => ({ ...prev, profileAllocation: allocationData }));
      
      // Fetch candidates submitted by this employee for this profile allocation
      console.log('Fetching candidates...');
      try {
        const candidatesResponse = await fetch(`/api/recruiter/employer/profile-allocations/${id}/employee/${employeeId}/candidates`);
        console.log('Candidates response status:', candidatesResponse.status);
        
        const candidatesData = await candidatesResponse.json();
        console.log('Candidates data received:', candidatesData);
        setDebugInfo((prev: DebugInfo) => ({ ...prev, candidatesResponse: candidatesData }));
        
        if (candidatesData._error) {
          console.warn('API returned error:', candidatesData._error);
          toast.error(`Error: ${candidatesData._error}`);
        }
        
        if (candidatesData.candidates && Array.isArray(candidatesData.candidates)) {
          console.log(`Setting ${candidatesData.candidates.length} candidates`);
          // Log each candidate's status for debugging
          candidatesData.candidates.forEach((candidate: any) => {
            console.log(`Candidate ${candidate.name} (${candidate.id}) status: ${candidate.status}`);
          });
          setCandidates(candidatesData.candidates);
          setFilteredCandidates(candidatesData.candidates);
        } else {
          console.warn('Invalid candidates data format, using empty array:', candidatesData);
          setCandidates([]);
          setFilteredCandidates([]);
        }
      } catch (candidateError: any) {
        console.error('Error fetching candidates:', candidateError);
        // Don't throw error here, just set empty candidates
        setCandidates([]);
        setFilteredCandidates([]);
        toast.error('Could not load candidates. Please try again later.');
        setDebugInfo((prev: DebugInfo) => ({ ...prev, candidatesError: candidateError.message }));
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'An error occurred while fetching data');
      toast.error('Failed to load data');
      setDebugInfo((prev: DebugInfo) => ({ ...prev, mainError: err.message }));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search and filtering
  useEffect(() => {
    let result = [...candidates];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        candidate => 
          candidate.name.toLowerCase().includes(term) ||
          candidate.email.toLowerCase().includes(term) ||
          candidate.phone?.toLowerCase().includes(term) ||
          candidate.skills.some(skill => skill.toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(candidate => candidate.status === statusFilter);
    }
    
    setFilteredCandidates(result);
  }, [searchTerm, statusFilter, candidates]);
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Handle candidate status update
  const handleStatusUpdate = async (candidateId: string, newStatus: string) => {
    try {
      setUpdatingCandidateId(candidateId);
      console.log(`Updating candidate ${candidateId} status to ${newStatus}`);
      
      // Ensure status is lowercase for consistency
      const normalizedStatus = newStatus.toLowerCase();
      
      const response = await fetch(`/api/recruiter/employer/candidates/${candidateId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: normalizedStatus,
          feedback: '' // No feedback for now
        }),
      });

      const data = await response.json();
      console.log('Status update response:', data);

      if (response.ok) {
        toast.success(`Status updated to ${normalizedStatus}`);
        
        // Update the local state with the new status
        setCandidates(prev => 
          prev.map(candidate => 
            candidate.id === candidateId 
              ? { ...candidate, status: normalizedStatus } 
              : candidate
          )
        );
      } else {
        console.error('Failed to update status:', data.error);
        toast.error(`Failed to update status: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('An error occurred while updating the status');
    } finally {
      setUpdatingCandidateId(null);
    }
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recruiter/candidates/${candidateId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Candidate deleted successfully');
        // Update the candidates list
        setCandidates(candidates.filter(candidate => candidate.id !== candidateId));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete candidate');
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast.error('Error deleting candidate');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(null);
    }
  };

  // Function to generate and download candidate PDF
  const generateCandidatePDF = async (candidate: Candidate) => {
    try {
      // Fetch complete candidate details from the API
      const response = await fetch(`/api/recruiter/get-candidate-details?candidateId=${candidate.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch complete candidate details');
      }
      
      const candidateDetails = await response.json();
      console.log('Fetched complete candidate details:', candidateDetails);
      
      // Create new PDF document with margins
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Define margins and layout
      const margin = 20; // 20mm margin
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const contentWidth = pageWidth - 2 * margin;
      const labelWidth = 80; // Width for field labels
      
      // Add title with more space
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Candidate Profile', pageWidth / 2, margin + 5, { align: 'center' });
      
      // Add decorative line under title
      pdf.setLineWidth(0.5);
      pdf.line(margin, margin + 10, pageWidth - margin, margin + 10);
      
      let yPos = margin + 25; // More space after title
      const lineHeight = 8; // Increased line height for better readability
      const sectionSpacing = 15; // Space between sections
      
      // Add candidate basic information in the exact order from the form
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Candidate Details', margin, yPos);
      yPos += 12;
      
      // Helper function for two-column layout with alignment
      const addField = (label: string, value: string) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label + ":", margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value || 'Not specified', margin + labelWidth, yPos);
        yPos += lineHeight;
      };
      
      // Personal Information Section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Personal Information', margin, yPos);
      yPos += 10;
      pdf.setFontSize(11);
      
      // Personal details
      addField("Full Name", candidateDetails.name || candidate.name);
      addField("Email", candidateDetails.email || candidate.email);
      addField("Phone", candidateDetails.phone || '');
      addField("Date of Birth", candidateDetails.dateOfBirth || '');
      addField("Marital Status", candidateDetails.maritalStatus && candidateDetails.maritalStatus !== 'Select' ? 
        candidateDetails.maritalStatus : '');
      addField("Current Location", candidateDetails.currentLocation || '');
      addField("Passport Available", candidateDetails.passportAvailable && candidateDetails.passportAvailable !== 'Select' ? 
        candidateDetails.passportAvailable : '');
      
      // Check if we need to add a new page
      if (pageHeight - yPos < 30) {
        pdf.addPage();
        yPos = margin;
      }
      
      // Professional Information Section
      yPos += sectionSpacing;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Professional Information', margin, yPos);
      yPos += 10;
      pdf.setFontSize(11);
      
      // Company and position details
      addField("Company Name", candidateDetails.companyName || '');
      addField("Client Name", candidateDetails.clientName || '');
      addField("Position Applied", candidateDetails.positionApplied || '');
      addField("Current Organization", candidateDetails.currentOrganization || '');
      addField("Current Designation", candidateDetails.currentDesignation || '');
      addField("Duration", candidateDetails.duration || '');
      
      // Check if we need to add a new page
      if (pageHeight - yPos < 30) {
        pdf.addPage();
        yPos = margin;
      }
      
      // Experience Section
      yPos += sectionSpacing;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Experience & Education', margin, yPos);
      yPos += 10;
      pdf.setFontSize(11);
      
      // Experience details
      addField("Total Experience (years)", candidateDetails.totalExperience || '');
      addField("Relevant Experience (years)", candidateDetails.relevantExperience || '');
      addField("Education / Certification", candidateDetails.education || '');
      
      // Check if we need to add a new page
      if (pageHeight - yPos < 30) {
        pdf.addPage();
        yPos = margin;
      }
      
      // Employment Details Section
      yPos += sectionSpacing;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Employment Details', margin, yPos);
      yPos += 10;
      pdf.setFontSize(11);
      
      // Employment details
      addField("Reason of Leaving", candidateDetails.reasonOfLeaving || '');
      addField("Reporting To", candidateDetails.reportingTo || '');
      addField("Number of Direct Reportees", candidateDetails.numberOfDirectReportees || '');
      
      // Check if we need to add a new page
      if (pageHeight - yPos < 30) {
        pdf.addPage();
        yPos = margin;
      }
      
      // Salary Information Section
      yPos += sectionSpacing;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Salary Information', margin, yPos);
      yPos += 10;
      pdf.setFontSize(11);
      
      // Salary details
      addField("Current Salary", candidateDetails.currentSalary || '');
      addField("Expected Salary", candidateDetails.expectedSalary || '');
      
      // Medical Information Section
      if (candidateDetails.medicalIssues) {
        yPos += sectionSpacing;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('Medical Information', margin, yPos);
        yPos += 10;
        pdf.setFontSize(11);
        
        addField("Medical Issues", candidateDetails.medicalIssues || '');
      }
      
      yPos += 5;
      
      // Check if we need to add a new page (if less than 30mm left)
      if (pageHeight - yPos < 30) {
        pdf.addPage();
        yPos = margin; // Reset to top margin on new page
      }
        
      // Add detailed experience information if available
      if (candidateDetails.experienceDetails && candidateDetails.experienceDetails.length > 0) {
        yPos += sectionSpacing;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Experience History', margin, yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        candidateDetails.experienceDetails.forEach((exp: any, index: number) => {
          // Create a box for each experience entry
          const boxStartY = yPos - 5;
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${exp.company || ''}`, margin, yPos);
          yPos += lineHeight;
          
          pdf.setFont('helvetica', 'normal');
          if (exp.title) {
            pdf.text(`Position: ${exp.title}`, margin + 10, yPos);
            yPos += lineHeight;
          }
          
          if (exp.startDate || exp.endDate) {
            const dateText = `Duration: ${exp.startDate || 'N/A'} to ${exp.endDate || 'Present'}`;
            pdf.text(dateText, margin + 10, yPos);
            yPos += lineHeight;
          }
          
          if (exp.description) {
            const descLines = pdf.splitTextToSize(`Description: ${exp.description}`, contentWidth - 20);
            pdf.text(descLines, margin + 10, yPos);
            yPos += lineHeight * descLines.length;
          }
          
          // Draw a light box around the experience entry
          const boxEndY = yPos;
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.3);
          pdf.rect(margin - 5, boxStartY, contentWidth + 10, boxEndY - boxStartY);
          
          yPos += 5; // Add some space after each experience
          
          // Check if we need to add a new page
          if (pageHeight - yPos < 30) {
            pdf.addPage();
            yPos = margin;
          }
        });
      }
      
      // Check if we need to add a new page
      if (pageHeight - yPos < 50) {
        pdf.addPage();
        yPos = margin; // Reset to top margin on new page
      }
      
      // Add detailed education information if available
      if (candidateDetails.educationDetails && candidateDetails.educationDetails.length > 0) {
        yPos += sectionSpacing;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Education Details', margin, yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        candidateDetails.educationDetails.forEach((edu: any, index: number) => {
          // Create a box for each education entry
          const boxStartY = yPos - 5;
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${edu.institution || ''}`, margin, yPos);
          yPos += lineHeight;
          
          pdf.setFont('helvetica', 'normal');
          if (edu.degree && edu.degree !== 'Not specified') {
            pdf.text(`Degree: ${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`, margin + 10, yPos);
            yPos += lineHeight;
          }
          
          if (edu.startDate || edu.endDate) {
            const dateText = `Duration: ${edu.startDate || 'N/A'} to ${edu.endDate || 'Present'}`;
            pdf.text(dateText, margin + 10, yPos);
            yPos += lineHeight;
          }
          
          // Draw a light box around the education entry
          const boxEndY = yPos;
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.3);
          pdf.rect(margin - 5, boxStartY, contentWidth + 10, boxEndY - boxStartY);
          
          yPos += 5; // Add some space after each education
          
          // Check if we need to add a new page
          if (pageHeight - yPos < 30) {
            pdf.addPage();
            yPos = margin;
          }
        });
      }
      
      // Add skills section
      if (candidateDetails.skills && candidateDetails.skills.length > 0) {
        yPos += sectionSpacing;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Skills', margin, yPos);
        yPos += 10;
        
        // Create a box for skills
        const boxStartY = yPos - 5;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        // Display skills as tags/badges
        const skillsPerRow = 3;
        const skillWidth = contentWidth / skillsPerRow;
        const skillPadding = 5;
        let currentX = margin;
        let currentY = yPos;
        
        candidateDetails.skills.forEach((skill: string, index: number) => {
          // If we've reached the end of a row, move to the next line
          if (index > 0 && index % skillsPerRow === 0) {
            currentX = margin;
            currentY += lineHeight + 5;
          }
          
          // Draw skill badge background
          pdf.setFillColor(240, 247, 255);
          pdf.setDrawColor(200, 215, 250);
          pdf.roundedRect(
            currentX, 
            currentY - 5, 
            skillWidth - skillPadding, 
            lineHeight + 2, 
            2, 
            2, 
            'FD'
          );
          
          // Write skill text
          pdf.setTextColor(0, 76, 153);
          pdf.text(skill, currentX + 5, currentY);
          pdf.setTextColor(0, 0, 0); // Reset text color
          
          // Move to next position
          currentX += skillWidth;
        });
        
        // Update yPos to after the skills section
        yPos = currentY + lineHeight + 5;
        
        // Draw a box around all skills
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.rect(margin - 5, boxStartY, contentWidth + 10, yPos - boxStartY);
      }
      
      // Add submission info
      yPos += sectionSpacing;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Submission Information', margin, yPos);
      yPos += 10;
      
      // Create a box for submission info
      const boxStartY = yPos - 5;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      // Add submission details with improved formatting
      addField("Submitted by", candidate.submittedBy.name);
      addField("Submitted on", formatDate(candidate.createdAt));
      
      // Draw a box around submission info
      const boxEndY = yPos;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.rect(margin - 5, boxStartY, contentWidth + 10, boxEndY - boxStartY);
      
      // Add footer with page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
          `Page ${i} of ${totalPages}`, 
          pageWidth / 2, 
          pageHeight - 10, 
          { align: 'center' }
        );
      }
      
      // Generate the PDF for the candidate details
      const candidatePdfBytes = pdf.output('arraybuffer');
      
      // If there's a resume URL, try to fetch and merge it
      if (candidate.resumeUrl) {
        try {
          // Show loading toast
          toast.loading('Merging resume with candidate details...');
          
          // Convert candidate PDF to PDF-lib format
          const pdfDoc = await PDFDocument.create();
          const candidateDetailsPdf = await PDFDocument.load(candidatePdfBytes);
          
          // Copy all pages from candidate details PDF
          const candidatePages = await pdfDoc.copyPages(candidateDetailsPdf, candidateDetailsPdf.getPageIndices());
          candidatePages.forEach(page => pdfDoc.addPage(page));
          
          // Add a page for resume
          const resumePage = pdfDoc.addPage();
          const { width, height } = resumePage.getSize();
          
          // Add resume header
          resumePage.drawText('Resume', {
            x: width / 2 - 40,
            y: height - 50,
            size: 24
          });
          
          try {
            // Fetch resume PDF from the server
            const resumeResponse = await fetch(`/api/recruiter/merge-resume-pdf?resumeUrl=${encodeURIComponent(candidate.resumeUrl)}`);
            
            if (resumeResponse.ok) {
              // Get resume as ArrayBuffer
              const resumeBuffer = await resumeResponse.arrayBuffer();
              
              // Load the resume PDF
              const resumePdf = await PDFDocument.load(resumeBuffer);
              
              // Copy all pages from the resume PDF
              const resumePages = await pdfDoc.copyPages(resumePdf, resumePdf.getPageIndices());
              resumePages.forEach(page => pdfDoc.addPage(page));
              
              // Save the merged PDF
              const mergedPdfBytes = await pdfDoc.save();
              
              // Convert to Blob and download
              const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = `candidate_${candidate.name.replace(/\s+/g, '_')}.pdf`;
              link.click();
              
              toast.dismiss();
              toast.success('PDF with resume generated successfully');
              return; // Exit early as we've handled the download
            } else {
              throw new Error('Failed to fetch resume');
            }
          } catch (resumeError) {
            console.error('Error merging resume:', resumeError);
            // Continue with just the candidate details if resume merging fails
            toast.error('Could not merge resume, generating candidate details only');
          }
        } catch (err) {
          console.error('Error with PDF merging:', err);
          toast.error('Error merging resume, generating candidate details only');
        } finally {
          toast.dismiss();
        }
      }
      
      // If we get here, either there was no resume or merging failed
      // Save the PDF with just candidate details
      const blob = new Blob([candidatePdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `candidate_${candidate.name.replace(/\s+/g, '_')}.pdf`;
      link.click();
      
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Show loading state if session is still loading
  if (sessionStatus === 'loading') {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-3">Loading session...</div>
        </div>
      </RecruiterLayout>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-3">Loading data...</div>
        </div>
      </RecruiterLayout>
    );
  }

  if (error || !employee || !profileAllocation) {
    return (
      <RecruiterLayout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || 'Failed to load data'}</p>
              </div>
              <div className="mt-4">
                <Link href={`/recruiter/employer/profile-management/candidates/${id}`} className="text-sm font-medium text-red-800 hover:text-red-900">
                  &larr; Go back to profile allocation
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
            <h4 className="font-bold">Debug Information:</h4>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="space-y-6">
        {/* Back button */}
        <div className="mb-6">
          <Link href={`/recruiter/employer/profile-management/candidates/${id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <FaArrowLeft className="mr-2" /> Back to Profile Allocation
          </Link>
        </div>
        
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Candidates Submitted by {employee.name}
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-medium text-gray-500">Employee</h2>
              <p className="text-lg font-medium text-gray-900">{employee.name}</p>
              <p className="text-sm text-gray-600">{employee.email}</p>
              <p className="text-sm text-gray-600">Role: {employee.role}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Profile Allocation</h2>
              <p className="text-lg font-medium text-gray-900">{profileAllocation.jobTitle}</p>
              <p className="text-sm text-gray-600">{profileAllocation.jobDescription?.substring(0, 100)}...</p>
            </div>
          </div>
        </div>
        
        {/* Search and filter */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFilter className="text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Candidates list */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredCandidates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted On
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Page
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
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaUser className="text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                            <div className="text-sm text-gray-500">{candidate.email}</div>
                            {candidate.phone && <div className="text-sm text-gray-500">{candidate.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {candidate.skills && candidate.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.slice(0, 3).map((skill, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  +{candidate.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">No skills listed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{candidate.experience || 'Not specified'}</div>
                        <div className="text-sm text-gray-500">{candidate.education || 'Education not specified'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(candidate.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => generateCandidatePDF(candidate)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FaFilePdf className="mr-1" /> Download PDF
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(candidate.status)}`}>
                          {candidate.status ? candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1).toLowerCase() : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          {candidate.resumeUrl && (
                            <a
                              href={candidate.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                              title="View Resume"
                            >
                              <FaFileAlt />
                            </a>
                          )}
                          <div className="flex space-x-2">
                            <Link 
                              href={`/recruiter/employer/profile-management/candidates/${id}/edit-candidate/${candidate.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Candidate"
                            >
                              <FaEdit />
                            </Link>
                            <button
                              onClick={() => setDeleteConfirmation(candidate.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Candidate"
                            >
                              <FaTrash />
                            </button>
                          </div>
                          <div>
                            <div className="relative">
                              <select
                                className="block w-full pl-3 pr-10 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={(candidate.status || 'pending').toLowerCase()}
                                onChange={(e) => handleStatusUpdate(candidate.id, e.target.value)}
                                disabled={updatingCandidateId === candidate.id}
                                onClick={() => console.log(`Dropdown for ${candidate.name}: current status = ${candidate.status}`)}
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                              {updatingCandidateId === candidate.id && (
                                <div className="absolute right-0 top-0 mt-1 mr-2">
                                  <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Delete Confirmation Dialog */}
                        {deleteConfirmation === candidate.id && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-xs text-red-800 mb-2">Are you sure you want to delete this candidate?</p>
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-2 py-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                                disabled={isDeleting}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteCandidate(candidate.id)}
                                className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaUserSlash className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter ? 'Try adjusting your search or filter' : 'No candidates have been submitted yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default EmployeeCandidatesPage; 