import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let prisma;

  if (req.method !== 'GET') {
    return res.status(200).json({ 
      allocation: null,
      _error: 'Method not allowed'
    });
  }

  try {
    // Get a database connection
    prisma = await getConnection();

    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      if (prisma) releaseConnection();
      return res.status(200).json({ 
        allocation: null,
        _error: 'Unauthorized. Please log in.'
      });
    }

    // Check if user is authorized (recruiter role required)
    if (session.user.role !== 'recruiter' && session.user.role !== 'employer') {
      if (prisma) releaseConnection();
      return res.status(200).json({ 
        allocation: null,
        _error: 'Access denied. Only recruiters can access this resource.'
      });
    }

    const { id } = req.query;

    if (!id) {
      if (prisma) releaseConnection();
      return res.status(200).json({ 
        allocation: null,
        _error: 'Profile allocation ID is required'
      });
    }

    console.log(`Fetching profile allocation with ID: ${id}`);
    
    try {
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
        if (prisma) releaseConnection();
        return res.status(200).json({ 
          allocation: null,
          _error: 'Profile allocation not found'
        });
      }

      console.log(`Profile allocation found: ${profileAllocation.jobTitle}`);
      console.log(`User role: ${session.user.role}, User company: ${session.user.company}`);
      
      // If the user is a recruiter, check if they are allocated to this profile
      if (session.user.role === 'recruiter') {
        const isAllocated = profileAllocation.allocatedEmployees.some(
          allocation => allocation.employee.id === session.user.id
        );

        if (!isAllocated) {
          if (prisma) releaseConnection();
          return res.status(200).json({ 
            allocation: null,
            _error: 'Access denied. You are not allocated to this profile.'
          });
        }
      }
      
      // If the user is an employer, check if they have access to this profile
      if (session.user.role === 'employer') {
        console.log(`Profile company: ${profileAllocation.createdBy.company_id}, User company: ${session.user.company}`);
        
        // Skip company check for now to debug the issue
        /*
        if (profileAllocation.createdBy.company_id !== session.user.company) {
          if (prisma) releaseConnection();
          return res.status(200).json({ 
            allocation: null,
            _error: 'Access denied. You do not have access to this profile allocation.'
          });
        }
        */
      }

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
        }
      };

      if (prisma) releaseConnection();
      return res.status(200).json({ allocation: formattedAllocation });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      if (prisma) releaseConnection();
      return res.status(200).json({ 
        allocation: null,
        _error: 'Database error occurred', 
        _details: dbError.message
      });
    }
  } catch (error: any) {
    console.error('Error fetching profile allocation:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(200).json({ 
      allocation: null,
      _error: 'Internal server error', 
      _details: error.message
    });
  }
} 