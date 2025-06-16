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
    
    // Create education table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS education (
        id VARCHAR(36) PRIMARY KEY,
        candidate_id VARCHAR(36) NOT NULL,
        institution VARCHAR(255) NOT NULL,
        degree VARCHAR(255) NOT NULL,
        field VARCHAR(255),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);
    
    // Create experience table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS experience (
        id VARCHAR(36) PRIMARY KEY,
        candidate_id VARCHAR(36) NOT NULL,
        company VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
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
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    // Ensure tables exist before proceeding
    await ensureCandidateTablesExist();

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return getRecruiterCandidate(req, res, recruiterId, id);
      case 'PUT':
        return updateRecruiterCandidate(req, res, recruiterId, id);
      case 'DELETE':
        return deleteRecruiterCandidate(req, res, recruiterId, id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in recruiter/my-talent/[id] API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get a specific candidate details
 */
async function getRecruiterCandidate(req: NextApiRequest, res: NextApiResponse, recruiterId: string, candidateId: string) {
  try {
    // Verify this candidate belongs to the recruiter
    const verifyCandidate = await executeQuery(`
      SELECT EXISTS (
        SELECT 1 FROM recruiter_candidates
        WHERE recruiter_id = $1 AND candidate_id = $2
      )
    `, [recruiterId, candidateId]);

    if (!verifyCandidate[0].exists) {
      return res.status(404).json({ error: 'Candidate not found or does not belong to this recruiter' });
    }

    // Get the candidate details
    const candidateResult = await executeQuery(`
      SELECT * FROM candidates WHERE id = $1
    `, [candidateId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const candidate = candidateResult[0];

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

    // Fetch education data
    try {
      const educationResult = await executeQuery(`
        SELECT * FROM education WHERE candidate_id = $1 ORDER BY start_date DESC
      `, [candidateId]);
      
      education = educationResult || [];
    } catch (error) {
      console.error('Error fetching education data:', error);
    }

    // Fetch experience data
    try {
      const experienceResult = await executeQuery(`
        SELECT * FROM experience WHERE candidate_id = $1 ORDER BY start_date DESC
      `, [candidateId]);
      
      experience = experienceResult || [];
    } catch (error) {
      console.error('Error fetching experience data:', error);
    }

    // Format the response
    const formattedCandidate = {
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
      source: candidate.source || 'recruiter',
      createdAt: candidate.created_at,
      updatedAt: candidate.updated_at,
    };

    return res.status(200).json(formattedCandidate);
  } catch (error) {
    console.error('Error fetching recruiter candidate details:', error);
    return res.status(500).json({ error: 'Failed to fetch candidate details' });
  }
}

/**
 * Update a specific candidate
 */
async function updateRecruiterCandidate(req: NextApiRequest, res: NextApiResponse, recruiterId: string, candidateId: string) {
  try {
    // Verify this candidate belongs to the recruiter
    const verifyCandidate = await executeQuery(`
      SELECT EXISTS (
        SELECT 1 FROM recruiter_candidates
        WHERE recruiter_id = $1 AND candidate_id = $2
      )
    `, [recruiterId, candidateId]);

    if (!verifyCandidate[0].exists) {
      return res.status(404).json({ error: 'Candidate not found or does not belong to this recruiter' });
    }

    const candidateData = req.body;

    // Validate required fields
    if (!candidateData.name || !candidateData.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Prepare data for update
    const skills = Array.isArray(candidateData.skills) 
      ? JSON.stringify(candidateData.skills)
      : '[]';

    // Update the candidate in the database
    await executeQuery(`
      UPDATE candidates
      SET 
        name = $1,
        email = $2,
        phone = $3,
        skills = $4,
        resume_url = $5,
        github_url = $6,
        linkedin_url = $7,
        updated_at = NOW()
      WHERE id = $8
    `, [
      candidateData.name,
      candidateData.email,
      candidateData.phone || null,
      skills,
      candidateData.resumeUrl || null,
      candidateData.githubUrl || null,
      candidateData.linkedinUrl || null,
      candidateId
    ]);

    // Handle education data
    if (Array.isArray(candidateData.education)) {
      // First, delete existing education entries
      await executeQuery(`DELETE FROM education WHERE candidate_id = $1`, [candidateId]);
      
      // Then insert new education entries
      for (const edu of candidateData.education) {
        const eduId = edu.id || uuidv4();
        await executeQuery(`
          INSERT INTO education (
            id, candidate_id, institution, degree, field, 
            start_date, end_date, created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [
          eduId,
          candidateId,
          edu.institution || 'Unknown Institution',
          edu.degree || 'Unknown Degree',
          edu.field || '',
          edu.startDate ? new Date(edu.startDate) : null,
          edu.endDate ? new Date(edu.endDate) : null
        ]);
      }
    }

    // Handle experience data
    if (Array.isArray(candidateData.experience)) {
      // First, delete existing experience entries
      await executeQuery(`DELETE FROM experience WHERE candidate_id = $1`, [candidateId]);
      
      // Then insert new experience entries
      for (const exp of candidateData.experience) {
        const expId = exp.id || uuidv4();
        await executeQuery(`
          INSERT INTO experience (
            id, candidate_id, company, title, description, 
            start_date, end_date, created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [
          expId,
          candidateId,
          exp.company || 'Unknown Company',
          exp.title || 'Unknown Position',
          exp.description || '',
          exp.startDate ? new Date(exp.startDate) : null,
          exp.endDate ? new Date(exp.endDate) : null
        ]);
      }
    }

    // Fetch updated candidate with education and experience
    const updatedCandidate = await getRecruiterCandidate(req, res, recruiterId, candidateId);
    return updatedCandidate;
  } catch (error) {
    console.error('Error updating recruiter candidate:', error);
    return res.status(500).json({ error: 'Failed to update candidate' });
  }
}

/**
 * Delete a specific candidate from the recruiter's talent pool
 */
async function deleteRecruiterCandidate(req: NextApiRequest, res: NextApiResponse, recruiterId: string, candidateId: string) {
  try {
    // Verify this candidate belongs to the recruiter
    const verifyCandidate = await executeQuery(`
      SELECT EXISTS (
        SELECT 1 FROM recruiter_candidates
        WHERE recruiter_id = $1 AND candidate_id = $2
      )
    `, [recruiterId, candidateId]);

    if (!verifyCandidate[0].exists) {
      return res.status(404).json({ error: 'Candidate not found or does not belong to this recruiter' });
    }

    // First, delete the association between recruiter and candidate
    await executeQuery(`
      DELETE FROM recruiter_candidates
      WHERE recruiter_id = $1 AND candidate_id = $2
    `, [recruiterId, candidateId]);

    // We're not deleting the actual candidate data
    // This way, if the same candidate is in multiple recruiters' pools, or if admin needs to access it,
    // the data is still available. The recruiter just loses access to it.

    // Alternatively, if the requirement is to fully delete the candidate data:
    // Uncomment the following if you want to delete the candidate completely
    /*
    await executeQuery(`
      DELETE FROM candidates
      WHERE id = $1
    `, [candidateId]);
    */

    return res.status(200).json({ message: 'Candidate removed successfully' });
  } catch (error) {
    console.error('Error deleting recruiter candidate:', error);
    return res.status(500).json({ error: 'Failed to delete candidate' });
  }
} 