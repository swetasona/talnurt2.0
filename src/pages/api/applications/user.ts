import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { executeQuery } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getSession({ req });
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure applications table exists
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        job_id VARCHAR(36) NOT NULL REFERENCES job_postings(id),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        applied_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all applications for this user with job details
    const applications = await executeQuery(`
      SELECT a.id, a.job_id as "jobId", a.status, a.applied_on as "appliedDate",
             j.title as "jobTitle", j.location, j.posted_by as "postedBy"
      FROM applications a
      JOIN job_postings j ON a.job_id = j.id
      WHERE a.user_id = $1
      ORDER BY a.applied_on DESC
    `, [session.user.id]);

    // Enhance with company information where available
    const enhancedApplications = await Promise.all(
      applications.map(async (app) => {
        // Try to get the company name from the user who posted the job
        if (app.postedBy) {
          const posters = await executeQuery(
            'SELECT name FROM users WHERE id = $1',
            [app.postedBy]
          );
          
          if (posters.length > 0) {
            return {
              ...app,
              company: posters[0].name,
            };
          }
        }
        return app;
      })
    );

    return res.status(200).json(enhancedApplications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
} 