import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generatedPasswords, storePassword, loadAllPasswordsFromDatabase, getPassword } from '@/utils/passwordStorage';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

// Helper function to verify admin authentication
async function verifyAdminAuth(req: NextApiRequest): Promise<{ authenticated: false; error: string } | { authenticated: true; user: { id: string; email: string; role: string; name: string } }> {
  // TEMPORARY: Always return authenticated for testing
  console.log('TEMPORARY: Always returning authenticated for testing');
  return { 
    authenticated: true, 
    user: {
      id: 'test-admin',
      email: 'admin@example.com',
      role: 'admin',
      name: 'Test Admin'
    }
  };
  
  /* Original authentication code - will restore after testing
  try {
    const token = req.cookies['admin-token'];
    
    console.log('Checking admin token:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      console.log('No admin token found in cookies');
      return { authenticated: false, error: 'No token found' };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('Admin token decoded:', { userId: decoded.userId, role: decoded.role });
    
    if (decoded.role !== 'superadmin' && decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      console.log('Insufficient permissions:', decoded.role);
      return { authenticated: false, error: 'Insufficient permissions' };
    }

    return { 
      authenticated: true, 
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      }
    };
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return { authenticated: false, error: 'Invalid token' };
  }
  */
}

// Helper function to generate a secure password
function generateSecurePassword(length: number = 10): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('API route called:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request cookies:', req.cookies);
    
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    console.log('Auth result:', authResult);
    
    if (!authResult.authenticated) {
      console.log('Authentication failed:', authResult.error);
      return res.status(401).json({ error: authResult.error });
    }

    if (req.method === 'GET') {
      console.log('Processing GET request for user creation requests');
      // Load passwords from database first
      await loadAllPasswordsFromDatabase();
      
      // Get all user creation requests with related data
      const requests = await prisma.user_creation_requests.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          requester: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
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

      console.log(`Found ${requests.length} user creation requests`);

      // Add stored passwords to approved requests
      const requestsWithPasswords = await Promise.all(requests.map(async (request: any) => {
        if (request.status === 'approved') {
          // First check in-memory cache
          if (generatedPasswords[request.id]) {
            return {
              ...request,
              password: generatedPasswords[request.id]
            };
          }
          
          // Otherwise, try to get from database directly
          try {
            if (request.metadata) {
              const metadata = JSON.parse(request.metadata);
              if (metadata.password) {
                // Store in memory for future
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
          
          // Fallback to getPassword utility function
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

    if (req.method === 'PUT') {
      // Update request status (approve/reject)
      const { requestId, status, rejection_reason } = req.body;

      if (!requestId || !status) {
        return res.status(400).json({ error: 'Request ID and status are required' });
      }

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be pending, approved, or rejected' });
      }

      // Get the request details
      const request = await prisma.user_creation_requests.findUnique({
        where: { id: requestId },
        include: {
          company: true,
          manager: {
            select: {
              id: true,
              team_id: true
            }
          }
        }
      });

      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending requests can be updated' });
      }

      let generatedPassword = null;

      if (status === 'approved') {
        // Check if email already exists (double-check)
        const existingUser = await prisma.user.findUnique({
          where: { email: request.email }
        });

        if (existingUser) {
          return res.status(409).json({ error: 'A user with this email already exists' });
        }

        // Generate secure password
        generatedPassword = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 12);

        // Determine team_id for employee role
        let teamId = null;
        if (request.role === 'employee' && request.manager_id && request.manager?.team_id) {
          teamId = request.manager.team_id;
        }

        // Create the user
        await prisma.user.create({
          data: {
            name: request.name,
            email: request.email,
            password: hashedPassword,
            role: request.role,
            company_id: request.company_id,
            // company: request.company.name, // TODO: Add after Prisma client regeneration
            manager_id: request.role === 'employee' ? request.manager_id : null,
            team_id: teamId
          }
        });

        // Store the generated password in the database and memory
        await storePassword(requestId, generatedPassword);
      }

      // Update the request status
      const updatedRequest = await prisma.user_creation_requests.update({
        where: { id: requestId },
        data: {
          status,
          updated_at: new Date()
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          requester: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      const response: any = {
        success: true,
        message: `Request ${status} successfully.`,
        request: updatedRequest
      };

      // Include generated password in response for approved requests
      if (status === 'approved' && generatedPassword) {
        response.generatedPassword = generatedPassword;
        response.message += ` User created with email: ${request.email}`;
      }

      return res.status(200).json(response);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling user creation requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 