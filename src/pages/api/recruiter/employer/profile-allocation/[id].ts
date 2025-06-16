import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '../../../auth/[...nextauth]';

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

    // Get the allocation ID from the URL
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      releaseConnection();
      return res.status(400).json({ error: 'Invalid allocation ID' });
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

    // Handle DELETE request
    if (req.method === 'DELETE') {
      // First, verify the allocation belongs to the user's company
      const allocation = await prisma.profileAllocation.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: { company_id: true }
          }
        }
      });

      if (!allocation) {
        releaseConnection();
        return res.status(404).json({ error: 'Profile allocation not found.' });
      }

      if (allocation.createdBy.company_id !== user.company_id) {
        releaseConnection();
        return res.status(403).json({ error: 'Access denied. You can only delete allocations from your company.' });
      }

      // Delete associated records first (maintain referential integrity)
      await prisma.profileAllocationEmployee.deleteMany({
        where: { profileAllocationId: id }
      });

      // Then delete the profile allocation
      await prisma.profileAllocation.delete({
        where: { id }
      });

      releaseConnection();
      return res.status(200).json({ message: 'Profile allocation deleted successfully.' });
    }

    // Handle other HTTP methods
    releaseConnection();
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in profile-allocation API:', error);
    
    // Check if this is a database connection error
    if (!connectionSuccessful) {
      console.error('Database connection failed in profile-allocation API');
    }
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 