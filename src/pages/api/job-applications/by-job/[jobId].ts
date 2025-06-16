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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.query;
  
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Invalid job ID' });
  }
  
  try {
    // Check if tables exist first
    const tableChecks = await executeQuery(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_applications') as job_applications_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') as applications_exists
    `);
    
    console.log('Table check results:', tableChecks[0]);
    
    const jobApplicationsExist = tableChecks[0].job_applications_exists;
    const applicationsExist = tableChecks[0].applications_exists;
    
    let applications: any[] = [];
    
    // Check job_applications table if it exists
    if (jobApplicationsExist) {
      const jobApps = await executeQuery(
        `SELECT * FROM job_applications WHERE job_id = $1 ORDER BY applied_date DESC`,
        [jobId]
      );
      
      applications = applications.concat(jobApps);
    }
    
    // Also check applications table if it exists
    if (applicationsExist) {
      try {
        // First check if the necessary columns exist in the applications table
        const columnCheck = await executeQuery(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'applications' AND column_name IN ('id', 'job_id', 'user_id', 'status', 'applied_on')
        `);
        
        // Check if user_profiles table has the necessary columns
        const profileColumnCheck = await executeQuery(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'user_profiles' AND column_name IN ('user_id', 'phone_number', 'resume_file_url')
        `);
        
        // Only proceed if we have the required columns
        if (columnCheck.length >= 5) {
          // Build query safely based on available columns
          const query = `
            SELECT 
              a.id, a.job_id, u.name, u.email,
              ${profileColumnCheck.some(col => col.column_name === 'phone_number') ? 'up.phone_number as phone,' : 'NULL as phone,'}
              ${profileColumnCheck.some(col => col.column_name === 'resume_file_url') ? 'up.resume_file_url as resume_url,' : 'NULL as resume_url,'}
              a.status, a.applied_on as applied_date
            FROM applications a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE a.job_id = $1
            ORDER BY a.applied_on DESC
          `;
          
          const apps = await executeQuery(query, [jobId]);
          applications = applications.concat(apps);
        } else {
          console.log('Applications table exists but missing required columns');
        }
      } catch (err) {
        console.error('Error querying applications:', err);
        // Continue with any applications we may have from job_applications table
      }
    }
    
    // Return empty array if no applications found - don't use mock data
    if (applications.length === 0) {
      console.log(`No applications found for job ${jobId}`);
      return res.status(200).json([]);
    }
    
    // Format applications
    const formattedApplications = applications.map((app: any, index: number) => {
      // Use our resume API for the resumeUrl if not provided
      const resumeUrl = app.resume_url && app.resume_url.length > 0 
        ? app.resume_url 
        : `/api/resume/${app.id || index + 1}`;
        
      return {
        id: app.id,
        jobId: app.job_id,
        name: app.name,
        email: app.email,
        phone: app.phone,
        resumeUrl: resumeUrl,
        status: app.status,
        appliedDate: app.applied_date ? new Date(app.applied_date).toISOString().split('T')[0] : null,
      };
    });
    
    return res.status(200).json(formattedApplications);
  } catch (error: any) {
    // Just return an empty array if there's an error, rather than mock data
    console.error(`Error retrieving applications for job ${jobId}:`, error);
    return res.status(500).json({ error: 'Failed to retrieve applications' });
  }
} 