import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
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

// Initialize tables if they don't exist
const initializeTables = async () => {
  try {
    // Create job_applications table if it doesn't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id VARCHAR(36) PRIMARY KEY,
        job_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        resume_url VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        applied_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        job_title VARCHAR(255) NOT NULL,
        skills TEXT[],
        experience TEXT,
        education TEXT,
        cover_letter TEXT
      )
    `);
    return true;
  } catch (error) {
    console.error('Error initializing job_applications table:', error);
    return false;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        await initializeTables();
        const applications = await executeQuery(`
          SELECT 
            ja.*,
            j.title as job_title
          FROM job_applications ja
          LEFT JOIN jobs j ON ja.job_id = j.id
          ORDER BY ja.applied_date DESC
        `);
        return res.status(200).json(applications);
        
      case 'POST':
        // Initialize tables
        await initializeTables();
        
        // Create a new application
        const applicationData = req.body;
        
        // Validate required fields
        if (!applicationData.jobId || !applicationData.name || !applicationData.email || !applicationData.resumeUrl) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Check if the job exists and get its status
        try {
          const jobCheck = await executeQuery(`
            SELECT * FROM job_postings WHERE id = $1
          `, [applicationData.jobId]);
          
          if (!jobCheck || jobCheck.length === 0) {
            return res.status(404).json({ 
              error: 'Job not found', 
              message: 'The job you are trying to apply for does not exist'
            });
          }
          
          // Check if job is closed or draft
          const jobStatus = jobCheck[0].status?.toLowerCase();
          if (jobStatus === 'closed' || jobStatus === 'draft') {
            return res.status(403).json({ 
              error: 'Job not available',
              message: 'This position is no longer accepting applications' 
            });
          }
        } catch (err) {
          console.error('Error checking job status:', err);
          // If we can't verify the job status (e.g., table doesn't exist yet), continue with application
          console.log('Continuing without job status verification');
        }
        
        // Generate ID if not provided
        const id = applicationData.id || uuidv4();
        
        // Insert into database
        const query = `
          INSERT INTO job_applications (
            id, job_id, name, email, phone, 
            resume_url, status, applied_date, created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
          RETURNING *
        `;
        
        const params = [
          id,
          applicationData.jobId,
          applicationData.name,
          applicationData.email,
          applicationData.phone || null,
          applicationData.resumeUrl,
          applicationData.status || 'pending',
          applicationData.appliedDate ? new Date(applicationData.appliedDate) : new Date(),
        ];
        
        const result = await executeQuery(query, params);
        const application = result[0];
        
        return res.status(201).json({
          id: application.id,
          jobId: application.job_id,
          name: application.name,
          email: application.email,
          phone: application.phone,
          resumeUrl: application.resume_url,
          status: application.status,
          appliedDate: application.applied_date,
        });
      case 'DELETE':
        const { id: deleteId } = req.body;
        console.log('Received withdrawal request for ID:', deleteId);
        
        if (!deleteId) {
          console.error('Missing application ID in request body');
          return res.status(400).json({ error: 'Missing application id' });
        }
        
        await initializeTables();
        
        // Check which tables exist in the database
        const tableCheckResult = await executeQuery(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name LIKE '%application%'
        `);
        
        console.log('Available application tables:', tableCheckResult);
        
        // First check if the application exists in job_applications table
        const existingApp = await executeQuery(
          'SELECT * FROM job_applications WHERE id = $1',
          [deleteId]
        );
        
        if (!existingApp || existingApp.length === 0) {
          console.error('No application found in job_applications with ID:', deleteId);
          
          // Try looking in the applications table as fallback
          try {
            const alternateApp = await executeQuery(
              'SELECT * FROM applications WHERE id = $1',
              [deleteId]
            );
            
            if (!alternateApp || alternateApp.length === 0) {
              console.error('No application found in applications table either with ID:', deleteId);
              return res.status(404).json({ error: 'Application not found' });
            }
            
            // Delete from applications table instead
            await executeQuery(
              'DELETE FROM applications WHERE id = $1 RETURNING *',
              [deleteId]
            );
            
            return res.status(200).json({ 
              success: true, 
              message: 'Application withdrawn successfully',
              deletedId: deleteId,
              table: 'applications'
            });
          } catch (err) {
            console.error('Error when trying alternate table:', err);
            return res.status(404).json({ error: 'Application not found in any table' });
          }
        }
        
        // Then delete it from job_applications table
        const deleteResult = await executeQuery(
          'DELETE FROM job_applications WHERE id = $1 RETURNING *',
          [deleteId]
        );
        
        return res.status(200).json({ 
          success: true, 
          message: 'Application withdrawn successfully',
          deletedId: deleteId,
          table: 'job_applications'
        });
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in job applications API:', error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
} 