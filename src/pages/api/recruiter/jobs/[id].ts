import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the session to verify the user is authenticated and is a recruiter
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (session.user.role !== 'recruiter') {
      return res.status(403).json({ error: 'Not authorized. Only recruiters can access this endpoint.' });
    }

    const { id } = req.query;
    const recruiterId = session.user.id;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    // Verify the job belongs to this recruiter
    const existingJob = await prisma.job_postings.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existingJob.posted_by !== recruiterId) {
      return res.status(403).json({ error: 'Not authorized to access this job' });
    }

    switch (req.method) {
      case 'GET':
        // Get individual job
        const formattedJob = {
          id: existingJob.id,
          title: existingJob.title,
          description: existingJob.description || '',
          requirements: existingJob.requirements ? JSON.parse(existingJob.requirements as string) : [],
          location: existingJob.location || '',
          salary: existingJob.salary,
          company: existingJob.company,
          department: existingJob.department,
          jobType: existingJob.job_type || 'full-time',
          workMode: existingJob.work_mode || 'on-site',
          experience: existingJob.experience,
          industry: existingJob.industry,
          currency: existingJob.currency || 'USD',
          benefits: existingJob.benefits,
          summary: existingJob.summary,
          responsibilities: existingJob.responsibilities,
          skills: existingJob.skills ? JSON.parse(existingJob.skills as string) : [],
          deadline: existingJob.deadline,
          applicationEmail: existingJob.application_email,
          applicationUrl: existingJob.application_url,
          contactPerson: existingJob.contact_person,
          status: existingJob.status || 'open',
          isInternalOnly: existingJob.is_internal_only || false,
          isFeatured: existingJob.is_featured || false,
          postedDate: existingJob.posted_date,
          postedBy: existingJob.posted_by,
          createdAt: existingJob.created_at,
          updatedAt: existingJob.updated_at,
          applications: [], // TODO: Add applications data
        };
        
        return res.status(200).json(formattedJob);

      case 'PUT':
        // Update job
        const jobData = req.body;

        // Validate required fields
        if (!jobData.title || !jobData.description || !jobData.location) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Prepare updated job data
        const requirements = Array.isArray(jobData.requirements) 
          ? jobData.requirements 
          : [];
        
        const skills = Array.isArray(jobData.skills) 
          ? jobData.skills 
          : [];

        const updatedJob = await prisma.job_postings.update({
          where: { id },
          data: {
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
            updated_at: new Date(),
          },
        });

        // Format the response
        const formattedUpdatedJob = {
          id: updatedJob.id,
          title: updatedJob.title,
          description: updatedJob.description,
          requirements: requirements,
          location: updatedJob.location,
          salary: updatedJob.salary,
          company: updatedJob.company,
          department: updatedJob.department,
          jobType: updatedJob.job_type,
          workMode: updatedJob.work_mode,
          experience: updatedJob.experience,
          industry: updatedJob.industry,
          currency: updatedJob.currency,
          benefits: updatedJob.benefits,
          summary: updatedJob.summary,
          responsibilities: updatedJob.responsibilities,
          skills: skills,
          deadline: updatedJob.deadline,
          applicationEmail: updatedJob.application_email,
          applicationUrl: updatedJob.application_url,
          contactPerson: updatedJob.contact_person,
          status: updatedJob.status,
          isInternalOnly: updatedJob.is_internal_only,
          isFeatured: updatedJob.is_featured,
          postedDate: updatedJob.posted_date,
          postedBy: updatedJob.posted_by,
          createdAt: updatedJob.created_at,
          updatedAt: updatedJob.updated_at,
        };

        return res.status(200).json(formattedUpdatedJob);

      case 'DELETE':
        // Delete job
        await prisma.job_postings.delete({
          where: { id },
        });

        return res.status(200).json({ message: 'Job deleted successfully' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in recruiter job API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 