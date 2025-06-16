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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session to verify the user is authenticated and is a recruiter
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (session.user.role !== 'recruiter') {
      return res.status(403).json({ error: 'Not authorized. Only recruiters can access this endpoint.' });
    }

    const recruiterId = session.user.id;
    const { candidates } = req.body;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'No valid candidates provided for import' });
    }

    // Ensure tables exist before proceeding
    await ensureCandidateTablesExist();

    // Track import results
    const results = {
      total: candidates.length,
      imported: 0,
      duplicates: 0,
      errors: 0,
      errorDetails: [] as string[]
    };

    // Process each candidate
    for (const candidate of candidates) {
      try {
        // Validate required fields
        if (!candidate.name || !candidate.email) {
          results.errors++;
          results.errorDetails.push(`Missing required fields for candidate: ${candidate.name || candidate.email || 'Unknown'}`);
          continue;
        }

        // Check if candidate with this email already exists
        const existingCandidate = await executeQuery(
          'SELECT id FROM candidates WHERE email = $1',
          [candidate.email]
        );

        let candidateId;

        // If candidate already exists, just create the association
        if (existingCandidate.length > 0) {
          candidateId = existingCandidate[0].id;
          
          // Check if this recruiter already has this candidate
          const existingAssociation = await executeQuery(`
            SELECT 1 FROM recruiter_candidates
            WHERE recruiter_id = $1 AND candidate_id = $2
          `, [recruiterId, candidateId]);

          if (existingAssociation.length > 0) {
            results.duplicates++;
            continue; // Skip this candidate as it's already in the recruiter's pool
          }
        } else {
          // Generate ID for the new candidate
          candidateId = uuidv4();

          // Prepare data for insertion
          const skills = Array.isArray(candidate.skills) 
            ? JSON.stringify(candidate.skills)
            : '[]';

          // Insert the candidate into candidates table - removed experience_data and education_data fields
          await executeQuery(`
            INSERT INTO candidates (
              id, name, email, phone, skills, resume_url, github_url, linkedin_url,
              source, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
            )
          `, [
            candidateId,
            candidate.name,
            candidate.email,
            candidate.phone || null,
            skills,
            candidate.resumeUrl || null,
            candidate.githubUrl || null,
            candidate.linkedinUrl || null,
            'recruiter', // Mark this as a recruiter-added candidate
          ]);
        }

        // Associate the candidate with the recruiter
        const relationId = uuidv4();
        await executeQuery(`
          INSERT INTO recruiter_candidates (id, recruiter_id, candidate_id, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT (recruiter_id, candidate_id) DO NOTHING
        `, [relationId, recruiterId, candidateId]);

        results.imported++;
      } catch (error) {
        console.error('Error importing candidate:', error);
        results.errors++;
        results.errorDetails.push(`Error importing candidate ${candidate.name || candidate.email || 'Unknown'}: ${error}`);
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in import candidates API:', error);
    return res.status(500).json({ error: 'Failed to import candidates' });
  }
} 