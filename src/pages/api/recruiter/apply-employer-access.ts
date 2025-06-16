import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session to verify the user is authenticated and has a valid role
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user has a valid role that can apply for employer access
    const validRolesForEmployerAccess = ['recruiter', 'unassigned', 'employee', 'manager'];
    if (!validRolesForEmployerAccess.includes(session.user.role)) {
      return res.status(403).json({ error: 'Only recruiter-type users can apply for employer access.' });
    }

    const recruiterId = session.user.id;

    // Check if the recruiter has already applied
    const existingApplication = await prisma.employer_applications.findFirst({
      where: {
        recruiter_id: recruiterId,
        status: 'pending'
      }
    });

    if (existingApplication) {
      return res.status(409).json({ 
        error: 'You already have a pending employer access application.' 
      });
    }

    // Create new employer access application
    const application = await prisma.employer_applications.create({
      data: {
        recruiter_id: recruiterId,
        status: 'pending',
        admin_notes: null
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Your employer access application has been submitted successfully.',
      application: {
        id: application.id,
        status: application.status,
        created_at: application.created_at
      }
    });

  } catch (error) {
    console.error('Error creating employer access application:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 