import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let dbConnection;

  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Get a database connection
    dbConnection = await getConnection();

    if (req.method === 'GET') {
      // Get user details
      const user = await dbConnection.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          company_id: true
        }
      });

      // Get company details if company_id exists
      let company = null;
      if (user?.company_id) {
        // Use raw query to get company info since the model might not be in Prisma schema
        try {
          const companies = await dbConnection.$queryRaw<any[]>`
            SELECT * FROM companies WHERE id = ${user.company_id}
          `;
          company = companies[0] || null;
        } catch (err) {
          console.error('Error fetching company:', err);
        }
      }

      // Get profile allocations
      const profileAllocations = await dbConnection.profileAllocation.findMany({
        where: {},
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              company_id: true
            }
          }
        },
        take: 5 // Limit to 5 records
      });

      releaseConnection();
      return res.status(200).json({
        session: {
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
            company: session.user.company
          }
        },
        database: {
          user,
          company
        },
        profileAllocations: profileAllocations.map(pa => ({
          id: pa.id,
          jobTitle: pa.jobTitle,
          createdBy: {
            id: pa.createdBy.id,
            name: pa.createdBy.name,
            email: pa.createdBy.email,
            company_id: pa.createdBy.company_id
          }
        }))
      });
    } else if (req.method === 'POST') {
      // Update the user's company_id
      const { company_id } = req.body;
      
      if (!company_id) {
        releaseConnection();
        return res.status(400).json({ error: 'company_id is required' });
      }

      // Update the user's company_id in the database
      const updatedUser = await dbConnection.user.update({
        where: { id: session.user.id },
        data: { company_id }
      });

      releaseConnection();
      return res.status(200).json({ 
        message: 'User company_id updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          company_id: updatedUser.company_id
        }
      });
    }

    releaseConnection();
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in debug company-id API:', error);
    
    // Always release connection, even on error
    if (dbConnection) {
      releaseConnection();
    }
    
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message || 'Unknown error' 
    });
  }
} 