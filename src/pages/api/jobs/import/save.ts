import { NextApiRequest, NextApiResponse } from 'next';
import { createJob } from '@/lib/db-postgres';
import { JobPosting } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

// Get admin user from token or find super_admin in database
const getAdminUser = async (req: NextApiRequest): Promise<{id: string, role: string}> => {
  try {
    // First check for admin token in cookies
    const adminToken = req.cookies['admin-token'];
    
    if (adminToken) {
      try {
        // Verify the admin token
        const decoded = jwt.verify(adminToken, JWT_SECRET) as any;
        
        if (decoded && typeof decoded === 'object' && 
            (decoded.role === 'admin' || decoded.role === 'super_admin')) {
          console.log('Using logged-in admin for job import:', decoded.userId, decoded.role);
          return { id: decoded.userId, role: decoded.role };
        }
      } catch (error) {
        console.error('Invalid admin token:', error);
      }
    }
    
    // If no valid token, look for super_admin in database
    const superAdmins = await executeQuery(`
      SELECT id, role FROM users WHERE role = 'super_admin' LIMIT 1
    `);
    
    if (superAdmins && superAdmins.length > 0) {
      console.log('Using super_admin from database:', superAdmins[0].id);
      return { id: superAdmins[0].id, role: 'super_admin' };
    }
    
    // If no super_admin, look for admin
    const admins = await executeQuery(`
      SELECT id, role FROM users WHERE role = 'admin' LIMIT 1
    `);
    
    if (admins && admins.length > 0) {
      console.log('Using admin from database:', admins[0].id);
      return { id: admins[0].id, role: 'admin' };
    }
    
    // If no admin found, create one
    const adminId = uuidv4();
    const now = new Date();
    
    await executeQuery(`
      INSERT INTO users (id, name, email, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      adminId,
      'Admin User',
      'admin@talnurt.com',
      null, // No password for auto-created admin
      'super_admin', // Create as super_admin instead of admin
      now,
      now
    ]);
    
    console.log('Created default super_admin user with ID:', adminId);
    return { id: adminId, role: 'super_admin' };
  } catch (error) {
    console.error('Error getting admin user:', error);
    throw error;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobs } = req.body as { jobs: JobPosting[] };
    
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ error: 'No valid job data provided' });
    }
    
    console.log(`Saving ${jobs.length} jobs to database`);

    // Get admin user for job posting
    const admin = await getAdminUser(req);
    
    // Create all jobs
    const createdJobs = [];
    
    for (const job of jobs) {
      // Format the job data for createJob function
      const jobData = {
        id: job.id,
        title: job.title,
        description: job.description || '',
        requirements: Array.isArray(job.requirements) ? job.requirements : [],
        location: job.location || '',
        salary: job.salary || '',
        postedDate: job.postedDate || new Date().toISOString().split('T')[0],
        postedBy: admin.id,
        postedByRole: admin.role,
        // Additional fields not in the core schema but part of our JobPosting type
        company: job.company || '',
        department: job.department || '',
        jobType: job.jobType || 'full-time',
        workMode: job.workMode || 'on-site',
        experience: job.experience || '',
        industry: job.industry || '',
        summary: job.summary || '',
        responsibilities: job.responsibilities || '',
        skills: Array.isArray(job.skills) ? job.skills : [],
        currency: job.currency || 'USD',
        benefits: job.benefits || '',
        deadline: job.deadline || '',
        applicationEmail: job.applicationEmail || '',
        applicationUrl: job.applicationUrl || '',
        contactPerson: job.contactPerson || '',
        status: job.status || 'open',
        isInternalOnly: job.isInternalOnly || false,
        isFeatured: job.isFeatured || false,
      };
      
      // Create the job in the database using the existing function
      const createdJob = await createJob(jobData);
      createdJobs.push(createdJob);
    }
    
    return res.status(200).json({
      message: 'Jobs imported successfully',
      count: createdJobs.length,
      jobs: createdJobs,
    });
  } catch (error: any) {
    console.error('Error saving imported jobs:', error);
    return res.status(500).json({
      error: 'Failed to save imported jobs',
      message: error.message || 'An unexpected error occurred',
    });
  }
} 