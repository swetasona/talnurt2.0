import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find candidates by name and email
    const candidate1 = await prisma.candidates.findFirst({
      where: {
        name: "DlhfAnFJag",
        email: "swetasona@gmail.com"
      }
    });

    const candidate2 = await prisma.candidates.findFirst({
      where: {
        name: "test",
        email: "john.smith@example.com"
      }
    });

    const deletedCandidates = [];
    const errors = [];

    // Delete first candidate if found
    if (candidate1) {
      try {
        // Delete any recruiter_candidates entries first
        await prisma.recruiter_candidates.deleteMany({
          where: {
            candidate_id: candidate1.id
          }
        });

        // Delete the candidate
        await prisma.candidates.delete({
          where: {
            id: candidate1.id
          }
        });

        deletedCandidates.push({
          id: candidate1.id,
          name: candidate1.name,
          email: candidate1.email
        });
      } catch (error: any) {
        errors.push({
          candidate: "DlhfAnFJag",
          error: error.message
        });
      }
    }

    // Delete second candidate if found
    if (candidate2) {
      try {
        // Delete any recruiter_candidates entries first
        await prisma.recruiter_candidates.deleteMany({
          where: {
            candidate_id: candidate2.id
          }
        });

        // Delete the candidate
        await prisma.candidates.delete({
          where: {
            id: candidate2.id
          }
        });

        deletedCandidates.push({
          id: candidate2.id,
          name: candidate2.name,
          email: candidate2.email
        });
      } catch (error: any) {
        errors.push({
          candidate: "test",
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      deletedCandidates,
      errors,
      notFound: !candidate1 || !candidate2 ? [
        !candidate1 ? "DlhfAnFJag" : null,
        !candidate2 ? "test" : null
      ].filter(Boolean) : []
    });
  } catch (error: any) {
    console.error('Error deleting test candidates:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
} 