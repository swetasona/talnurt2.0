import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '../../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Initialize connection success flag
  let connectionSuccessful = false;
  let prisma;

  try {
    // Only allow GET method
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

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

    // Get the profile allocation ID from the query
    const { profileAllocationId } = req.query;

    if (!profileAllocationId || typeof profileAllocationId !== 'string') {
      releaseConnection();
      return res.status(400).json({ error: 'Please provide a valid profile allocation ID' });
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

    // Verify the allocation belongs to the user's company
    const allocation = await prisma.profileAllocation.findUnique({
      where: { id: profileAllocationId },
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
      return res.status(403).json({ error: 'Access denied. You can only view allocations from your company.' });
    }

    // Get IDs of employees already assigned to this allocation
    const assignedEmployees = await prisma.profileAllocationEmployee.findMany({
      where: { profileAllocationId },
      select: { employeeId: true }
    });

    const assignedEmployeeIds = assignedEmployees.map(ae => ae.employeeId);

    // Get all employees from the company that are not already assigned to this allocation
    const availableEmployees = await prisma.user.findMany({
      where: {
        company_id: user.company_id,
        role: { in: ['employee', 'manager'] },
        id: { notIn: assignedEmployeeIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Return the available employees
    releaseConnection();
    return res.status(200).json({ 
      employees: availableEmployees
    });
  } catch (error) {
    console.error('Error in available employees API:', error);
    
    // Check if this is a database connection error
    if (!connectionSuccessful) {
      console.error('Database connection failed in available employees API');
    }
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 