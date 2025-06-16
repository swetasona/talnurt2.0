import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import { authOptions } from './[...nextauth]';

const prisma = new PrismaClient();
const SECRET = process.env.NEXTAUTH_SECRET || 'my-super-secure-nextauth-secret-123!@#';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get the current session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company_id: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the user's information
    return res.status(200).json({
      message: 'Session refreshed. Please sign out and sign in again to apply changes.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id
      },
      session: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        company: session.user.company
      }
    });
  } catch (error: any) {
    console.error('Error refreshing session:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
} 