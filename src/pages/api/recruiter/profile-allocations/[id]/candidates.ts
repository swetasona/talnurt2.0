import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '../../../auth/[...nextauth]';

interface RecruiterCandidate {
  id: string;
  recruiter_id: string;
  candidate_id: string;
  profile_allocation_id: string;
  status?: string;
  feedback?: string;
  created_at?: Date;
  updated_at?: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let prisma;

  try {
    // Get a database connection
    prisma = await getConnection();

    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      if (prisma) releaseConnection();
      return res.status(200).json({ 
        candidates: [],
        _error: 'Unauthorized. Please log in.'
      });
    }

    // Check if user is authorized (employee, manager, or employer)
    if (!['employee', 'manager', 'employer', 'recruiter'].includes(session.user.role)) {
      if (prisma) releaseConnection();
      return res.status(200).json({ 
        candidates: [],
        _error: 'Access denied. You do not have permission to access this resource.'
      });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      if (prisma) releaseConnection();
      return res.status(200).json({ 
        candidates: [],
        _error: 'Invalid profile allocation ID'
      });
    }

    if (req.method === 'GET') {
      // Check if the profile allocation exists
      const allocation = await prisma.profileAllocation.findUnique({
        where: { id }
      });

      if (!allocation) {
        if (prisma) releaseConnection();
        return res.status(200).json({ 
          candidates: [],
          _error: 'Profile allocation not found'
        });
      }

      console.log(`Fetching candidates for profile allocation ID: ${id}`);

      // Get the recruiter_candidates records for the specific profile allocation using Prisma client
      const recruiterCandidates = await prisma.recruiter_candidates.findMany({
        where: {
          profile_allocation_id: id
        }
      });

      console.log(`Found ${recruiterCandidates.length} candidate associations for this profile`);

      if (recruiterCandidates.length === 0) {
        if (prisma) releaseConnection();
        return res.status(200).json({ candidates: [] });
      }

      // Extract candidate IDs from the recruiter_candidates records
      const candidateIds = recruiterCandidates.map(rc => rc.candidate_id);

      // Get the actual candidate records
      const candidates = await prisma.candidates.findMany({
        where: {
          id: {
            in: candidateIds
          }
        },
        include: {
          experience: true,
          education: true
        }
      });

      console.log(`Retrieved ${candidates.length} candidate details`);

      // Format candidates data
      const formattedCandidates = candidates.map(candidate => {
        // Parse skills from JSON if needed
        let skillsArray: string[] = [];
        try {
          if (typeof candidate.skills === 'string') {
            skillsArray = JSON.parse(candidate.skills as string);
          } else if (Array.isArray(candidate.skills)) {
            skillsArray = candidate.skills as string[];
          } else if (candidate.skills && typeof candidate.skills === 'object') {
            // Convert object values to strings to ensure type safety
            skillsArray = Object.values(candidate.skills).map(value => String(value));
          }
        } catch (e) {
          console.error('Error parsing skills:', e);
        }

        // Find the corresponding recruiter_candidate record to get status info
        const recruiterCandidate = recruiterCandidates.find(rc => rc.candidate_id === candidate.id);

        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone || undefined,
          skills: skillsArray,
          experience: candidate.experience?.[0]?.title || "Not specified",
          education: candidate.education?.[0]?.institution || "Not specified",
          resume: candidate.resume_url ? true : false,
          resumeUrl: candidate.resume_url,
          status: recruiterCandidate?.status || "pending", // Get status from recruiter_candidates table or default to pending
          createdAt: candidate.created_at.toISOString(),
          profileAllocationId: id
        };
      });

      if (prisma) releaseConnection();
      return res.status(200).json({ candidates: formattedCandidates });
    }

    // Handle other HTTP methods
    if (prisma) releaseConnection();
    return res.status(200).json({ 
      candidates: [],
      _error: 'Method not allowed'
    });
  } catch (error: any) {
    console.error('Error in profile-allocation candidates API:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    // Return empty array with error details instead of 500 error
    return res.status(200).json({ 
      candidates: [],
      _error: 'Internal server error',
      _details: error.message
    });
  }
} 