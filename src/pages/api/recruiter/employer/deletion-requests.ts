import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the session to verify the user is authenticated and has employer access
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user has employer access
    if (session.user.role !== 'employer') {
      return res.status(403).json({ error: 'Employer access required.' });
    }

    // Get employer's company ID
    const employer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { company_id: true }
    });

    if (!employer || !employer.company_id) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Handle POST requests (creating a deletion request)
    if (req.method === 'POST') {
      const { employee_id, reason } = req.body;

      if (!employee_id || !reason) {
        return res.status(400).json({ error: 'Employee ID and reason are required.' });
      }

      // Verify the employee exists and belongs to the same company
      const employee = await prisma.user.findUnique({
        where: { 
          id: employee_id
        },
        select: { 
          id: true, 
          name: true,
          email: true, 
          role: true,
          company_id: true
        }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      // Verify employee belongs to the employer's company
      if (employee.company_id !== employer.company_id) {
        return res.status(403).json({ error: 'This employee is not part of your company.' });
      }

      // Get admin user for recipient
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' },
        select: { id: true }
      });

      if (!adminUser) {
        return res.status(500).json({ error: 'Admin user not found. Cannot submit deletion request.' });
      }

      // Check if there's already a pending deletion request in the Report model
      const existingRequest = await prisma.report.findFirst({
        where: {
          authorId: session.user.id,
          title: `Deletion Request for ${employee.name}`,
          status: 'Unread'
        }
      });

      if (existingRequest) {
        return res.status(400).json({ 
          error: 'A deletion request for this employee is already pending.' 
        });
      }

      // Create a new deletion request using the Report model
      const deletionRequest = await prisma.report.create({
        data: {
          title: `Deletion Request for ${employee.name}`,
          content: JSON.stringify({
            type: 'employee_deletion',
            employee_id: employee_id,
            reason: reason,
            requested_by: session.user.id,
            company_id: employer.company_id,
            employee_name: employee.name,
            employee_email: employee.email,
            employee_role: employee.role,
            requested_at: new Date()
          }),
          status: 'Unread',
          authorId: session.user.id,
          recipientId: adminUser.id
        }
      });

      return res.status(201).json({ 
        success: true,
        message: 'Deletion request submitted successfully',
        request: {
          id: deletionRequest.id,
          employee_id,
          employee_name: employee.name,
          reason,
          status: 'pending',
          created_at: deletionRequest.createdAt
        }
      });
    }

    // Handle GET requests (listing deletion requests)
    if (req.method === 'GET') {
      // Fetch deletion requests from the Report model
      const reports = await prisma.report.findMany({
        where: {
          authorId: session.user.id,
          title: { startsWith: 'Deletion Request for' }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform the reports into deletion request format
      const deletionRequests = reports.map(report => {
        try {
          const content = JSON.parse(report.content);
          return {
            id: report.id,
            employee: {
              id: content.employee_id,
              name: content.employee_name,
              email: content.employee_email,
              role: content.employee_role
            },
            requested_by_user: {
              id: report.authorId
            },
            reason: content.reason,
            status: report.status === 'Unread' ? 'pending' : (report.status === 'Read' ? 'approved' : 'rejected'),
            created_at: report.createdAt
          };
        } catch (e) {
          // If parsing fails, return a simplified version
          return {
            id: report.id,
            employee: {
              id: 'unknown',
              name: 'Unknown Employee',
              email: 'unknown',
              role: 'unknown'
            },
            requested_by_user: {
              id: report.authorId
            },
            reason: 'Invalid request format',
            status: 'error',
            created_at: report.createdAt
          };
        }
      });

      return res.status(200).json({ deletionRequests });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling deletion request:', error);
    return res.status(500).json({ error: 'Failed to process deletion request' });
  } finally {
    await prisma.$disconnect();
  }
} 