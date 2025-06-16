import { NextApiRequest, NextApiResponse } from 'next';
import { getJobs, createJob } from '@/lib/db-postgres';

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
        
        // Fetch all jobs
        console.log(`API: Fetching jobs for ${isAdminPage ? 'admin' : 'public'} page`);
        const allJobs = await getJobs();
        
        // If request is from public page, filter out non-open jobs
        const jobs = isAdminPage 
          ? allJobs 
          : allJobs.filter(job => job.status?.toLowerCase() === 'open');
        
        console.log(`API: Retrieved ${jobs.length} jobs (${allJobs.length - jobs.length} filtered out)`);
        return res.status(200).json(jobs);
        
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