import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PUT method for updating status
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { status, feedback } = req.body;
  
  // Function to release Prisma connection
  const releaseConnection = async () => {
    await prisma.$disconnect();
  };

  if (!id) {
    await releaseConnection();
    return res.status(400).json({ error: 'Candidate ID is required' });
  }

  // Ensure status is lowercase for consistency
  const normalizedStatus = status ? status.toLowerCase() : null;

  if (!normalizedStatus || !['pending', 'approved', 'rejected'].includes(normalizedStatus)) {
    await releaseConnection();
    return res.status(400).json({ error: 'Valid status is required (pending, approved, or rejected)' });
  }
  
  try {
    // Update the candidate status
    const updatedCandidate = await prisma.recruiter_candidates.update({
      where: {
        id: Array.isArray(id) ? id[0] : id
      },
      data: {
        status: normalizedStatus,
        feedback: feedback || null
      }
    });
    
    await releaseConnection();
    return res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate status:', error);
    await releaseConnection();
    return res.status(500).json({ error: 'Failed to update candidate status' });
  }
} 