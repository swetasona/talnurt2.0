import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/db-connection-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Debug endpoint only available in development mode' });
    }

    const { candidateId } = req.query;
    
    if (!candidateId || typeof candidateId !== 'string') {
      return res.status(400).json({ error: 'Candidate ID is required' });
    }

    // GET - Fetch candidate data
    if (req.method === 'GET') {
      // Direct database query to get candidate data
      const candidate = await prisma.candidates.findUnique({
        where: { id: candidateId },
        include: {
          education: true,
          experience: true,
          recruiterSubmissions: true
        }
      });

      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      // Get the recruiter_candidate record
      const recruiterCandidate = candidate.recruiterSubmissions[0];
      
      if (!recruiterCandidate) {
        return res.status(404).json({ error: 'Recruiter candidate relationship not found' });
      }

      // Get the feedback data
      let feedbackData = {};
      if (recruiterCandidate.feedback) {
        try {
          if (typeof recruiterCandidate.feedback === 'string') {
            feedbackData = JSON.parse(recruiterCandidate.feedback);
          } else {
            feedbackData = recruiterCandidate.feedback;
          }
        } catch (e) {
          console.error('Error parsing feedback data:', e);
        }
      }

      // Return the raw data
      return res.status(200).json({
        candidate,
        recruiterCandidate,
        feedbackData,
        rawFeedback: recruiterCandidate.feedback
      });
    }
    
    // POST - Update feedback data
    if (req.method === 'POST') {
      const { feedback } = req.body;
      
      if (!feedback) {
        return res.status(400).json({ error: 'Feedback data is required' });
      }
      
      // Find the recruiter_candidate record
      const recruiterCandidate = await prisma.recruiter_candidates.findFirst({
        where: { candidate_id: candidateId }
      });
      
      if (!recruiterCandidate) {
        return res.status(404).json({ error: 'Recruiter candidate relationship not found' });
      }
      
      // Convert feedback to string if it's an object
      const feedbackString = typeof feedback === 'string' ? feedback : JSON.stringify(feedback);
      
      // Update the feedback field
      const updated = await prisma.recruiter_candidates.update({
        where: { id: recruiterCandidate.id },
        data: { feedback: feedbackString }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Feedback updated successfully',
        updatedRecord: updated
      });
    }
    
    // Method not allowed
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error });
  }
} 