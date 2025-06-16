import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';
import { executeQuery } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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
    // Get the session to verify the user is authenticated and is a recruiter
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Allow recruiters, employees, managers, and employers to access this endpoint
    const allowedRoles = ['recruiter', 'employee', 'manager', 'employer'];
    if (!allowedRoles.includes(session.user.role)) {
      return res.status(403).json({ error: 'Not authorized. You do not have permission to access this resource.' });
    }

    const recruiterId = session.user.id;

    // Ensure tables exist before proceeding
    await ensureCandidateTablesExist();

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return getRecruiterCandidates(req, res, recruiterId);
      case 'POST':
        return createRecruiterCandidate(req, res, recruiterId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in recruiter/my-talent API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all candidates added by a specific recruiter
 */
async function getRecruiterCandidates(req: NextApiRequest, res: NextApiResponse, recruiterId: string) {
  try {
    // Check if the recruiter's candidates table exists
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

    // Query to get all candidates added by this recruiter
    const candidates = await executeQuery(`
      SELECT c.* 
      FROM candidates c
      JOIN recruiter_candidates rc ON c.id = rc.candidate_id
      WHERE rc.recruiter_id = $1
      ORDER BY rc.created_at DESC
    `, [recruiterId]);

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
      };
    });

    return res.status(200).json(formattedCandidates);
  } catch (error) {
    console.error('Error fetching recruiter candidates:', error);
    return res.status(500).json({ error: 'Failed to fetch candidates' });
  }
}

/**
 * Create a new candidate and associate it with the recruiter
 */
async function createRecruiterCandidate(req: NextApiRequest, res: NextApiResponse, recruiterId: string) {
  try {
    const candidateData = req.body;

    // Validate required fields
    if (!candidateData.name || !candidateData.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if candidate with this email already exists
    const existingCandidate = await executeQuery(
      'SELECT id FROM candidates WHERE email = $1',
      [candidateData.email]
    );

    if (existingCandidate.length > 0) {
      return res.status(409).json({ error: 'A candidate with this email already exists' });
    }

    // Generate ID for the new candidate
    const candidateId = candidateData.id || uuidv4();

    // Prepare data for insertion
    const skills = Array.isArray(candidateData.skills) 
      ? JSON.stringify(candidateData.skills)
      : '[]';

    // Insert the candidate into candidates table
    // Notice we're NOT using experience_data or education_data columns since they don't exist
    await executeQuery(`
      INSERT INTO candidates (
        id, name, email, phone, skills, resume_url, github_url, linkedin_url,
        source, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
      )
    `, [
      candidateId,
      candidateData.name,
      candidateData.email,
      candidateData.phone || null,
      skills,
      candidateData.resumeUrl || null,
      candidateData.githubUrl || null,
      candidateData.linkedinUrl || null,
      'recruiter', // Mark this as a recruiter-added candidate
      // NOW() for created_at and updated_at handled in SQL
    ]);

    // Associate the candidate with the recruiter
    const relationId = uuidv4();
    await executeQuery(`
      INSERT INTO recruiter_candidates (id, recruiter_id, candidate_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
    `, [relationId, recruiterId, candidateId]);

    // Return the created candidate
    return res.status(201).json({
      id: candidateId,
      name: candidateData.name,
      email: candidateData.email,
      phone: candidateData.phone || null,
      skills: candidateData.skills || [],
      experience: candidateData.experience || [],
      education: candidateData.education || [],
      resumeUrl: candidateData.resumeUrl || null,
      githubUrl: candidateData.githubUrl || null,
      linkedinUrl: candidateData.linkedinUrl || null,
      source: 'recruiter',
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error creating recruiter candidate:', error);
    return res.status(500).json({ error: 'Failed to create candidate' });
  }
} 