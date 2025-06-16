import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const recruiterId = session.user.id;

    // Find any pending or approved application for this recruiter
    const application = await prisma.employer_applications.findFirst({
      where: {
        recruiter_id: recruiterId
      },
      orderBy: {
        created_at: 'desc' // Get the most recent application
      }
    });

    return res.status(200).json({
      hasApplication: !!application,
      application: application ? {
        id: application.id,
        status: application.status,
        admin_notes: application.admin_notes,
        created_at: application.created_at,
        updated_at: application.updated_at
      } : null
    });

  } catch (error) {
    console.error('Error checking employer access status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 