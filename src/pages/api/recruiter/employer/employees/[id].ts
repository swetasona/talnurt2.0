import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has employer access
    if (session.user.role !== 'employer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    // Get the current user's company information
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        company_id: true
      }
    });

    if (!currentUser?.company_id) {
      return res.status(403).json({ error: 'No company associated with your account' });
    }

    // Get employee details
    const employee = await prisma.user.findUnique({
      where: { 
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
        company_id: true,
        is_active: true,
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee belongs to the same company as the employer
    const sameCompany = employee.company_id === currentUser.company_id;

    // If not in the same company, check if this employee has submitted candidates for any of the employer's profile allocations
    if (!sameCompany) {
      console.log(`Employee ${id} company (${employee.company_id}) doesn't match employer company (${currentUser.company_id}). Checking profile allocations...`);
      
      // Find profile allocations created by the current user (employer)
      const employerProfileAllocations = await prisma.profileAllocation.findMany({
        where: {
          createdBy: {
            id: session.user.id
          }
        },
        select: {
          id: true
        }
      });
      
      const profileAllocationIds = employerProfileAllocations.map(pa => pa.id);
      
      if (profileAllocationIds.length === 0) {
        console.log('No profile allocations found for this employer');
        return res.status(403).json({ error: 'Access denied. This employee does not belong to your company.' });
      }
      
      console.log(`Found ${profileAllocationIds.length} profile allocations for employer`);
      
      // Check if the employee has submitted any candidates for these profile allocations
      const candidateSubmissions = await prisma.recruiter_candidates.findFirst({
        where: {
          recruiter_id: id,
          profile_allocation_id: {
            in: profileAllocationIds
          }
        }
      });
      
      if (!candidateSubmissions) {
        console.log('No candidate submissions found for this employee on employer profile allocations');
        return res.status(403).json({ error: 'Access denied. This employee does not belong to your company and has not submitted candidates for your profile allocations.' });
      }
      
      console.log('Found candidate submissions for this employee on employer profile allocations. Granting access.');
    }

    // Format employee data
    const formattedEmployee = {
      id: employee.id,
      name: employee.name || employee.email?.split('@')[0] || 'Unknown',
      email: employee.email,
      role: employee.role || 'employee',
      department: employee.department || 'No Department',
      avatar: employee.avatar,
      team: employee.team,
      is_active: employee.is_active
    };

    res.status(200).json(formattedEmployee);

  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 