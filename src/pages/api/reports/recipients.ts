import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get user from session or JWT token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const session = await getSession({ req });
  
  const userId = token?.sub || session?.user?.id || '';
  const userRole = token?.role || session?.user?.role || '';
  
  console.log('User ID:', userId);
  console.log('User Role:', userRole);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get the user's company_id and manager_id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      company_id: true,
      role: true,
      manager_id: true
    }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userCompanyId = user.company_id;
  const userManagerId = user.manager_id;
  console.log('User Company ID:', userCompanyId);
  console.log('User Manager ID:', userManagerId);

  try {
    // Define valid recipient roles based on user role
    let validRecipientRoles: string[] = [];
    
    // Allow users to send reports based on their role
    if (userRole === 'employee') {
      validRecipientRoles = ['manager', 'employer'];
    } else if (userRole === 'manager') {
      validRecipientRoles = ['employer', 'admin'];
    } else if (userRole === 'recruiter') {
      validRecipientRoles = ['manager', 'admin'];
    } else if (userRole === 'employer') {
      validRecipientRoles = ['admin'];
    } else if (['admin'].includes(userRole)) {
      // Admins can send to other admins
      validRecipientRoles = ['admin'];
    }
    
    console.log('Valid recipient roles:', validRecipientRoles);
    
    if (validRecipientRoles.length === 0) {
      return res.status(200).json([]);
    }

    // Query based on user role
    let recipients;

    if (['admin'].includes(userRole)) {
      // Admins can send to other admins regardless of company
      recipients = await prisma.user.findMany({
        where: {
          role: {
            in: validRecipientRoles
          },
          id: {
            not: userId // Exclude current user
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: {
          name: 'asc'
        }
      });
    } else if (userRole === 'employee' && userCompanyId) {
      // For employees, only show their direct manager and employers from their company
      let employeeRecipients = [];

      // Add the direct manager if exists
      if (userManagerId) {
        const manager = await prisma.user.findUnique({
          where: { 
            id: userManagerId
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });

        if (manager) {
          employeeRecipients.push(manager);
        }
      }

      // Add employers from the same company
      const employers = await prisma.user.findMany({
        where: {
          role: 'employer',
          company_id: userCompanyId,
          id: {
            not: userId // Exclude current user
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      recipients = [...employeeRecipients, ...employers];
      
      // Sort by name
      recipients.sort((a, b) => a.name.localeCompare(b.name));
    } else if (userCompanyId) {
      // For other roles (manager, employer, recruiter), show valid recipients from the same company
      recipients = await prisma.user.findMany({
        where: {
          role: {
            in: validRecipientRoles
          },
          id: {
            not: userId // Exclude current user
          },
          company_id: userCompanyId // Only from same company
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: {
          name: 'asc'
        }
      });
    } else {
      // If user has no company, just show global admins (not superadmin)
      recipients = await prisma.user.findMany({
        where: {
          role: 'admin',
          id: {
            not: userId // Exclude current user
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: {
          name: 'asc'
        }
      });
    }
    
    // Before returning recipients to the client, map through and clean up name display
    recipients = recipients.map(recipient => ({
      ...recipient,
      name: recipient.name.replace(/\s*\([^)]*\)/g, '')
    }));
    
    console.log(`Found ${recipients.length} valid recipients`);
    
    return res.status(200).json(recipients);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    return res.status(500).json({ error: 'Failed to fetch recipients' });
  }
} 