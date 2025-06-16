import { NextApiRequest, NextApiResponse } from 'next';
import { deleteAllCandidates } from '@/lib/db-postgres';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call the utility function to delete all candidates
    await deleteAllCandidates();
    
    // Return success
    return res.status(200).json({ message: 'All candidates deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting all candidates:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete all candidates' });
  }
} 