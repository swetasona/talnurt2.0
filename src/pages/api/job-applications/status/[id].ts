import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345678',
  port: 5432,
});

// Wrap query execution in a helper function
const executeQuery = async (query: string, params?: any[]) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { status } = req.body;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid application ID' });
  }
  
  if (!status || !['pending', 'reviewed', 'interviewed', 'offered', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  
  try {
    // Update the application status
    const query = `
      UPDATE job_applications 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `;
    
    const result = await executeQuery(query, [status, id]);
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const updatedApplication = result[0];
    
    // Format the application response
    const formattedApplication = {
      id: updatedApplication.id,
      jobId: updatedApplication.job_id,
      name: updatedApplication.name,
      email: updatedApplication.email,
      phone: updatedApplication.phone,
      resumeUrl: updatedApplication.resume_url,
      status: updatedApplication.status,
      appliedDate: updatedApplication.applied_date ? new Date(updatedApplication.applied_date).toISOString().split('T')[0] : null,
    };
    
    return res.status(200).json(formattedApplication);
  } catch (error: any) {
    console.error(`Error updating application status for ${id}:`, error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
} 