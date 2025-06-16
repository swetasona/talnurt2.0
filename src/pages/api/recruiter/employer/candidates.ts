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
      // Fetch all candidates associated with the company
      const candidates = await prisma.candidates.findMany({
        where: {
          // For now, fetch all candidates as there might not be a company_id field
          // In a real implementation, you'd filter by company
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          created_at: true,
          skills: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // Format candidates data
      const formattedCandidates = candidates.map(candidate => {
        // Parse skills from JSON if needed
        let skillsArray: string[] = [];
        try {
          if (typeof candidate.skills === 'string') {
            skillsArray = JSON.parse(candidate.skills);
          } else if (Array.isArray(candidate.skills)) {
            skillsArray = candidate.skills as string[];
          }
        } catch (e) {
          console.error('Error parsing skills:', e);
        }

        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone || undefined,
          skills: skillsArray || [],
          experience: '1-3 years', // Placeholder
          status: 'new', // Default status
          createdAt: candidate.created_at.toISOString()
        };
      });

      // Release connection before returning
      releaseConnection();
      return res.status(200).json({ candidates: formattedCandidates });
    }

    // Handle other HTTP methods
    releaseConnection(); // Release connection before returning
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in candidates API:', error);
    
    // Check if this is a database connection error
    if (!connectionSuccessful) {
      console.error('Database connection failed in candidates API');
    }
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 