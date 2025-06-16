import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '../../../../../auth/[...nextauth]';

interface RecruiterCandidate {
  id: string;
  recruiter_id: string;
  candidate_id: string;
  profile_allocation_id?: string;
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
      releaseConnection();
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user is authorized (employee, manager, or employer)
    if (!['employee', 'manager', 'employer', 'recruiter'].includes(session.user.role)) {
      releaseConnection();
      return res.status(403).json({ error: 'Access denied. You do not have permission to access this resource.' });
    }

    const { id: profileAllocationId, employeeId } = req.query;

    if (!profileAllocationId || !employeeId || typeof profileAllocationId !== 'string' || typeof employeeId !== 'string') {
      releaseConnection();
      return res.status(400).json({ error: 'Profile allocation ID and employee ID are required' });
    }

    if (req.method === 'GET') {
      // Check if the profile allocation exists
      const allocation = await prisma.profileAllocation.findUnique({
        where: { id: profileAllocationId }
      });

      if (!allocation) {
        releaseConnection();
        return res.status(404).json({ error: 'Profile allocation not found' });
      }

      // Check if the employee exists and belongs to the employer's company
      const employee = await prisma.user.findFirst({
        where: {
          id: employeeId,
          company_id: session.user.company
        }
      });

      if (!employee) {
        releaseConnection();
        return res.status(404).json({ error: 'Employee not found or does not belong to your company' });
      }

      // Get the recruiter_candidates records for this employee and profile allocation
      const recruiterCandidates = await prisma.$queryRaw<RecruiterCandidate[]>`
        SELECT * FROM recruiter_candidates 
        WHERE recruiter_id = ${employeeId}
        AND profile_allocation_id = ${profileAllocationId}
      `;

      // Get the candidate IDs
      const candidateIds = recruiterCandidates.map(rc => rc.candidate_id);

      if (candidateIds.length === 0) {
        releaseConnection();
        return res.status(200).json({ candidates: [] });
      }

      // Get all candidates from the database
      const allCandidates = await prisma.candidates.findMany({
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

      // Create a map of recruiter_candidates for easy lookup
      const rcMap = new Map();
      recruiterCandidates.forEach(rc => {
        rcMap.set(rc.candidate_id, rc);
      });

      // Format candidates data
      const formattedCandidates = allCandidates.map(candidate => {
        const rc = rcMap.get(candidate.id);
        
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

        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone || undefined,
          skills: skillsArray,
          experience: candidate.experience?.[0]?.title || "Not specified",
          education: candidate.education?.[0]?.institution || "Not specified",
          resume: candidate.resume_url ? true : false,
          status: rc.status || "pending",
          createdAt: rc.created_at?.toISOString() || candidate.created_at.toISOString(),
          profileAllocationId: profileAllocationId,
          notes: rc.feedback || null
        };
      });

      releaseConnection();
      return res.status(200).json({ candidates: formattedCandidates });
    }

    // Handle other HTTP methods
    releaseConnection();
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in profile-allocation candidates API:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 