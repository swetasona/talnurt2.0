import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
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
    
    // Get saved candidates for the recruiter
    const savedCandidates = await prisma.saved_candidates.findMany({
      where: {
        recruiter_id: recruiterId,
      },
      include: {
        recruiter: true
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    
    // Fetch candidates from candidates model based on the IDs in saved_candidates
    const candidateIds = savedCandidates.map(saved => saved.candidate_id);
    
    const candidateDetails = await prisma.candidates.findMany({
      where: {
        id: { in: candidateIds }
      }
    });
    
    // Create a map for faster lookup
    const candidateMap = new Map();
    candidateDetails.forEach(candidate => {
      candidateMap.set(candidate.id, candidate);
    });
    
    // Format the candidates for the response
    const formattedCandidates = savedCandidates.map(saved => {
      const candidate = candidateMap.get(saved.candidate_id);
      
      // Parse skills from string to array if needed
      let skills: string[] = [];
      try {
        if (candidate?.skills) {
          if (typeof candidate.skills === 'string') {
            skills = JSON.parse(candidate.skills as string);
          } else {
            skills = candidate.skills as string[];
          }
        }
      } catch (e) {
        console.error('Error parsing skills:', e);
        skills = [];
      }

      return {
        id: saved.id,
        userId: candidate?.user_id || '',
        name: candidate?.name || 'Unknown',
        email: candidate?.email || '',
        resumeUrl: candidate?.resume_url || null,
        phoneNumber: candidate?.phone || null,
        linkedinUrl: candidate?.linkedin_url || null,
        githubUrl: candidate?.github_url || null,
        skills: skills,
        savedDate: saved.created_at,
      };
    });

    return res.status(200).json(formattedCandidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 