import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../../../utils/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminToken(req);

    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
    }

    // Handle GET requests (listing all deletion requests)
    if (req.method === 'GET') {
      // Get all deletion requests from the reports table with type = employee_deletion
      const reports = await prisma.report.findMany({
        where: {
          title: { startsWith: 'Deletion Request for' }
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform the reports into deletion request format
      const deletionRequests = await Promise.all(reports.map(async (report) => {
        try {
          const content = JSON.parse(report.content);
          
          // Get employee info
          const employee = await prisma.user.findUnique({
            where: { id: content.employee_id },
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          });

          // Get company info
          const company = await prisma.companies.findUnique({
            where: { id: content.company_id },
            select: {
              id: true,
              name: true
            }
          });

          return {
            id: report.id,
            employee: employee || {
              id: content.employee_id,
              name: content.employee_name || 'Unknown Employee',
              email: content.employee_email || 'unknown@example.com',
              role: content.employee_role || 'unknown'
            },
            requested_by_user: {
              id: report.author.id,
              name: report.author.name,
              email: report.author.email
            },
            company: company || {
              id: content.company_id,
              name: 'Unknown Company'
            },
            reason: content.reason,
            status: report.status === 'Unread' ? 'pending' : (report.status === 'Read' ? 'approved' : 'rejected'),
            created_at: report.createdAt,
            processed_at: report.updatedAt !== report.createdAt ? report.updatedAt : undefined,
            admin_notes: content.admin_notes
          };
        } catch (e) {
          // If parsing fails, return a simplified version
          return {
            id: report.id,
            employee: {
              id: 'unknown',
              name: 'Unknown Employee',
              email: 'unknown@example.com',
              role: 'unknown'
            },
            requested_by_user: {
              id: report.author.id,
              name: report.author.name,
              email: report.author.email
            },
            company: {
              id: 'unknown',
              name: 'Unknown Company'
            },
            reason: 'Invalid request format',
            status: report.status,
            created_at: report.createdAt
          };
        }
      }));

      return res.status(200).json({ deletionRequests });
    }

    // Handle PATCH/PUT requests (updating request status)
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const { requestId, status, admin_notes } = req.body;

      if (!requestId || !status) {
        return res.status(400).json({ error: 'Request ID and status are required.' });
      }

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be either "approved" or "rejected".' });
      }

      // Find the report
      const report = await prisma.report.findUnique({
        where: { id: requestId }
      });

      if (!report) {
        return res.status(404).json({ error: 'Deletion request not found.' });
      }

      try {
        // Parse the content
        const content = JSON.parse(report.content);
        
        // Update the content with admin notes
        content.admin_notes = admin_notes || null;
        content.processed_at = new Date();
        content.status = status;

        // Update the report status
        const updatedReport = await prisma.report.update({
          where: { id: requestId },
          data: {
            status: status === 'approved' ? 'Read' : 'Rejected',
            content: JSON.stringify(content),
            updatedAt: new Date()
          }
        });

        // If approved, set the employee to inactive
        if (status === 'approved' && content.employee_id) {
          await prisma.user.update({
            where: { id: content.employee_id },
            data: {
              is_active: false,
              deactivated_at: new Date()
            }
          });
        }

        return res.status(200).json({
          success: true,
          message: `Deletion request ${status}`,
          request: updatedReport
        });
      } catch (error) {
        console.error('Error processing deletion request:', error);
        return res.status(500).json({ error: 'Failed to process request. Invalid content format.' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling employee deletion request:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  } finally {
    await prisma.$disconnect();
  }
} 