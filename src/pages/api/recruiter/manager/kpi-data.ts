import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let prisma;

  try {
    // Get a database connection
    prisma = await getConnection();

    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      releaseConnection();
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user is a manager
    if (session.user.role !== 'manager') {
      releaseConnection();
      return res.status(403).json({ error: 'Access denied. Only managers can access this resource.' });
    }

    if (req.method === 'GET') {
      // Get employees under this manager
      const managedEmployees = await prisma.user.findMany({
        where: {
          manager_id: session.user.id,
          role: 'employee'
        },
        select: {
          id: true,
          name: true
        }
      });

      // Get all employee IDs including the manager
      const employeeIds = [...managedEmployees.map(emp => emp.id), session.user.id];

      // Get profile allocations and their candidates count
      const kpiData = await prisma.$queryRaw`
        SELECT 
          pa.id AS "profileAllocationId",
          pa."jobTitle" AS "profileAllocationTitle",
          rc.recruiter_id AS "employeeId",
          u.name AS "employeeName",
          COUNT(rc.candidate_id) AS "candidatesAdded",
          pa."createdAt" AS "createdAt"
        FROM 
          profile_allocations pa
        JOIN 
          recruiter_candidates rc ON pa.id = rc.profile_allocation_id
        JOIN 
          users u ON rc.recruiter_id = u.id
        WHERE 
          rc.recruiter_id = ANY(${employeeIds})
        GROUP BY 
          pa.id, pa."jobTitle", rc.recruiter_id, u.name, pa."createdAt"
        ORDER BY 
          pa."createdAt" DESC
      `;

      releaseConnection();
      return res.status(200).json({ 
        kpiData,
        employees: managedEmployees
      });
    }

    // Handle other HTTP methods
    releaseConnection();
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in KPI data API:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 