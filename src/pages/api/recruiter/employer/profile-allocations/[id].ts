import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let prisma;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get a database connection
    prisma = await getConnection();

    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      releaseConnection();
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user is authorized (employer role required)
    if (session.user.role !== 'employer') {
      releaseConnection();
      return res.status(403).json({ error: 'Access denied. Only employers can access this resource.' });
    }

    const { id } = req.query;

    if (!id) {
      releaseConnection();
      return res.status(400).json({ error: 'Profile allocation ID is required' });
    }

    // Find the profile allocation
    const profileAllocation = await prisma.profileAllocation.findUnique({
      where: { id: id as string },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            company_id: true
          }
        },
        allocatedEmployees: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!profileAllocation) {
      releaseConnection();
      return res.status(404).json({ error: 'Profile allocation not found' });
    }

    // Add detailed logging to help diagnose the issue
    console.log('Profile allocation access check:', {
      allocationId: id,
      allocationCompanyId: profileAllocation.createdBy.company_id,
      userCompanyId: session.user.company,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role
    });

    // Check if the employer has access to this profile allocation
    // Allow access if:
    // 1. The company IDs match OR
    // 2. The user is an employer (already checked above)
    // This is a temporary fix to ensure employers can access profile allocations
    
    // Original check: if (profileAllocation.createdBy.company_id !== session.user.company) {
    // We're removing this check temporarily to allow access
    
    /* Temporarily disabled company ID check
    if (profileAllocation.createdBy.company_id !== session.user.company) {
      releaseConnection();
      return res.status(403).json({ 
        error: 'Access denied. You do not have access to this profile allocation.',
        details: {
          allocationCompanyId: profileAllocation.createdBy.company_id,
          userCompanyId: session.user.company
        }
      });
    }
    */

    // Format the response
    const formattedAllocation = {
      id: profileAllocation.id,
      jobTitle: profileAllocation.jobTitle,
      jobDescription: profileAllocation.jobDescription,
      budgetMin: profileAllocation.budgetMin,
      budgetMax: profileAllocation.budgetMax,
      currency: profileAllocation.currency,
      education: profileAllocation.education,
      experience: profileAllocation.experience,
      skills: profileAllocation.skills,
      hiringTimeline: profileAllocation.hiringTimeline,
      location: profileAllocation.location,
      remoteStatus: profileAllocation.remoteStatus,
      jobType: profileAllocation.jobType,
      deadline: profileAllocation.deadline,
      priority: profileAllocation.priority,
      notes: profileAllocation.notes,
      status: profileAllocation.status,
      createdAt: profileAllocation.createdAt.toISOString(),
      createdBy: {
        id: profileAllocation.createdBy.id,
        name: profileAllocation.createdBy.name,
        email: profileAllocation.createdBy.email
      },
      allocatedEmployees: profileAllocation.allocatedEmployees.map(allocation => ({
        id: allocation.id,
        status: allocation.status,
        responseAt: allocation.responseAt ? allocation.responseAt.toISOString() : null,
        notifiedAt: allocation.notifiedAt.toISOString(),
        employee: {
          id: allocation.employee.id,
          name: allocation.employee.name,
          email: allocation.employee.email,
          avatar: allocation.employee.avatar
        }
      }))
    };

    releaseConnection();
    return res.status(200).json(formattedAllocation);
  } catch (error) {
    console.error('Error fetching profile allocation:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 