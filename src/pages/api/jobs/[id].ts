import { NextApiRequest, NextApiResponse } from 'next';
import { getJobById, updateJob, deleteJob } from '@/lib/db-postgres';

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
        // Get job by ID
        const job = await getJobById(id);
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }
        return res.status(200).json(job);
        
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