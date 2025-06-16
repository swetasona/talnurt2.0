import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from './[...nextauth]';

const prisma = new PrismaClient();

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

    // Get the company_id from the request body
    const { company_id, profile_allocation_id } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Update the user's company_id in the database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { company_id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company_id: true
      }
    });

    // If a profile allocation ID was provided, fetch it to verify it exists
    let profileAllocation = null;
    if (profile_allocation_id) {
      profileAllocation = await prisma.profileAllocation.findUnique({
        where: { id: profile_allocation_id },
        select: {
          id: true,
          jobTitle: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              company_id: true
            }
          }
        }
      });
    }

    return res.status(200).json({
      message: 'Company ID updated successfully. Please sign out and sign in again to apply changes.',
      user: updatedUser,
      profileAllocation
    });
  } catch (error: any) {
    console.error('Error updating company ID:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message || 'Unknown error' });
  } finally {
    await prisma.$disconnect();
  }
} 