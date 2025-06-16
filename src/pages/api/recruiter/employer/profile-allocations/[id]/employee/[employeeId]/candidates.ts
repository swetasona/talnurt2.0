import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

interface RecruiterCandidate {
  id: string;
  recruiter_id: string;
  candidate_id: string;
  profile_allocation_id: string;
  status: string | null;
  feedback: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let prisma;

  if (req.method !== 'GET') {
    return res.status(200).json({ 
      candidates: [],
      _error: "Method not allowed"
    });
  }

  try {
    // Get a database connection
    prisma = await getConnection();

    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      if (prisma) releaseConnection();
      return res.status(200).json({ 
        candidates: [],
        _error: "Unauthorized. Please log in."
      });
    }

    // Check if user is authorized (employer role required)
    if (session.user.role !== 'employer') {
      if (prisma) releaseConnection();
      return res.status(200).json({ 
        candidates: [],
        _error: "Access denied. Only employers can access this resource."
      });
    }

    const { id: profileAllocationId, employeeId } = req.query;

    if (!profileAllocationId || !employeeId) {
      if (prisma) releaseConnection();
      return res.status(200).json({ 
        candidates: [],
        _error: "Profile allocation ID and employee ID are required"
      });
    }

    try {
      // Check if the profile allocation exists
      const profileAllocation = await prisma.profileAllocation.findUnique({
        where: {
          id: profileAllocationId as string
        },
        include: {
          createdBy: true
        }
      });

      if (!profileAllocation) {
        if (prisma) releaseConnection();
        return res.status(200).json({ 
          candidates: [],
          _error: "Profile allocation not found"
        });
      }

      // Log the access check details for debugging
      console.log('Profile allocation access check:', {
        allocationId: profileAllocationId,
        allocationCompanyId: profileAllocation.createdBy?.company_id || 'unknown',
        userCompanyId: session.user.company,
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role
      });

      // Check if the employee exists
      const employee = await prisma.user.findUnique({
        where: {
          id: employeeId as string
        }
      });

      if (!employee) {
        if (prisma) releaseConnection();
        return res.status(200).json({ 
          candidates: [],
          _error: "Employee not found"
        });
      }

      // Check if this is the employer's profile allocation
      const isEmployerProfileAllocation = profileAllocation.createdBy.id === session.user.id;
      
      // Check if the employee has submitted candidates for this specific profile allocation
      const hasSubmittedCandidates = await prisma.recruiter_candidates.findFirst({
        where: {
          recruiter_id: employeeId as string,
          profile_allocation_id: profileAllocationId as string
        }
      });
      
      // Allow access if:
      // 1. This is the employer's profile allocation AND
      // 2. The employee has submitted candidates for this profile allocation
      if (!isEmployerProfileAllocation && !hasSubmittedCandidates) {
        console.log('Access denied: Not employer profile allocation or employee has not submitted candidates');
        if (prisma) releaseConnection();
        return res.status(200).json({ 
          candidates: [],
          _error: "Access denied. You don't have permission to view candidates from this employee."
        });
      }

      // First, get all recruiter_candidates entries for this specific employee and profile allocation
      const recruiterCandidates = await prisma.recruiter_candidates.findMany({
        where: {
          recruiter_id: employeeId as string,
          profile_allocation_id: profileAllocationId as string
        }
      });

      console.log(`Found ${recruiterCandidates.length} candidate associations for this employee and profile`);

      if (recruiterCandidates.length === 0) {
        // No candidates found, return empty array
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
        // Find the corresponding recruiter_candidate record to get status info
        const recruiterCandidate = recruiterCandidates.find(rc => rc.candidate_id === candidate.id);
        
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
          resumeUrl: candidate.resume_url || "",
          status: (recruiterCandidate?.status || "pending").toLowerCase(),
          createdAt: recruiterCandidate?.created_at?.toISOString() || new Date().toISOString(),
          submittedBy: {
            id: employeeId,
            name: employee.name,
            email: employee.email
          },
          notes: recruiterCandidate?.feedback || ""
        };
      });
      
      if (prisma) releaseConnection();
      return res.status(200).json({ candidates: formattedCandidates });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      if (prisma) releaseConnection();
      
      // Return empty array with error details
      return res.status(200).json({ 
        candidates: [],
        _error: "Database error occurred",
        _details: dbError.message
      });
    }
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    // Return empty array with error details
    return res.status(200).json({ 
      candidates: [],
      _error: "General error occurred",
      _details: error.message
    });
  }
} 