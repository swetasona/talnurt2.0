import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get a database connection
    prisma = await getConnection();

    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      releaseConnection();
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user is authorized (employer role required)
    if (session.user.role !== 'employer') {
      releaseConnection();
      return res.status(403).json({ error: 'Access denied. Only employers can access this resource.' });
    }

    const { id } = req.query;

    if (!id) {
      releaseConnection();
      return res.status(400).json({ error: 'Candidate ID is required' });
    }

    // Find the candidate with related data
    const candidateData = await prisma.candidates.findUnique({
      where: { id: id as string },
      include: {
        experience: true,
        education: true
      }
    });

    if (!candidateData) {
      releaseConnection();
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Get recruiter information for this candidate using raw query
    const recruiterCandidates = await prisma.$queryRaw<RecruiterCandidate[]>`
      SELECT * FROM recruiter_candidates 
      WHERE candidate_id = ${id as string}
    `;

    if (recruiterCandidates.length === 0) {
      releaseConnection();
      return res.status(404).json({ error: 'Recruiter candidate record not found' });
    }

    const recruiterCandidate = recruiterCandidates[0];

    // Get the recruiter information
    const recruiter = await prisma.user.findUnique({
      where: { id: recruiterCandidate.recruiter_id },
      select: {
        id: true,
        name: true,
        email: true,
        company_id: true
      }
    });

    if (!recruiter) {
      releaseConnection();
      return res.status(404).json({ error: 'Recruiter not found' });
    }

    // Check if the candidate belongs to the employer's company
    if (recruiter.company_id !== session.user.company) {
      releaseConnection();
      return res.status(403).json({ error: 'Access denied. This candidate does not belong to your company.' });
    }

    // Parse skills from JSON if needed
    let skillsArray: string[] = [];
    try {
      if (typeof candidateData.skills === 'string') {
        skillsArray = JSON.parse(candidateData.skills as string);
      } else if (Array.isArray(candidateData.skills)) {
        skillsArray = candidateData.skills as string[];
      } else if (candidateData.skills && typeof candidateData.skills === 'object') {
        skillsArray = Object.values(candidateData.skills).map(value => String(value));
      }
    } catch (e) {
      console.error('Error parsing skills:', e);
    }

    // Parse feedback JSON data if available
    let feedbackData = {};
    try {
      if (recruiterCandidate.feedback) {
        feedbackData = JSON.parse(recruiterCandidate.feedback);
        console.log("Parsed feedback data:", feedbackData);
      }
    } catch (e) {
      console.error('Error parsing feedback JSON:', e);
    }

    // Format the candidate data
    const formattedCandidate = {
      id: candidateData.id,
      name: candidateData.name,
      email: candidateData.email,
      phone: candidateData.phone,
      skills: skillsArray,
      experience: candidateData.experience?.[0]?.title || null,
      education: candidateData.education?.[0]?.institution || null,
      resumeUrl: candidateData.resume_url,
      status: recruiterCandidate.status || 'pending',
      createdAt: recruiterCandidate.created_at?.toISOString() || candidateData.created_at.toISOString(),
      submittedBy: {
        id: recruiter.id,
        name: recruiter.name,
        email: recruiter.email
      },
      notes: recruiterCandidate.feedback || null,
      profileAllocationId: recruiterCandidate.profile_allocation_id || null,
      // Add all feedback data fields directly to the response
      ...feedbackData
    };

    releaseConnection();
    return res.status(200).json(formattedCandidate);
  } catch (error) {
    console.error('Error fetching candidate details:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 