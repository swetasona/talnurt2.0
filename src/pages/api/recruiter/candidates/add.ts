import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '../../auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    const name = getName(fields.name);
    const email = getName(fields.email);
    const phone = getName(fields.phone);
    const experience = getName(fields.totalExperience) || getName(fields.experience);
    const education = getName(fields.education);
    const skillsRaw = getName(fields.skills);
    const profileAllocationId = getName(fields.profileAllocationId);

    // Debug log the extracted critical fields
    console.log("Critical fields extracted:", { name, email, profileAllocationId });

    // Validate required fields
    if (!name || !email || !profileAllocationId) {
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

    // Process skills
    let skills: string[] = [];
    if (skillsRaw) {
      skills = skillsRaw.split(',').map((skill: string) => skill.trim()).filter(Boolean);
    }

    // Process resume file
    let resumePath = null;
    const resumeFile = files.resume;
    if (resumeFile && !Array.isArray(resumeFile) && 'filepath' in resumeFile) {
      // Generate a unique filename
      const fileExt = path.extname(resumeFile.originalFilename?.toString() || '');
      const fileName = `${uuidv4()}${fileExt}`;
      const finalPath = path.join(uploadsDir, fileName);

      // Move the file to the uploads directory
      fs.copyFileSync(resumeFile.filepath as string, finalPath);
      fs.unlinkSync(resumeFile.filepath as string); // Remove the temp file

      // Store the relative path
      resumePath = `/uploads/${fileName}`;
      console.log(`Resume uploaded to: ${resumePath}`);
    }

    // Generate a unique ID for the candidate
    const candidateId = uuidv4();

    // Create the candidate
    const candidate = await prisma.candidates.create({
      data: {
        id: candidateId,
        name,
        email,
        phone: phone || null,
        skills: JSON.stringify(skills),
        resume_url: resumePath,
        source: 'manual',
        user_id: null, // Not directly associated with a user
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log(`Candidate created with ID: ${candidate.id}`);

    // Create the association in the recruiter_candidates table with profile allocation ID
    await prisma.$executeRaw`
      INSERT INTO recruiter_candidates (id, recruiter_id, candidate_id, profile_allocation_id, created_at, updated_at)
      VALUES (${uuidv4()}, ${session.user.id}, ${candidate.id}, ${profileAllocationId}, NOW(), NOW())
    `;

    console.log(`Recruiter-candidate association created for profile allocation: ${profileAllocationId}`);

    // Create experience record if provided
    if (experience) {
      await prisma.experience.create({
        data: {
          id: uuidv4(),
          candidate_id: candidate.id,
          company: 'Previous Company', // Default value
          title: experience,
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