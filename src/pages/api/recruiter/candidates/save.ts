import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { executeQuery } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session to verify the user is authenticated and is a recruiter
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (session.user.role !== 'recruiter') {
      return res.status(403).json({ error: 'Not authorized. Only recruiters can save candidates.' });
    }

    const recruiterId = session.user.id;
    const { candidateId, jobId, notes, tags } = req.body;

    // Validate required fields
    if (!candidateId) {
      return res.status(400).json({ error: 'Candidate ID is required' });
    }

    // Check if the candidate exists
    const candidateCheck = await executeQuery(
      'SELECT id FROM candidates WHERE id = $1',
      [candidateId]
    );

    if (!candidateCheck || candidateCheck.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Check if the candidate is already saved by this recruiter
    const existingCheck = await executeQuery(
      'SELECT id FROM saved_candidates WHERE recruiter_id = $1 AND candidate_id = $2',
      [recruiterId, candidateId]
    );

    if (existingCheck && existingCheck.length > 0) {
      // Update existing saved candidate
      const tagsJson = tags ? JSON.stringify(tags) : null;
      
      await executeQuery(
        `UPDATE saved_candidates 
         SET notes = $1, tags = $2, job_id = $3, updated_at = NOW() 
         WHERE recruiter_id = $4 AND candidate_id = $5`,
        [notes || null, tagsJson, jobId || null, recruiterId, candidateId]
      );

      return res.status(200).json({ 
        message: 'Candidate updated successfully',
        id: existingCheck[0].id,
        candidateId,
        recruiterId,
        jobId: jobId || null,
        notes: notes || null,
        tags: tags || null
      });
    }

    // Save the candidate
    const id = uuidv4();
    const tagsJson = tags ? JSON.stringify(tags) : null;
    
    await executeQuery(
      `INSERT INTO saved_candidates (id, recruiter_id, candidate_id, job_id, notes, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [id, recruiterId, candidateId, jobId || null, notes || null, tagsJson]
    );

    return res.status(201).json({ 
      message: 'Candidate saved successfully',
      id,
      candidateId,
      recruiterId,
      jobId: jobId || null,
      notes: notes || null,
      tags: tags || null
    });
  } catch (error) {
    console.error('Error saving candidate:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 