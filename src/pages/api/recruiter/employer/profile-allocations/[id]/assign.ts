import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '../../../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Initialize connection success flag
  let connectionSuccessful = false;
  let prisma;

  try {
    // Only allow POST method
    if (req.method !== 'POST') {
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

    // Get the allocation ID from the URL
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      releaseConnection();
      return res.status(400).json({ error: 'Invalid allocation ID' });
    }

    // Get the employee IDs from the request body
    const { employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      releaseConnection();
      return res.status(400).json({ error: 'Please provide at least one employee ID' });
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
      return res.status(403).json({ error: 'Access denied. You can only modify allocations from your company.' });
    }

    // Verify all employees belong to the same company
    const employees = await prisma.user.findMany({
      where: {
        id: { in: employeeIds },
        company_id: user.company_id
      },
      select: { id: true }
    });

    if (employees.length !== employeeIds.length) {
      releaseConnection();
      return res.status(400).json({ error: 'One or more employees do not exist or do not belong to your company.' });
    }

    // Check if any employees are already assigned to this allocation
    const existingAllocations = await prisma.profileAllocationEmployee.findMany({
      where: {
        profileAllocationId: id,
        employeeId: { in: employeeIds }
      },
      select: { employeeId: true }
    });

    const existingEmployeeIds = existingAllocations.map(ea => ea.employeeId);
    const newEmployeeIds = employeeIds.filter(empId => !existingEmployeeIds.includes(empId));

    if (newEmployeeIds.length === 0) {
      releaseConnection();
      return res.status(400).json({ error: 'All selected employees are already assigned to this allocation.' });
    }

    // Create the new allocations
    const now = new Date().toISOString();
    const allocationsToCreate = newEmployeeIds.map(employeeId => ({
      profileAllocationId: id,
      employeeId,
      status: 'active',
      notifiedAt: now
    }));

    // Create the allocations in a transaction
    await prisma.$transaction(
      allocationsToCreate.map(allocation => 
        prisma.profileAllocationEmployee.create({
          data: allocation
        })
      )
    );

    // Return success response
    releaseConnection();
    return res.status(200).json({ 
      message: 'Employees assigned successfully',
      assignedCount: newEmployeeIds.length,
      alreadyAssignedCount: existingEmployeeIds.length
    });
  } catch (error) {
    console.error('Error in assign API:', error);
    
    // Check if this is a database connection error
    if (!connectionSuccessful) {
      console.error('Database connection failed in assign API');
    }
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 