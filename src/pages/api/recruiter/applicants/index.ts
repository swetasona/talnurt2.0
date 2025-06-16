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
    
    // Get query parameters
    const jobId = req.query.jobId as string | undefined;
    const status = req.query.status as string | undefined;
    
    // Build the where clause
    const where: any = {
      job_postings: {
        posted_by: recruiterId,
      },
    };
    
    // Add job filter if provided
    if (jobId) {
      where.job_id = jobId;
    }
    
    // Add status filter if provided
    if (status) {
      where.status = status;
    }
    
    // Get applications for the recruiter's jobs
    const applications = await prisma.applications.findMany({
      where,
      include: {
        job_postings: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            user_profile: {
              select: {
                resume_url: true,
                phone_number: true,
                linkedin_url: true,
                github_url: true,
              },
            },
          },
        },
      },
      orderBy: {
        applied_on: 'desc',
      },
    });
    
    // Format the applications for the response
    const formattedApplications = applications.map(app => ({
      id: app.id,
      jobId: app.job_id,
      jobTitle: app.job_postings.title,
      jobCompany: app.job_postings.company,
      jobLocation: app.job_postings.location,
      applicantId: app.user_id,
      applicantName: app.users.name,
      applicantEmail: app.users.email,
      resumeUrl: app.users.user_profile?.resume_url || null,
      phoneNumber: app.users.user_profile?.phone_number || null,
      linkedinUrl: app.users.user_profile?.linkedin_url || null,
      githubUrl: app.users.user_profile?.github_url || null,
      status: app.status,
      appliedDate: app.applied_on,
    }));

    return res.status(200).json(formattedApplications);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 