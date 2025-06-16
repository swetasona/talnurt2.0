import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

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
  
  const session = await getServerSession(req, res, authOptions);

  // Check authentication
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { id } = req.query;

  // GET - Fetch a specific report
  if (req.method === 'GET') {
    try {
      // Check if the report exists and the user is authorized to view it
      const reports: any[] = await prisma.$queryRaw`
        SELECT 
          r.*,
          a.name as author_name, 
          a.role as author_role,
          rc.name as recipient_name,
          rc.role as recipient_role
        FROM "reports" r
        JOIN "users" a ON r."authorId" = a.id
        JOIN "users" rc ON r."recipientId" = rc.id
        WHERE r.id = ${id as string}
      `;

      if (reports.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const report = reports[0];

      // Check if the user is authorized to view this report
      if (report.authorId !== userId && report.recipientId !== userId) {
        return res.status(403).json({ error: 'Not authorized to view this report' });
      }

      // Format the report for the frontend
      const formattedReport = {
        id: report.id,
        title: report.title,
        content: report.content,
        date: new Date(report.createdAt).toISOString().split('T')[0],
        recipient: `${report.recipient_name} (${report.recipient_role.charAt(0).toUpperCase() + report.recipient_role.slice(1)})`,
        recipientId: report.recipientId,
        authorId: report.authorId,
        authorName: report.author_name,
        status: report.status
      };

      return res.status(200).json(formattedReport);
    } catch (error) {
      console.error('Error fetching report:', error);
      return res.status(500).json({ error: 'Failed to fetch report' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
} 