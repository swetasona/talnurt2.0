import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

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

  // Get session using getServerSession (more reliable server-side)
  const session = await getServerSession(req, res, authOptions);
  
  console.log('API Request to /api/reports. Method:', req.method);
  console.log('Session:', session ? 'Authenticated' : 'Not authenticated');
  console.log('Cookies:', req.headers.cookie);
  
  // Check authentication
  if (!session || !session.user) {
    console.error('No session or user found for report API');
    return res.status(401).json({ error: 'Unauthorized: No valid session found' });
  }

  const userId = session.user.id;
  const userRole = session.user.role;
  
  console.log(`User ID: ${userId}, Role: ${userRole}`);

  // GET - Fetch all reports for the current user
  if (req.method === 'GET') {
    try {
      // First check if the reports table exists
      try {
        await prisma.$executeRaw`SELECT 1 FROM "reports" LIMIT 1`;
      } catch (error) {
        // If table doesn't exist, return empty array
        console.error('Reports table does not exist yet:', error);
        return res.status(200).json([]);
      }

      let reports: any[] = [];

      // For managers, we need to filter the reports they can see:
      // 1. Reports they've authored (sent to employers or admin)
      // 2. Reports they've received (from their team members)
      if (userRole === 'manager') {
        console.log('Fetching filtered reports for manager:', userId);
        
        // Get manager's company
        const manager = await prisma.user.findUnique({
          where: { id: userId },
          select: { company_id: true }
        });
        
        if (!manager?.company_id) {
          return res.status(200).json([]);
        }
        
        // Custom query for managers - only show reports they've authored to employers/admins
        reports = await prisma.$queryRaw`
          SELECT 
            r.*, 
            a.name as author_name, 
            a.role as author_role,
            rc.name as recipient_name,
            rc.role as recipient_role
          FROM "reports" r
          JOIN "users" a ON r."authorId" = a.id
          JOIN "users" rc ON r."recipientId" = rc.id
          WHERE 
            r."authorId" = ${userId} AND (rc.role = 'employer' OR rc.role = 'admin')
          ORDER BY r."createdAt" DESC
        `;
        
        console.log(`Found ${reports.length} reports from manager to employers/admins`);
      } else {
        // For other roles, use the original query
        reports = await prisma.$queryRaw`
          SELECT 
            r.*, 
            a.name as author_name, 
            a.role as author_role,
            rc.name as recipient_name,
            rc.role as recipient_role
          FROM "reports" r
          JOIN "users" a ON r."authorId" = a.id
          JOIN "users" rc ON r."recipientId" = rc.id
          WHERE r."authorId" = ${userId} OR r."recipientId" = ${userId}
          ORDER BY r."createdAt" DESC
        `;
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
        status: report.status
      }));

      return res.status(200).json(formattedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(200).json([]); // Return empty array to prevent UI errors
    }
  }

  // POST - Create a new report
  if (req.method === 'POST') {
    try {
      console.log('Processing POST request to create a report');
      console.log('Request body:', req.body);
      
      const { title, content, recipientIds } = req.body;
      
      // Check if we have a single recipientId (backward compatibility) or multiple recipientIds
      const recipientsToProcess = Array.isArray(recipientIds) ? recipientIds : [req.body.recipientId];
      
      console.log(`Report data: Title: ${title}, Content length: ${content?.length || 0}, Recipients: ${recipientsToProcess.join(', ')}`);

      // Validate required fields
      if (!title || !content || !recipientsToProcess.length) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get current user's info including company_id and manager_id
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          company_id: true,
          manager_id: true
        }
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // For multiple recipients, process each one
      const createdReports = [];
      const invalidRecipients = [];

      for (const recipientId of recipientsToProcess) {
        // Verify the recipient's role is appropriate for the sender's role
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId },
          select: { 
            role: true, 
            name: true,
            company_id: true 
          }
        });

        if (!recipient) {
          invalidRecipients.push(`Recipient ID ${recipientId} not found`);
          continue;
        }

        const recipientRole = recipient.role;
        
        console.log(`Recipient ${recipient.name} has role: ${recipientRole}`);
        
        // Define valid recipient roles for each sender role
        let isValidRecipient = false;
        
        console.log(`User role: ${userRole}, trying to submit to role: ${recipientRole}`);
        
        // For employees, check if recipient is their direct manager or an employer from their company
        if (userRole === 'employee') {
          // If recipient is a manager, they must be the employee's direct manager
          if (recipientRole === 'manager') {
            isValidRecipient = recipientId === currentUser.manager_id;
            if (!isValidRecipient) {
              console.log(`Manager validation failed: User's manager_id: ${currentUser.manager_id}, Attempted recipient: ${recipientId}`);
            }
          } 
          // If recipient is an employer, they must be from the same company
          else if (recipientRole === 'employer') {
            isValidRecipient = recipient.company_id === currentUser.company_id;
            if (!isValidRecipient) {
              console.log(`Employer company mismatch: User company ${currentUser.company_id} vs Recipient company ${recipient.company_id}`);
            }
          }
        } 
        // For other roles, use the same validation logic as before
        else if (userRole === 'manager') {
          if (recipientRole === 'admin') {
            isValidRecipient = true;
          } else if (recipientRole === 'employer') {
            isValidRecipient = recipient.company_id === currentUser.company_id;
          }
        } 
        else if (userRole === 'recruiter') {
          if (recipientRole === 'admin') {
            isValidRecipient = true;
          } else if (recipientRole === 'manager') {
            isValidRecipient = recipient.company_id === currentUser.company_id;
          }
        } 
        else if (userRole === 'employer' && recipientRole === 'admin') {
          isValidRecipient = true;
        } 
        else if (userRole === 'admin' && recipientRole === 'admin') {
          isValidRecipient = true;
        }

        // If roles match, ensure company match for non-admin recipients when needed
        if (isValidRecipient && 
            recipientRole !== 'admin' && 
            userRole !== 'admin') {
          
          // For managers, ensure they can only receive reports from their team members
          if (recipientRole === 'manager') {
            // Get the team members managed by this manager
            const isTeamMember = await prisma.user.findFirst({
              where: {
                id: userId, // Current user/author
                manager_id: recipientId, // Recipient is their manager
              }
            });
            
            if (!isTeamMember) {
              isValidRecipient = false;
              console.log(`Manager can only receive reports from their team members. User ID: ${userId}, Manager ID: ${recipientId}`);
            }
          }
          
          // For all non-admin users, ensure company match
          if (currentUser.company_id !== recipient.company_id) {
            isValidRecipient = false;
            console.log(`Company mismatch: User company ${currentUser.company_id} vs Recipient company ${recipient.company_id}`);
          }
        }
        
        if (!isValidRecipient) {
          invalidRecipients.push(`${recipient.name} (${recipientRole})`);
          continue;
        }

        // Create the report for this recipient
        const report = await prisma.report.create({
          data: {
            title,
            content,
            authorId: userId,
            recipientId,
            status: 'Unread'
          }
        });

        // Format response
        const formattedReport = {
          id: report.id,
          title: report.title,
          content: report.content,
          date: new Date(report.createdAt).toISOString().split('T')[0],
          recipient: `${recipient.name} (${recipientRole.charAt(0).toUpperCase() + recipientRole.slice(1)})`,
          recipientId: report.recipientId,
          authorId: report.authorId,
          status: report.status
        };

        createdReports.push(formattedReport);
      }

      // If there were invalid recipients, return a warning
      if (invalidRecipients.length > 0) {
        if (createdReports.length === 0) {
          return res.status(403).json({ 
            error: `You cannot send reports to these recipients: ${invalidRecipients.join(', ')}`
          });
        } else {
          // Some reports were created, return those with a warning
          return res.status(201).json({
            reports: createdReports,
            warning: `Reports not sent to: ${invalidRecipients.join(', ')}`,
            firstReport: createdReports[0] // For backward compatibility
          });
        }
      }

      // All reports were created successfully
      return res.status(201).json(
        createdReports.length === 1 
          ? createdReports[0] // Return just the report for backward compatibility
          : { reports: createdReports, firstReport: createdReports[0] }
      );
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
} 