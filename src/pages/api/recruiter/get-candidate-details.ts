import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';

// Define interface for candidate feedback data
interface FeedbackData {
  companyName?: string;
  dateOfBirth?: string;
  clientName?: string;
  positionApplied?: string;
  totalExperience?: string;
  relevantExperience?: string;
  currentOrganization?: string;
  currentDesignation?: string;
  duration?: string;
  reasonOfLeaving?: string;
  reportingTo?: string;
  numberOfDirectReportees?: string;
  currentSalary?: string;
  expectedSalary?: string;
  education?: string;
  maritalStatus?: string;
  passportAvailable?: string;
  currentLocation?: string;
  medicalIssues?: string;
  [key: string]: any; // Allow for additional fields
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let prisma;

  try {
    // Get a database connection
    prisma = await getConnection();

    const session = await getSession({ req });
    if (!session) {
      releaseConnection();
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { candidateId } = req.query;
    if (!candidateId || typeof candidateId !== 'string') {
      releaseConnection();
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    // Get the candidate with all details
    const candidate = await prisma.candidates.findUnique({
      where: { id: candidateId },
      include: {
        recruiterSubmissions: true,
        experience: true,
        education: true
      }
    });

    if (!candidate) {
      releaseConnection();
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    console.log('Candidate data retrieved:', JSON.stringify(candidate, null, 2));

    // Get the recruiter_candidate relationship
    const recruiterCandidate = candidate.recruiterSubmissions[0];
    if (!recruiterCandidate) {
      return res.status(404).json({ error: 'Candidate submission not found' });
    }

    // Parse skills from JSON string
    let skills: string[] = [];
    try {
      if (candidate.skills) {
        skills = typeof candidate.skills === 'string' 
          ? JSON.parse(candidate.skills) 
          : candidate.skills;
      }
    } catch (error) {
      console.error('Error parsing skills:', error);
    }

    // Get candidate feedback data (contains all the form fields)
    let feedbackData: FeedbackData = {};
    try {
      // Access feedback field and check if it contains JSON data
      if (recruiterCandidate.feedback && typeof recruiterCandidate.feedback === 'string') {
        try {
          feedbackData = JSON.parse(recruiterCandidate.feedback) as FeedbackData;
        } catch {
          // If not valid JSON, it might be just regular feedback text
          feedbackData = {};
        }
      }
    } catch (error) {
      console.error('Error parsing feedback data:', error);
    }

    // Format experience information
    const experienceInfo = candidate.experience && candidate.experience.length > 0 
      ? candidate.experience.map((exp: any) => ({
          company: exp.company,
          title: exp.title,
          startDate: exp.start_date ? new Date(exp.start_date).toLocaleDateString() : '',
          endDate: exp.end_date ? new Date(exp.end_date).toLocaleDateString() : '',
          description: exp.description || ''
        }))
      : [];
      
    // Format education information
    const educationInfo = candidate.education && candidate.education.length > 0
      ? candidate.education.map((edu: any) => ({
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field || '',
          startDate: edu.start_date ? new Date(edu.start_date).toLocaleDateString() : '',
          endDate: edu.end_date ? new Date(edu.end_date).toLocaleDateString() : ''
        }))
      : [];
    
    // Debug log for feedback data
    console.log('Feedback data before formatting:', JSON.stringify(feedbackData, null, 2));
    console.log('Experience info:', JSON.stringify(experienceInfo, null, 2));
    console.log('Education info:', JSON.stringify(educationInfo, null, 2));
    
    // Format the candidate data with all details - ensure empty values are properly handled
    const formattedCandidate = {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      skills: skills,
      resumeUrl: candidate.resume_url,
      status: recruiterCandidate.status || 'pending',
      createdAt: recruiterCandidate.created_at?.toISOString() || candidate.created_at.toISOString(),
      profileAllocationId: recruiterCandidate.profile_allocation_id,
      // Add all form fields from feedback_data with proper null/empty handling
      fullName: candidate.name,
      companyName: feedbackData.companyName || '',
      dateOfBirth: feedbackData.dateOfBirth || '',
      clientName: feedbackData.clientName || '',
      positionApplied: feedbackData.positionApplied || '',
      totalExperience: feedbackData.totalExperience || '',
      relevantExperience: feedbackData.relevantExperience || '',
      currentOrganization: feedbackData.currentOrganization || '',
      currentDesignation: feedbackData.currentDesignation || '',
      duration: feedbackData.duration || '',
      reasonOfLeaving: feedbackData.reasonOfLeaving || '',
      reportingTo: feedbackData.reportingTo || '',
      numberOfDirectReportees: feedbackData.numberOfDirectReportees || '',
      currentSalary: feedbackData.currentSalary || '',
      expectedSalary: feedbackData.expectedSalary || '',
      education: feedbackData.education || '',
      maritalStatus: feedbackData.maritalStatus && feedbackData.maritalStatus !== 'Select' ? feedbackData.maritalStatus : '',
      passportAvailable: feedbackData.passportAvailable && feedbackData.passportAvailable !== 'Select' ? feedbackData.passportAvailable : '',
      currentLocation: feedbackData.currentLocation || '',
      medicalIssues: feedbackData.medicalIssues || '',
      // Add detailed experience and education information
      experienceDetails: experienceInfo,
      educationDetails: educationInfo,
      // Add any other fields from feedback_data
      ...feedbackData
    };
    
    // Debug log for formatted candidate
    console.log('Formatted candidate data:', JSON.stringify({
      name: formattedCandidate.name,
      email: formattedCandidate.email,
      skills: formattedCandidate.skills.length,
      experienceDetails: formattedCandidate.experienceDetails.length,
      educationDetails: formattedCandidate.educationDetails.length
    }, null, 2));

    releaseConnection();
    return res.status(200).json(formattedCandidate);
  } catch (error) {
    console.error('Error fetching candidate details:', error);
    if (prisma) {
      releaseConnection();
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
} 