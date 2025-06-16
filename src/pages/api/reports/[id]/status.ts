import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow PATCH requests
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { id } = req.query;
  const { status } = req.body;

  // Validate required fields
  if (!id || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if the report exists and the user is the recipient
    const report: any[] = await prisma.$queryRaw`
      SELECT id, "recipientId", status FROM "reports" 
      WHERE id = ${id as string}
    `;

    if (report.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Only recipients can update status
    if (report[0].recipientId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this report' });
    }

    // Update the report status
    await prisma.$executeRaw`
      UPDATE "reports" 
      SET status = ${status}, "updatedAt" = NOW() 
      WHERE id = ${id as string}
    `;

    return res.status(200).json({ message: 'Report status updated successfully' });
  } catch (error) {
    console.error('Error updating report status:', error);
    return res.status(500).json({ error: 'Failed to update report status' });
  }
} 