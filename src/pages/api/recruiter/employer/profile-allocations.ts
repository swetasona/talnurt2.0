import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Initialize connection success flag
  let connectionSuccessful = false;
  let prisma;

  try {
    // Get a database connection
    prisma = await getConnection();

    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      releaseConnection(); // Release connection before returning
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user is an employer or manager
    if (session.user.role !== 'employer' && session.user.role !== 'manager') {
      releaseConnection(); // Release connection before returning
      return res.status(403).json({ error: 'Access denied. Only employers and managers can access this resource.' });
    }

    // Get user's company ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { company_id: true }
    });

    // Mark connection as successful once we've made a query
    connectionSuccessful = true;

    if (!user || !user.company_id) {
      releaseConnection(); // Release connection before returning
      return res.status(404).json({ error: 'Company not found for this user.' });
    }

    if (req.method === 'GET') {
      // Fetch all profile allocations for the company
      const allocations = await prisma.profileAllocation.findMany({
        where: {
          createdBy: {
            company_id: user.company_id
          }
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          allocatedEmployees: {
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Release connection before returning
      releaseConnection();
      return res.status(200).json({ allocations });
    }

    // Handle other HTTP methods
    releaseConnection(); // Release connection before returning
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in profile-allocations API:', error);
    
    // Check if this is a database connection error
    if (!connectionSuccessful) {
      console.error('Database connection failed in profile-allocations API');
    }
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 