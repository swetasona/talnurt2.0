import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

// Add response caching
const CACHE_DURATION = 30; // seconds
let responseCache: {
  [userId: string]: {
    data: any;
    timestamp: number;
  }
} = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get session using getServerSession
  const session = await getServerSession(req, res, authOptions);
  
  // Check authentication
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized: No valid session found' });
  }

  const userId = session.user.id;
  const userRole = session.user.role;
  
  console.log(`[UNREAD-COUNT] Processing request for user ${userId} with role ${userRole}`);

  // Only managers and employers need unread counts
  if (!['manager', 'employer'].includes(userRole)) {
    return res.status(200).json({ total: 0, managers: 0, employees: 0 });
  }
  
  // Check cache first
  const now = Math.floor(Date.now() / 1000);
  if (responseCache[userId] && (now - responseCache[userId].timestamp) < CACHE_DURATION) {
    // Add cache control headers
    res.setHeader('Cache-Control', `private, max-age=${CACHE_DURATION}`);
    res.setHeader('X-Cache', 'HIT');
    
    return res.status(200).json(responseCache[userId].data);
  }

  try {
    // First check if the reports table exists
    try {
      await prisma.$executeRaw`SELECT 1 FROM reports LIMIT 1`;
    } catch (error) {
      // If table doesn't exist, return zero counts
      return res.status(200).json({ total: 0, managers: 0, employees: 0 });
    }

    let unreadCounts = {
      total: 0,
      managers: 0,
      employees: 0
    };

    if (userRole === 'manager') {
      // For managers, count unread reports from their team members
      const teamMemberIds = await prisma.user.findMany({
        where: {
          manager_id: userId,
          role: 'employee'
        },
        select: {
          id: true
        }
      }).then(users => users.map(user => user.id));

      if (teamMemberIds.length > 0) {
        // Count unread reports from team members
        const unreadCount = await prisma.report.count({
          where: {
            recipientId: userId,
            authorId: {
              in: teamMemberIds
            },
            status: 'unread'
          }
        });

        unreadCounts = {
          total: unreadCount,
          employees: unreadCount,
          managers: 0
        };
      }
    } else if (userRole === 'employer') {
      // For employers, get their company ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { company_id: true }
      });

      if (user?.company_id) {
        // Count unread reports from managers in the same company
        const unreadManagerReports = await prisma.report.count({
          where: {
            recipientId: userId,
            author: {
              role: 'manager',
              company_id: user.company_id
            },
            status: 'unread'
          }
        });

        // Count unread reports from employees in the same company
        const unreadEmployeeReports = await prisma.report.count({
          where: {
            recipientId: userId,
            author: {
              role: 'employee',
              company_id: user.company_id
            },
            status: 'unread'
          }
        });

        unreadCounts = {
          total: unreadManagerReports + unreadEmployeeReports,
          managers: unreadManagerReports,
          employees: unreadEmployeeReports
        };
      }
    }
    
    // Update cache
    responseCache[userId] = {
      data: unreadCounts,
      timestamp: now
    };
    
    // Add cache control headers
    res.setHeader('Cache-Control', `private, max-age=${CACHE_DURATION}`);
    res.setHeader('X-Cache', 'MISS');

    return res.status(200).json(unreadCounts);
  } catch (error) {
    console.error('[UNREAD-COUNT] Error fetching unread counts:', error);
    return res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
} 