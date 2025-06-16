import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { canPostJobs } from '@/utils/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First check for admin JWT token
    const adminToken = req.cookies['admin-token'];
    let adminId = '';
    let adminRole = '';
    let isAdmin = false;
    
    if (adminToken) {
      try {
        // Verify the admin token
        const decoded = jwt.verify(adminToken, JWT_SECRET) as any;
        console.log('Decoded admin token:', decoded);
        
        if (decoded && typeof decoded === 'object' && 
            (decoded.role === 'admin' || decoded.role === 'employer' || decoded.role === 'super_admin')) {
          isAdmin = true;
          adminId = decoded.userId; // Use the correct field name from the JWT
          adminRole = decoded.role;
          console.log('Admin authenticated:', { adminId, adminRole });
        }
      } catch (error) {
        console.error('Invalid admin token:', error);
      }
    }
    
    // If not authenticated as admin via JWT, check NextAuth session
    if (!isAdmin) {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Check if user has permission to post jobs
      if (!canPostJobs(session.user.role)) {
        return res.status(403).json({ error: 'Not authorized. Only admins and recruiters can post jobs.' });
      }
      
      adminId = session.user.id;
      adminRole = session.user.role;
    }

    // Validate that we have an admin ID
    if (!adminId) {
      console.error('Admin ID is missing after authentication');
      return res.status(401).json({ error: 'Authentication failed - missing user ID' });
    }

    console.log('Final admin credentials:', { adminId, adminRole });

    const jobData = req.body;

    // Validate required fields
    if (!jobData.title || !jobData.description || !jobData.location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prepare job data
    const jobId = uuidv4();
    const now = new Date();
    
    // Ensure requirements is an array
    const requirements = Array.isArray(jobData.requirements) 
      ? jobData.requirements 
      : [];
    
    // Ensure skills is an array
    const skills = Array.isArray(jobData.skills) 
      ? jobData.skills 
      : [];
    
    // Create job in database
    const newJob = await prisma.job_postings.create({
      data: {
        id: jobId,
        title: jobData.title,
        description: jobData.description,
        requirements: JSON.stringify(requirements),
        location: jobData.location,
        salary: jobData.salary || null,
        company: jobData.company || null,
        department: jobData.department || null,
        job_type: jobData.jobType || 'full-time',
        work_mode: jobData.workMode || 'on-site',
        experience: jobData.experience || null,
        industry: jobData.industry || null,
        currency: jobData.currency || 'USD',
        benefits: jobData.benefits || null,
        summary: jobData.summary || null,
        responsibilities: jobData.responsibilities || null,
        skills: JSON.stringify(skills),
        deadline: jobData.deadline ? new Date(jobData.deadline) : null,
        application_email: jobData.applicationEmail || null,
        application_url: jobData.applicationUrl || null,
        contact_person: jobData.contactPerson || null,
        status: jobData.status || 'open',
        is_internal_only: jobData.isInternalOnly === true,
        is_featured: jobData.isFeatured === true,
        posted_date: now,
        posted_by: adminId,
        posted_by_role: adminRole,
        created_at: now,
        updated_at: now,
      },
    });

    // Format the response
    const formattedJob = {
      id: newJob.id,
      title: newJob.title,
      description: newJob.description,
      requirements: requirements,
      location: newJob.location,
      salary: newJob.salary,
      company: newJob.company,
      department: newJob.department,
      jobType: newJob.job_type,
      workMode: newJob.work_mode,
      experience: newJob.experience,
      industry: newJob.industry,
      currency: newJob.currency,
      benefits: newJob.benefits,
      summary: newJob.summary,
      responsibilities: newJob.responsibilities,
      skills: skills,
      deadline: newJob.deadline,
      applicationEmail: newJob.application_email,
      applicationUrl: newJob.application_url,
      contactPerson: newJob.contact_person,
      status: newJob.status,
      isInternalOnly: newJob.is_internal_only,
      isFeatured: newJob.is_featured,
      postedDate: newJob.posted_date,
      postedBy: newJob.posted_by,
      postedByRole: newJob.posted_by_role,
      createdAt: newJob.created_at,
      updatedAt: newJob.updated_at,
    };

    return res.status(201).json(formattedJob);
  } catch (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 