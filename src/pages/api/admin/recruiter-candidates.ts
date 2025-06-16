import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';
import { executeQuery } from '@/lib/db';

const prisma = new PrismaClient();

// Ensure candidate tables exist
const ensureCandidateTablesExist = async () => {
  try {
    console.log('Ensuring candidate tables exist...');
    
    // Create candidates table with correct schema
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        skills JSONB,
        resume_url VARCHAR(255),
        relevancy_score INTEGER,
        github_url VARCHAR(255),
        linkedin_url VARCHAR(255),
        source VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create recruiter_candidates association table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS recruiter_candidates (
        id VARCHAR(36) PRIMARY KEY,
        recruiter_id VARCHAR(36) NOT NULL,
        candidate_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(recruiter_id, candidate_id)
      )
    `);
    
    return true;
  } catch (error) {
    console.error('Error ensuring candidate tables exist:', error);
    return false;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the session to verify the user is authenticated and is an admin
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log('User role:', session.user.role);
    if (session.user.role !== 'admin' && session.user.role !== 'superadmin' && session.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized. Only admins can access this endpoint.' });
    }

    // Ensure tables exist before proceeding
    await ensureCandidateTablesExist();

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return getRecruiterCandidates(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin/recruiter-candidates API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all candidates added by recruiters
 */
async function getRecruiterCandidates(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { recruiterId } = req.query;

    // Check if the recruiter_candidates table exists
    const tableExists = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recruiter_candidates'
      )
    `);

    if (!tableExists[0].exists) {
      // If table doesn't exist yet, return empty array
      return res.status(200).json([]);
    }

    // Build the query based on whether a specific recruiter is requested
    let query = `
      SELECT c.*, rc.recruiter_id, u.name as recruiter_name, u.email as recruiter_email
      FROM candidates c
      JOIN recruiter_candidates rc ON c.id = rc.candidate_id
      JOIN users u ON rc.recruiter_id = u.id
      WHERE c.source = 'recruiter'
    `;
    
    const queryParams = [];
    
    if (recruiterId && typeof recruiterId === 'string') {
      query += " AND rc.recruiter_id = $1";
      queryParams.push(recruiterId);
    }
    
    query += " ORDER BY rc.created_at DESC";

    // Execute the query
    const candidates = await executeQuery(query, queryParams);

    // Format candidates data for the response
    const formattedCandidates = candidates.map(candidate => {
      // Parse JSON strings if needed
      let skills: string[] = [];
      let experience: any[] = [];
      let education: any[] = [];

      try {
        if (candidate.skills) {
          skills = typeof candidate.skills === 'string' 
            ? JSON.parse(candidate.skills) 
            : candidate.skills;
        }
      } catch (error) {
        console.error('Error parsing candidate skills data:', error);
      }

      return {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || null,
        skills: skills,
        experience: experience,
        education: education,
        resumeUrl: candidate.resume_url || null,
        githubUrl: candidate.github_url || null,
        linkedinUrl: candidate.linkedin_url || null,
        source: 'recruiter',
        createdAt: candidate.created_at,
        recruiterId: candidate.recruiter_id,
        recruiterName: candidate.recruiter_name,
        recruiterEmail: candidate.recruiter_email
      };
    });

    return res.status(200).json(formattedCandidates);
  } catch (error) {
    console.error('Error fetching recruiter candidates:', error);
    return res.status(500).json({ error: 'Failed to fetch candidates' });
  }
} 