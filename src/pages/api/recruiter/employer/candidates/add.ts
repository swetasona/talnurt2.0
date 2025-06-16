import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * This API handles candidate submissions from employees for profile allocations
 */

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let prisma;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get a database connection
    prisma = await getConnection();

    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      releaseConnection();
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user is authorized (employee, manager, or employer)
    if (!['employee', 'manager', 'employer'].includes(session.user.role)) {
      releaseConnection();
      return res.status(403).json({ error: 'Access denied. You do not have permission to access this resource.' });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Parse form data with updated configuration
    const form = new formidable.IncomingForm({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: true,
    });

    // Parse the form data
    const [fields, files] = await new Promise<[formidable.Fields<string>, formidable.Files<string>]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Form parsing error:", err);
          reject(err);
        }
        resolve([fields, files]);
      });
    });

    // Debug log the received form data
    console.log("Received form fields:", JSON.stringify(fields, null, 2));
    console.log("Received files:", Object.keys(files));

    // Extract form data - handle potential array values from formidable
    const getName = (field: string | string[] | undefined): string => {
      if (Array.isArray(field)) return field[0] || '';
      return field || '';
    };

    // Extract all form fields
    const fullName = getName(fields.fullName);
    const email = getName(fields.email);
    const phone = getName(fields.phone);
    const profileAllocationId = getName(fields.profileAllocationId);
    
    // Additional fields for feedback JSON
    const companyName = getName(fields.companyName);
    const dateOfBirth = getName(fields.dateOfBirth);
    const clientName = getName(fields.clientName);
    const positionApplied = getName(fields.positionApplied);
    const totalExperience = getName(fields.totalExperience);
    const relevantExperience = getName(fields.relevantExperience);
    const currentOrganization = getName(fields.currentOrganization);
    const currentDesignation = getName(fields.currentDesignation);
    const duration = getName(fields.duration);
    const reasonOfLeaving = getName(fields.reasonOfLeaving);
    const reportingTo = getName(fields.reportingTo);
    const numberOfDirectReportees = getName(fields.numberOfDirectReportees);
    const currentSalary = getName(fields.currentSalary);
    const expectedSalary = getName(fields.expectedSalary);
    const education = getName(fields.education);
    const maritalStatus = getName(fields.maritalStatus);
    const passportAvailable = getName(fields.passportAvailable);
    const currentLocation = getName(fields.currentLocation);
    const medicalIssues = getName(fields.medicalIssues);

    // Debug log the extracted critical fields
    console.log("Critical fields extracted:", { fullName, email, profileAllocationId });

    // Validate required fields
    if (!fullName || !email || !profileAllocationId) {
      console.log("Validation failed - Missing required fields");
      releaseConnection();
      return res.status(400).json({ error: 'Name, email, and profile allocation ID are required' });
    }

    // Check if the profile allocation exists
    const allocation = await prisma.profileAllocation.findUnique({
      where: { id: profileAllocationId }
    });

    if (!allocation) {
      console.log(`Profile allocation not found: ${profileAllocationId}`);
      releaseConnection();
      return res.status(404).json({ error: 'Profile allocation not found' });
    }

    // Process resume file
    let resumePath = null;
    const resumeFile = files.resume;
    console.log("Resume file in request:", resumeFile ? "Yes" : "No");
    console.log("Files received:", Object.keys(files));
    
    if (resumeFile && !Array.isArray(resumeFile)) {
      try {
        // Get the file from formidable
        const file = resumeFile as formidable.File;
        console.log("Resume file details from formidable:", {
          originalFilename: file.originalFilename,
          size: file.size,
          filepath: file.filepath,
          mimetype: file.mimetype
        });
        
        // Generate a unique filename
        const fileExt = path.extname(file.originalFilename || '');
        const fileName = `${uuidv4()}${fileExt}`;
        const finalPath = path.join(uploadsDir, fileName);

        console.log("Resume file details:", {
          originalName: file.originalFilename,
          tempPath: file.filepath,
          finalPath,
          fileExt
        });

        // Move the file to the uploads directory
        fs.copyFileSync(file.filepath, finalPath);
        fs.unlinkSync(file.filepath); // Remove the temp file

        // Store the relative path - make sure it starts with /uploads/
        resumePath = `/uploads/${fileName}`;
        console.log(`Resume uploaded successfully to: ${resumePath}`);
      } catch (error) {
        console.error("Error handling resume file:", error);
      }
    } else if (resumeFile) {
      console.error("Resume file is an array, which is not expected:", resumeFile);
    } else {
      console.log("No resume file found in the request");
    }
    
    // Log the resume path for debugging
    console.log("Final resume path to be stored:", resumePath);

    // Generate a unique ID for the candidate
    const candidateId = uuidv4();

    // Create the candidate
    const candidate = await prisma.candidates.create({
      data: {
        id: candidateId,
        name: fullName,
        email,
        phone: phone || null,
        skills: JSON.stringify([]), // Empty skills array as default
        resume_url: resumePath,
        source: 'employee',
        user_id: null, // Not directly associated with a user
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log(`Candidate created with ID: ${candidate.id}`);
    console.log(`Resume URL saved: ${candidate.resume_url}`);

    // Prepare additional data for feedback JSON
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

    // Create the association in the recruiter_candidates table with profile allocation ID and feedback data
    await prisma.recruiter_candidates.create({
      data: {
        id: uuidv4(),
        recruiter_id: session.user.id,
        candidate_id: candidate.id,
        profile_allocation_id: profileAllocationId,
        feedback: JSON.stringify(additionalData),
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log(`Recruiter-candidate association created for profile allocation: ${profileAllocationId}`);

    // Create experience record if provided
    if (totalExperience) {
      await prisma.experience.create({
        data: {
          id: uuidv4(),
          candidate_id: candidate.id,
          company: currentOrganization || 'Previous Company', // Use current organization if available
          title: currentDesignation || totalExperience, // Use current designation if available
          start_date: null,
          end_date: null,
          description: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log(`Experience record created for candidate: ${candidate.id}`);
    }

    // Create education record if provided
    if (education) {
      await prisma.education.create({
        data: {
          id: uuidv4(),
          candidate_id: candidate.id,
          institution: education,
          degree: 'Not specified', // Default value
          field: null,
          start_date: null,
          end_date: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log(`Education record created for candidate: ${candidate.id}`);
    }

    releaseConnection();
    return res.status(201).json({ 
      success: true, 
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        profileAllocationId: profileAllocationId
      } 
    });
  } catch (error) {
    console.error('Error adding candidate:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 