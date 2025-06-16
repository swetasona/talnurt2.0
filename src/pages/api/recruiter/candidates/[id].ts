import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';
import prisma from '@/lib/db-connection-manager'; // Use the singleton Prisma client

// Define interface for feedback data
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

/**
 * IMPORTANT: This API handles candidates for profile allocations only.
 * These candidates are different from job applicants in the talent section.
 * 
 * Profile allocation candidates:
 * - Added by recruiters for specific profile allocations
 * - Stored in the candidates table
 * - Linked to profile allocations via recruiter_candidates table
 * 
 * Job applicants:
 * - Users who apply directly to job postings
 * - Stored in the applications table linked to users
 * - Handled by different APIs in the /api/recruiter/applicants/ path
 */

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      // Use the public/uploads directory instead of a separate uploads directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`Created uploads directory: ${uploadDir}`);
      }
      
      console.log(`Using uploads directory: ${uploadDir}`);
      cb(null, uploadDir);
    },
    filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const ext = path.extname(file.originalname);
      const newFilename = `${uuidv4()}${ext}`;
      console.log(`Generated filename for upload: ${newFilename}`);
      cb(null, newFilename);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  },
});

// Helper function to process multer upload
const runMiddleware = (req: NextApiRequest & { [key: string]: any }, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest & { [key: string]: any }, res: NextApiResponse) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.query;

  // GET - Fetch candidate details
  if (req.method === 'GET') {
    try {
      console.log(`Fetching candidate with ID: ${id}`);
      
      // First, try to find the candidate directly
      const candidate = await prisma.candidates.findUnique({
        where: { id: id as string },
        include: {
          education: true,
          experience: true,
          recruiterSubmissions: {
            include: {
              profileAllocation: true
            }
          }
        }
      });
      
      if (!candidate) {
        console.log(`No candidate found with ID: ${id}`);
        return res.status(404).json({ error: 'Candidate not found' });
      }
      
      console.log(`Found candidate: ${candidate.name}`);
      console.log(`Resume URL from database: ${candidate.resume_url || 'None'}`);
      
      // Get the recruiter_candidate relationship from the included data
      const recruiterCandidate = candidate.recruiterSubmissions.length > 0 
        ? candidate.recruiterSubmissions[0] 
        : null;
      
      console.log(`Found recruiter_candidate relationship: ${recruiterCandidate ? 'Yes' : 'No'}`);
      
      // Parse skills from JSON string
      let skillsArray: string[] = [];
      try {
        if (candidate.skills) {
          if (typeof candidate.skills === 'string') {
            const parsed = JSON.parse(candidate.skills);
            if (Array.isArray(parsed)) {
              skillsArray = parsed.map(item => String(item));
              console.log('Parsed skills from JSON string:', skillsArray);
            }
          } else if (Array.isArray(candidate.skills)) {
            skillsArray = candidate.skills.map(item => String(item));
            console.log('Skills was already an array:', skillsArray);
          }
        }
      } catch (e) {
        console.error('Error parsing skills JSON:', e);
      }
      
      // DIRECT DATABASE QUERY for feedback data
      let parsedFeedback: FeedbackData = {};
      
      if (recruiterCandidate) {
        try {
          console.log('Fetching feedback directly from database for candidate ID:', id);
          
          // Direct query to get the feedback data
          const rcRecord = await prisma.recruiter_candidates.findFirst({
            where: { candidate_id: id as string }
          });
          
          if (rcRecord && rcRecord.feedback) {
            console.log('Found feedback in direct query');
            
            try {
              if (typeof rcRecord.feedback === 'string') {
                parsedFeedback = JSON.parse(rcRecord.feedback);
                console.log('Parsed feedback from direct query:', parsedFeedback);
              } else if (typeof rcRecord.feedback === 'object') {
                parsedFeedback = rcRecord.feedback as FeedbackData;
                console.log('Feedback from direct query is already an object');
              }
            } catch (e) {
              console.error('Error parsing feedback from direct query:', e);
            }
          } else {
            console.log('No feedback found in direct query or feedback is null/empty');
          }
        } catch (e) {
          console.error('Error fetching recruiter_candidate record:', e);
        }
      }
      
      // Ensure resume URL is properly set
      const resumeUrl = candidate.resume_url;
      console.log('Resume URL to be returned:', resumeUrl);
      
      // Return the candidate with the relationship data if available
      // Ensure all fields are properly included with explicit fallbacks
      const result = {
        ...candidate,
        skills: skillsArray, // Replace the JSON string with the parsed array
        resumeUrl: resumeUrl, // Ensure resumeUrl is explicitly included
        
        // Add all feedback fields directly to the top level with fallbacks
        companyName: parsedFeedback.companyName || '',
        dateOfBirth: parsedFeedback.dateOfBirth || '',
        clientName: parsedFeedback.clientName || '',
        positionApplied: parsedFeedback.positionApplied || '',
        totalExperience: parsedFeedback.totalExperience || '',
        relevantExperience: parsedFeedback.relevantExperience || '',
        currentOrganization: parsedFeedback.currentOrganization || '',
        currentDesignation: parsedFeedback.currentDesignation || '',
        duration: parsedFeedback.duration || '',
        reasonOfLeaving: parsedFeedback.reasonOfLeaving || '',
        reportingTo: parsedFeedback.reportingTo || '',
        numberOfDirectReportees: parsedFeedback.numberOfDirectReportees || '',
        currentSalary: parsedFeedback.currentSalary || '',
        expectedSalary: parsedFeedback.expectedSalary || '',
        education: parsedFeedback.education || '',
        maritalStatus: parsedFeedback.maritalStatus || 'Select',
        passportAvailable: parsedFeedback.passportAvailable || 'Select',
        currentLocation: parsedFeedback.currentLocation || '',
        medicalIssues: parsedFeedback.medicalIssues || '',
        
        // Also include the original parsed feedback and relationships
        feedbackData: parsedFeedback,
        recruiterCandidate: {
          ...recruiterCandidate,
          feedback: recruiterCandidate?.feedback || null
        },
        profileAllocation: recruiterCandidate?.profileAllocation || null,
      };
      
      // Log the important fields to verify they're being returned
      console.log('Key fields in response:', {
        name: result.name,
        email: result.email,
        companyName: result.companyName,
        dateOfBirth: result.dateOfBirth,
        clientName: result.clientName,
        totalExperience: result.totalExperience,
        currentOrganization: result.currentOrganization
      });
      
      console.log(`Successfully fetched candidate: ${candidate.name}`);
      console.log('Resume URL in response:', result.resumeUrl);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching candidate:', error);
      return res.status(500).json({ error: 'Failed to fetch candidate' });
    }
  }
  
  // PUT - Update candidate details
  else if (req.method === 'PUT') {
    try {
      console.log("Processing PUT request to update candidate:", id);
      
      // Process file upload if there is one
      await runMiddleware(req, res, upload.single('resume'));
      
      // First, check if the candidate exists
      const candidate = await prisma.candidates.findUnique({
        where: { id: id as string },
      });
      
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      
      // Find the recruiter_candidate record
      const recruiterCandidate = await prisma.recruiter_candidates.findFirst({
        where: { candidate_id: id as string },
      });
      
      if (!recruiterCandidate) {
        return res.status(404).json({ error: 'Recruiter-candidate relationship not found' });
      }
      
      // Parse form data
      const {
        fullName,
        email,
        phone,
        companyName,
        dateOfBirth,
        clientName,
        positionApplied,
        totalExperience,
        relevantExperience,
        currentOrganization,
        currentDesignation,
        duration,
        reasonOfLeaving,
        reportingTo,
        numberOfDirectReportees,
        currentSalary,
        expectedSalary,
        education,
        maritalStatus,
        passportAvailable,
        currentLocation,
        medicalIssues,
        skills,
      } = req.body;
      
      // Process skills (convert comma-separated string to array)
      const skillsArray = skills ? skills.split(',').map((skill: string) => skill.trim()).filter(Boolean) : [];
      
      // Handle resume file upload
      let resumeUrl = candidate.resume_url;
      
      if (req.file) {
        console.log("New resume file uploaded:", req.file);
        // Generate the URL path for the resume
        resumeUrl = `/uploads/${req.file.filename}`;
        console.log("New resume URL:", resumeUrl);
      } else {
        console.log("No new resume file uploaded, keeping existing URL:", resumeUrl);
      }
      
      // Update the candidate in the candidates table
      const updatedCandidate = await prisma.candidates.update({
        where: { id: id as string },
        data: {
          name: fullName,
          email,
          phone,
          skills: JSON.stringify(skillsArray),
          resume_url: resumeUrl,
        },
      });
      
      // Log resume URL for debugging
      console.log('Updated candidate resume_url:', updatedCandidate.resume_url);
      
      // Store additional fields in the recruiter_candidates table as feedback JSON
      const additionalData = {
        companyName,
        dateOfBirth,
        clientName,
        positionApplied,
        totalExperience,
        relevantExperience,
        currentOrganization,
        currentDesignation,
        duration,
        reasonOfLeaving,
        reportingTo,
        numberOfDirectReportees,
        currentSalary,
        expectedSalary,
        education,
        maritalStatus,
        passportAvailable,
        currentLocation,
        medicalIssues,
      };
      
      // Update the recruiter_candidate record with additional data
      const updatedRecruiterCandidate = await prisma.recruiter_candidates.update({
        where: { id: recruiterCandidate.id },
        data: {
          feedback: JSON.stringify(additionalData),
          updated_at: new Date(),
      },
    });

      return res.status(200).json({ 
        message: 'Candidate updated successfully', 
        candidate: {
          ...updatedCandidate,
          resumeUrl: updatedCandidate.resume_url // Add resumeUrl field for consistency
        },
        recruiterCandidate: updatedRecruiterCandidate
      });
    } catch (error) {
      console.error('Error updating candidate:', error);
      return res.status(500).json({ error: 'Failed to update candidate' });
    }
  }
  
  // DELETE - Delete candidate
  else if (req.method === 'DELETE') {
    try {
      // First check if the candidate exists
      const candidate = await prisma.candidates.findUnique({
        where: { id: id as string },
      });
      
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      
      // Find and delete the recruiter_candidate record
      const recruiterCandidate = await prisma.recruiter_candidates.findFirst({
        where: { candidate_id: id as string },
      });
      
      if (recruiterCandidate) {
        await prisma.recruiter_candidates.delete({
          where: { id: recruiterCandidate.id },
        });
      }
      
      // Optionally delete the candidate record if it's not referenced elsewhere
      // This would require additional checks to see if the candidate is referenced by other recruiters
      
      return res.status(200).json({ message: 'Candidate deleted successfully' });
  } catch (error) {
      console.error('Error deleting candidate:', error);
      return res.status(500).json({ error: 'Failed to delete candidate' });
    }
  }
  
  // Method not allowed
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
} 