import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';
import { generatedPasswords, getPassword, loadAllPasswordsFromDatabase } from '@/utils/passwordStorage';

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

    const userId = session.user.id;

    if (req.method === 'GET') {
      // Ensure passwords are loaded from database
      await loadAllPasswordsFromDatabase();
      
      // Get user creation requests for the employer's company
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          company_id: true,
          company: true 
        }
      });

      if (!user?.company_id && !user?.company) {
        return res.status(200).json({ requests: [] });
      }

      // Find the company by id first, then by name if needed
      let company = null;
      if (user.company_id) {
        company = await prisma.companies.findUnique({
          where: { id: user.company_id },
          select: { id: true }
        });
      }
      
      if (!company && user.company) {
        company = await prisma.companies.findFirst({
          where: { name: user.company },
          select: { id: true }
        });
      }

      if (!company) {
        return res.status(200).json({ requests: [] });
      }

      const requests = await prisma.user_creation_requests.findMany({
        where: { 
          company_id: company.id, // Use the company.id from the companies table
          requested_by: userId 
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Add passwords to approved requests
      const requestsWithPasswords = await Promise.all(requests.map(async (request: any) => {
        if (request.status === 'approved') {
          // First check in-memory cache
          if (generatedPasswords[request.id]) {
            return {
              ...request,
              password: generatedPasswords[request.id]
            };
          }
          
          // Try to get directly from metadata
          try {
            if (request.metadata) {
              const metadata = JSON.parse(request.metadata);
              if (metadata.password) {
                // Store in memory for future access
                generatedPasswords[request.id] = metadata.password;
                return {
                  ...request,
                  password: metadata.password
                };
              }
            }
          } catch (error) {
            console.error(`Error parsing metadata for request ${request.id}:`, error);
          }
          
          // Otherwise, try to get from database
          const password = await getPassword(request.id);
          if (password) {
            return {
              ...request,
              password
            };
          }
        }
        return request;
      }));

      return res.status(200).json({ requests: requestsWithPasswords });
    }

    if (req.method === 'POST') {
      // Create new user creation request
      const { name, email, role, manager_id } = req.body;

      // Validation
      if (!name?.trim()) {
        return res.status(400).json({ error: 'Name is required.' });
      }

      if (!email?.trim()) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      if (!role || !['manager', 'employee'].includes(role)) {
        return res.status(400).json({ error: 'Role must be either "manager" or "employee".' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      // Get the user's company - using 'company' field instead of 'company_id'
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { company: true } // Changed from company_id to company
      });

      if (!user?.company) {
        return res.status(400).json({ error: 'You must have a company profile to create user requests.' });
      }

      // Find the company by name/id to get the actual company_id for the user_creation_requests table
      const company = await prisma.companies.findFirst({
        where: { 
          OR: [
            { id: user.company },
            { name: user.company }
          ]
        },
        select: { id: true }
      });

      if (!company) {
        return res.status(400).json({ error: 'Company not found. Please ensure you have a valid company profile.' });
      }

      // Check if email already exists in users table
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }

      // Check if there's already a pending request for this email
      const existingRequest = await prisma.user_creation_requests.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          status: 'pending'
        }
      });

      if (existingRequest) {
        return res.status(409).json({ error: 'There is already a pending request for this email.' });
      }

      // Validate manager if provided (for employee role)
      if (role === 'employee' && manager_id) {
        const manager = await prisma.user.findUnique({
          where: { id: manager_id },
          select: { 
            id: true, 
            role: true, 
            company: true // Changed from company_id to company
          }
        });

        if (!manager) {
          return res.status(400).json({ error: 'Selected manager not found.' });
        }

        if (manager.role !== 'manager') {
          return res.status(400).json({ error: 'Selected user must have manager role.' });
        }

        if (manager.company !== user.company) {
          return res.status(400).json({ error: 'Manager must be from the same company.' });
        }
      }

      // Create the user creation request
      const request = await prisma.user_creation_requests.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          company_id: company.id, // Use the company.id from the companies table
          requested_by: userId,
          manager_id: (role === 'employee' && manager_id) ? manager_id : null
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: 'User creation request submitted successfully. It will be reviewed by an admin.',
        request
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling user creation requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 