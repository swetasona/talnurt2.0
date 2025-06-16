import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user has access to view profile allocations
  const validRoles = ['manager', 'employee', 'recruiter', 'unassigned'];
  if (!validRoles.includes(session.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // Get profile allocations for the current user
    const allocations = await prisma.profileAllocation.findMany({
      where: {
        allocatedEmployees: {
          some: {
            employeeId: session.user.id
          }
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        allocatedEmployees: {
          where: {
            employeeId: session.user.id
          },
          select: {
            id: true,
            status: true,
            response: true,
            responseAt: true,
            notifiedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedAllocations = allocations.map((allocation: any) => ({
      id: allocation.id,
      jobTitle: allocation.jobTitle,
      jobDescription: allocation.jobDescription,
      budgetMin: allocation.budgetMin,
      budgetMax: allocation.budgetMax,
      currency: allocation.currency,
      education: allocation.education,
      experience: allocation.experience,
      skills: allocation.skills || [],
      hiringTimeline: allocation.hiringTimeline,
      location: allocation.location,
      remoteStatus: allocation.remoteStatus,
      jobType: allocation.jobType,
      deadline: allocation.deadline?.toISOString(),
      priority: allocation.priority,
      notes: allocation.notes,
      createdAt: allocation.createdAt.toISOString(),
      createdBy: allocation.createdBy,
      employeeStatus: allocation.allocatedEmployees[0] || null
    }));

    res.status(200).json({
      allocations: formattedAllocations,
      total: formattedAllocations.length
    });

  } catch (error) {
    console.error('Error fetching profile allocations:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 