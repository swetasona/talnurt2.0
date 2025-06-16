import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { canPostJobs } from '@/utils/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session to verify the user is authenticated and is a recruiter
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user has permission to post jobs
    if (!canPostJobs(session.user.role)) {
      return res.status(403).json({ error: 'Not authorized. Only authorized users can post jobs.' });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const userName = session.user.name || 'Unknown User';
    const userCompany = session.user.company || null;
    // For managers, get their team ID (in a real app)
    // const userTeamId = await getUserTeamId(userId);
    
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
        company: userCompany || jobData.company || null,
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
        posted_by: userId,
        posted_by_role: userRole,
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
      postedByName: userName,
      createdAt: newJob.created_at,
      updatedAt: newJob.updated_at,
    };

    return res.status(201).json(formattedJob);
  } catch (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 