import { NextApiRequest, NextApiResponse } from 'next';
import { getCandidates, createCandidate } from '@/lib/db-postgres';
import { Candidate } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check for cache-busting parameter
    const nocache = req.query.nocache;
    if (nocache) {
      console.log(`Cache-busting request received at ${new Date().toISOString()}`);
    }
    
    // Get filter parameters
    let source = req.query.source as string;
    const exclude = req.query.exclude as string;
    
    // Handle special source values for admin/frontend separation
    if (source === 'mytalent') {
      // My Talent should only show manually added, resume-parsed, or excel-imported candidates
      source = 'admin';
    } else if (source === 'globaltalent') {
      // Global Talent should only show frontend-registered candidates
      source = 'frontend';
    }
    
    switch (req.method) {
      case 'GET':
        // Fetch candidates from database with filtering
        console.log(`Fetching candidates from database with source=${source}, exclude=${exclude}`);
        // Pass source and exclude parameters to database function
        const candidates = await getCandidates(source, exclude);
        console.log(`Returning ${candidates.length} candidates from database`);
        return res.status(200).json(candidates);
        
      case 'POST':
        // Create a new candidate
        console.log('Creating new candidate');
        const candidateData = req.body as Candidate;
        
        // Ensure source is set correctly based on the creation method
        if (!candidateData.source) {
          // Default to manual if not specified
          candidateData.source = 'manual';
        }
        
        const newCandidate = await createCandidate(candidateData);
        console.log(`New candidate created with ID: ${newCandidate.id}, source: ${newCandidate.source}`);
        return res.status(201).json(newCandidate);
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in candidates API:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ 
      error: error.message || 'Something went wrong',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 