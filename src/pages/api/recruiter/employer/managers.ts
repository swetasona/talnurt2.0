import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session to verify the user is authenticated and has employer access
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user has employer access
    if (session.user.role !== 'employer') {
      return res.status(403).json({ error: 'Employer access required.' });
    }

    // First, get the employer's company_id
    const employer = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        company_id: true
      }
    });

    console.log('Employer company_id:', employer?.company_id);

    if (!employer?.company_id) {
      console.log('Warning: Employer has no company_id. Returning empty managers list.');
      return res.status(200).json({ managers: [] });
    }

    // Get all managers from the same company
    const managers = await prisma.user.findMany({
      where: {
        role: 'manager',
        company_id: employer.company_id,
        is_active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        company_id: true,
        team_id: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${managers.length} managers with company_id: ${employer.company_id}`);

    return res.status(200).json({ managers });

  } catch (error) {
    console.error('Error fetching managers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 