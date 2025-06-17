import { NextApiRequest, NextApiResponse } from 'next';
import { getJobs, createJob } from '@/lib/db-postgres';
import prisma from '@/lib/db-connection-manager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        // Get the page origin to determine if request is from admin or public page
        const { referer } = req.headers;
        const isAdminPage = referer && referer.includes('/admin/');
        
        console.log(`API: Fetching jobs for ${isAdminPage ? 'admin' : 'public'} page`);
        
        try {
          // Use Prisma instead of direct PostgreSQL connection
          const allJobs = await prisma.job_postings.findMany({
            orderBy: {
              created_at: 'desc'
            },
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
          
          // Format jobs for frontend
          const formattedJobs = allJobs.map((job: any) => {
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
            
            return {
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
          });
          
          // If request is from public page, filter out non-open jobs
          const jobs = isAdminPage 
            ? formattedJobs 
            : formattedJobs.filter(job => job.status?.toLowerCase() === 'open');
          
          console.log(`API: Retrieved ${jobs.length} jobs (${formattedJobs.length - jobs.length} filtered out)`);
          return res.status(200).json(jobs);
        } catch (error: any) {
          console.error('Database error fetching jobs:', error);
          throw new Error(`Failed to fetch jobs: ${error.message}`);
        }
        
      case 'POST':
        // Create a new job
        console.log('API: Creating new job with data:', req.body);
        const jobData = req.body;
        
        // Ensure all required fields are present
        if (!jobData.title || !jobData.description || !jobData.location || !jobData.postedBy) {
          console.error('API: Missing required fields in job data');
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Create job in database
        const job = await createJob(jobData);
        console.log('API: Job created successfully:', job);
        return res.status(201).json(job);
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in jobs API:', error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
} 