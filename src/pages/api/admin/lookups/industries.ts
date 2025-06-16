import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Query the database for all industries
      const industries = await prisma.industries.findMany({
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
        },
      });

      return res.status(200).json(industries);
    } catch (error) {
      console.error('Error fetching industries:', error);
      return res.status(500).json({ error: 'Failed to fetch industries' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 