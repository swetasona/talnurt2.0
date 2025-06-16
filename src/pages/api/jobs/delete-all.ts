import { NextApiRequest, NextApiResponse } from 'next';
import { deleteAllJobs } from '@/lib/db-postgres';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get confirmation from query or body
    const confirmed = req.query.confirm === 'true' || req.body?.confirm === true;
    
    if (!confirmed) {
      return res.status(400).json({ 
        error: 'Confirmation required', 
        message: 'Please confirm this destructive operation by adding ?confirm=true to the request' 
      });
    }
    
    // Delete all jobs
    const result = await deleteAllJobs();
    
    return res.status(200).json({
      message: `Successfully deleted ${result.count} jobs`,
      count: result.count,
      mock: result.mock
    });
  } catch (error: any) {
    console.error('Error deleting all jobs:', error);
    return res.status(500).json({ 
      error: 'Failed to delete all jobs', 
      message: error.message || 'An unexpected error occurred'
    });
  }
} 