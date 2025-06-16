import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user has access to respond to profile allocations
  const validRoles = ['manager', 'employee', 'recruiter', 'unassigned'];
  if (!validRoles.includes(session.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.query;
  const { status, response } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid allocation ID' });
  }

  if (!status || !['accepted', 'declined', 'needs_clarification'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Check if the allocation exists and the user is assigned to it
    const allocation = await prisma.profileAllocation.findFirst({
      where: {
        id: id,
        allocatedEmployees: {
          some: {
            employeeId: session.user.id
          }
        }
      },
      include: {
        allocatedEmployees: {
          where: {
            employeeId: session.user.id
          }
        }
      }
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Profile allocation not found or access denied' });
    }

    const employeeAllocation = allocation.allocatedEmployees[0];

    if (!employeeAllocation) {
      return res.status(404).json({ error: 'Employee allocation not found' });
    }

    if (employeeAllocation.status !== 'pending') {
      return res.status(400).json({ error: 'You have already responded to this allocation' });
    }

    // Update the employee's response
    await prisma.profileAllocationEmployee.update({
      where: {
        id: employeeAllocation.id
      },
      data: {
        status,
        response: response || null,
        responseAt: new Date()
      }
    });

    // Create a notification for the employer
    await prisma.notification.create({
      data: {
        userId: allocation.createdById,
        title: `Response to Profile Allocation: ${allocation.jobTitle}`,
        message: `${session.user.name || session.user.email} has ${status.replace('_', ' ')} the profile allocation for "${allocation.jobTitle}".`,
        type: 'profile_allocation_response',
        relatedId: allocation.id,
        isRead: false
      }
    });

    res.status(200).json({
      message: 'Response submitted successfully',
      status,
      responseAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error submitting profile allocation response:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 