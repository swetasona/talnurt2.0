import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { executeQuery } from '@/lib/db';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session to verify the user is authenticated and has a valid recruiter-type role
    const session = await getServerSession(req, res, authOptions);

    // List of valid recruiter-type roles
    const validRecruiterRoles = ['recruiter', 'unassigned', 'employee', 'employer', 'manager', 'admin', 'superadmin'];

    if (!session || !validRecruiterRoles.includes(session.user.role)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recruiterId = session.user.id;

    // Get active jobs count (status = 'open')
    const activeJobs = await prisma.job_postings.count({
      where: {
        posted_by: recruiterId,
        status: 'open',
      },
    });

    // Get total applicants count for recruiter's jobs
    const totalApplicants = await prisma.applications.count({
      where: {
        job_postings: {
          posted_by: recruiterId,
        },
      },
    });

    // Get saved candidates count using raw SQL since Prisma client might not be updated yet
    const savedCandidatesResult = await executeQuery(
      'SELECT COUNT(*) as count FROM saved_candidates WHERE recruiter_id = $1',
      [recruiterId]
    );
    
    const savedCandidates = savedCandidatesResult[0]?.count || 0;

    // Return the stats
    return res.status(200).json({
      activeJobs,
      totalApplicants,
      savedCandidates,
    });
  } catch (error) {
    console.error('Error fetching recruiter dashboard stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 