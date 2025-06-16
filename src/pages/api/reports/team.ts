import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

// Add response caching
const CACHE_DURATION = 30; // seconds
let responseCache: {
  [userId: string]: {
    data: any[];
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
  
  console.log('API Request to /api/reports/team. Session:', session ? 'Authenticated' : 'Not authenticated');
  
  // Check authentication
  if (!session || !session.user) {
    console.error('No session or user found for team reports API');
    return res.status(401).json({ error: 'Unauthorized: No valid session found' });
  }

  const userId = session.user.id;
  const userRole = session.user.role;
  
  console.log(`[TEAM-REPORTS] User ID: ${userId}, Role: ${userRole}`);

  // Only managers and above can view team reports
  if (!['manager', 'employer', 'admin'].includes(userRole)) {
    console.log(`[TEAM-REPORTS] User with role ${userRole} is not authorized to view team reports`);
    return res.status(403).json({ error: 'Unauthorized: Only managers and above can view team reports' });
  }

  // Check cache first
  const now = Math.floor(Date.now() / 1000);
  if (responseCache[userId] && (now - responseCache[userId].timestamp) < CACHE_DURATION) {
    console.log(`[TEAM-REPORTS] Returning cached data for user ${userId}`);
    
    // Add cache control headers
    res.setHeader('Cache-Control', `private, max-age=${CACHE_DURATION}`);
    res.setHeader('X-Cache', 'HIT');
    
    return res.status(200).json(responseCache[userId].data);
  }

  try {
    // First check if the reports table exists
    try {
      console.log('[TEAM-REPORTS] Checking if reports table exists');
      await prisma.$executeRaw`SELECT 1 FROM reports LIMIT 1`;
      console.log('[TEAM-REPORTS] Reports table exists');
    } catch (error) {
      // If table doesn't exist, return empty array
      console.error('[TEAM-REPORTS] Reports table does not exist yet:', error);
      return res.status(200).json([]);
    }

    let reports: any[] = [];
    
    if (userRole === 'manager') {
      console.log('[TEAM-REPORTS] Processing manager role request');
      
      // Get team members managed by this manager
      const teamMembers = await prisma.user.findMany({
        where: {
          manager_id: userId,
          role: 'employee',
          is_active: true
        },
        select: {
          id: true,
          name: true
        }
      });
      
      // Extract team member IDs
      const teamMemberIds = teamMembers.map(member => member.id);
      
      console.log(`[TEAM-REPORTS] Manager has ${teamMemberIds.length} team members:`);
      teamMembers.forEach(member => {
        console.log(`[TEAM-REPORTS] - Team member: ${member.name} (${member.id})`);
      });
      
      if (teamMemberIds.length === 0) {
        console.log('[TEAM-REPORTS] No team members found, returning empty array');
        return res.status(200).json([]);
      }
      
      // Managers can ONLY see reports FROM their team members that were sent TO them
      const query = `
        SELECT 
          r.*, 
          a.name as author_name, 
          a.role as author_role,
          rc.name as recipient_name,
          rc.role as recipient_role
        FROM reports r
        JOIN users a ON r."authorId" = a.id
        JOIN users rc ON r."recipientId" = rc.id
        WHERE r."recipientId" = '${userId}' 
        AND r."authorId" IN (${teamMemberIds.map(id => `'${id}'`).join(',')})
        ORDER BY r."createdAt" DESC
        LIMIT 50
      `;
      
      console.log('[TEAM-REPORTS] Executing SQL query:', query);
      
      reports = await prisma.$queryRawUnsafe(query);
      
      console.log(`[TEAM-REPORTS] Found ${reports.length} reports for manager`);
      if (reports.length > 0) {
        reports.forEach((report, index) => {
          console.log(`[TEAM-REPORTS] Report ${index + 1}: "${report.title}" from ${report.author_name}`);
        });
      }
    } else if (userRole === 'employer') {
      console.log('[TEAM-REPORTS] Processing employer role request');
      
      // Employers can see reports from managers and employees in their company that were sent to them
      const company = await prisma.user.findUnique({
        where: { id: userId },
        select: { company_id: true }
      });
      
      console.log(`[TEAM-REPORTS] Employer company_id: ${company?.company_id || 'null'}`);
      
      if (company?.company_id) {
        const query = `
          SELECT 
            r.*, 
            a.name as author_name, 
            a.role as author_role,
            rc.name as recipient_name,
            rc.role as recipient_role
          FROM reports r
          JOIN users a ON r."authorId" = a.id
          JOIN users rc ON r."recipientId" = rc.id
          WHERE r."recipientId" = '${userId}' 
          AND (a.role = 'manager' OR a.role = 'employee')
          AND a.company_id = '${company.company_id}'
          ORDER BY r."createdAt" DESC
          LIMIT 50
        `;
        
        console.log('[TEAM-REPORTS] Executing SQL query:', query);
        
        reports = await prisma.$queryRawUnsafe(query);
        
        console.log(`[TEAM-REPORTS] Found ${reports.length} reports for employer`);
      } else {
        console.log('[TEAM-REPORTS] Employer has no company_id, returning empty array');
      }
    } else if (userRole === 'admin') {
      console.log('[TEAM-REPORTS] Processing admin role request');
      
      // Admins can see all reports except those they authored
      const query = `
        SELECT 
          r.*, 
          a.name as author_name, 
          a.role as author_role,
          rc.name as recipient_name,
          rc.role as recipient_role
        FROM reports r
        JOIN users a ON r."authorId" = a.id
        JOIN users rc ON r."recipientId" = rc.id
        WHERE r."authorId" != '${userId}'
        ORDER BY r."createdAt" DESC
        LIMIT 50
      `;
      
      console.log('[TEAM-REPORTS] Executing SQL query:', query);
      
      reports = await prisma.$queryRawUnsafe(query);
      
      console.log(`[TEAM-REPORTS] Found ${reports.length} reports for admin`);
    }

    // Format the reports for the frontend
    const formattedReports = reports.map(report => ({
      id: report.id,
      title: report.title,
      content: report.content,
      date: new Date(report.createdAt).toISOString().split('T')[0],
      recipient: `${report.recipient_name} (${report.recipient_role.charAt(0).toUpperCase() + report.recipient_role.slice(1)})`,
      recipientId: report.recipientId,
      authorId: report.authorId,
      authorName: report.author_name,
      authorRole: report.author_role,
      status: report.status
    }));

    // Update cache
    responseCache[userId] = {
      data: formattedReports,
      timestamp: now
    };
    
    // Add cache control headers
    res.setHeader('Cache-Control', `private, max-age=${CACHE_DURATION}`);
    res.setHeader('X-Cache', 'MISS');

    console.log(`[TEAM-REPORTS] Returning ${formattedReports.length} formatted reports`);
    return res.status(200).json(formattedReports);
  } catch (error) {
    console.error('[TEAM-REPORTS] Error fetching team reports:', error);
    return res.status(500).json({ error: 'Failed to fetch team reports' });
  }
} 