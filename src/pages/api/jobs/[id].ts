import { NextApiRequest, NextApiResponse } from 'next';
import { getJobById, updateJob, deleteJob } from '@/lib/db-postgres';
import prisma from '@/lib/db-connection-manager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid job ID' });
  }
  
  try {
    switch (req.method) {
      case 'GET':
        try {
          // Get job by ID using Prisma
          const job = await prisma.job_postings.findUnique({
            where: { id },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                }
              }
            }
          });
          
          if (!job) {
            return res.status(404).json({ error: 'Job not found' });
          }
          
          // Format job for frontend
          // Parse requirements if it's stored as JSON string
          let requirements = [];
          if (job.requirements) {
            if (typeof job.requirements === 'string') {
              try {
                const parsed = JSON.parse(job.requirements);
                requirements = Array.isArray(parsed) ? parsed : [parsed];
              } catch (err) {
                requirements = job.requirements
                  .split(/[,\n\r]+/)
                  .map((req: string) => req.trim())
                  .filter((req: string) => req.length > 0);
              }
            } else if (Array.isArray(job.requirements)) {
              requirements = job.requirements;
            }
          }
          
          // Parse skills if it's stored as JSON string
          let skills = [];
          if (job.skills) {
            if (typeof job.skills === 'string') {
              try {
                const parsed = JSON.parse(job.skills);
                skills = Array.isArray(parsed) ? parsed : [parsed];
              } catch (err) {
                skills = job.skills
                  .split(/[,\n\r]+/)
                  .map((skill: string) => skill.trim())
                  .filter((skill: string) => skill.length > 0);
              }
            } else if (Array.isArray(job.skills)) {
              skills = job.skills;
            }
          }
          
          const formattedJob = {
            id: job.id,
            title: job.title,
            company: job.company || '',
            department: job.department || '',
            location: job.location,
            jobType: job.job_type || 'full-time',
            workMode: job.work_mode || 'on-site',
            experience: job.experience || '',
            industry: job.industry || '',
            description: job.description,
            summary: job.summary || '',
            responsibilities: job.responsibilities || '',
            requirements: requirements,
            skills: skills,
            salary: job.salary || '',
            currency: job.currency || 'USD',
            benefits: job.benefits || '',
            postedDate: job.posted_date ? new Date(job.posted_date).toISOString() : new Date().toISOString(),
            deadline: job.deadline ? new Date(job.deadline).toISOString() : null,
            applicationEmail: job.application_email || '',
            applicationUrl: job.application_url || '',
            contactPerson: job.contact_person || '',
            status: job.status || 'open',
            isInternalOnly: job.is_internal_only || false,
            isFeatured: job.is_featured || false,
            postedBy: job.posted_by,
            postedByName: job.user?.name || 'Unknown',
            postedByRole: job.user?.role || 'unknown',
            applications: [] // Applications will be handled separately if needed
          };
          
          return res.status(200).json(formattedJob);
        } catch (error: any) {
          console.error(`Error fetching job ID ${id}:`, error);
          throw new Error(`Failed to fetch job: ${error.message}`);
        }
        
      case 'PUT':
        // Update job
        const updatedJobData = req.body;
        const updatedJob = await updateJob(id, updatedJobData);
        return res.status(200).json(updatedJob);
        
      case 'DELETE':
        // Delete job
        await deleteJob(id);
        return res.status(204).end();
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error(`Error processing job ID ${id}:`, error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
} 