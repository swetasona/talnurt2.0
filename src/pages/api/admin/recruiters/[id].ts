import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

// Helper function to verify admin authentication
async function verifyAdminAuth(req: NextApiRequest): Promise<{ authenticated: false; error: string } | { authenticated: true; user: { id: string; email: string; role: string; name: string } }> {
  try {
    console.log('Headers received:', req.headers);
    console.log('Cookies received:', req.cookies);
    
    // Check for token in cookies first, then in Authorization header
    const token = req.cookies['admin-token'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.error('No token found in cookies or Authorization header');
      return { authenticated: false, error: 'No token found' };
    }

    console.log('Token found, verifying...');
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('Token decoded successfully:', { 
        userId: decoded.userId, 
        email: decoded.email, 
        role: decoded.role 
      });
      
      // Allow both admin and superadmin roles
      if (decoded.role !== 'superadmin' && decoded.role !== 'admin' && decoded.role !== 'super_admin') {
        console.error(`User role ${decoded.role} is not authorized. Required: superadmin, admin, or super_admin`);
        return { authenticated: false, error: 'Insufficient permissions' };
      }

      console.log('Authentication successful');
      return { 
        authenticated: true, 
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name || 'Admin User'
        }
      };
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return { authenticated: false, error: 'Invalid token' };
    }
  } catch (error) {
    console.error('JWT verification error:', error);
    return { authenticated: false, error: 'Invalid token' };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`API request: ${req.method} ${req.url}`);
  
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    
    if (!authResult.authenticated) {
      console.error('Authentication failed:', authResult.error);
      return res.status(401).json({ error: authResult.error });
    }

    const { id } = req.query;
    console.log(`Processing request for recruiter ID: ${id}`);

    // Validate ID
    if (!id || typeof id !== 'string') {
      console.error('Invalid recruiter ID provided:', id);
      return res.status(400).json({ error: 'Invalid recruiter ID' });
    }

    // Handle DELETE request - Delete a recruiter
    if (req.method === 'DELETE') {
      try {
        console.log(`Attempting to delete recruiter with ID: ${id}`);
        
        // Check if recruiter exists and is a recruiter
        const user = await prisma.user.findUnique({
          where: { id },
          select: { role: true, name: true, email: true },
        });

        if (!user) {
          console.error(`Recruiter with ID ${id} not found`);
          return res.status(404).json({ error: 'Recruiter not found' });
        }

        console.log(`Found user: ${user.name} (${user.email}) with role ${user.role}`);
        
        // Allow deleting users with different roles too
        const validRoles = ['recruiter', 'unassigned', 'employee', 'manager', 'employer'];
        if (!validRoles.includes(user.role)) {
          console.error(`Cannot delete user with role '${user.role}'. Only ${validRoles.join(', ')} roles can be deleted.`);
          return res.status(400).json({ 
            error: `Cannot delete user with role '${user.role}'. Only ${validRoles.join(', ')} roles can be deleted.`
          });
        }

        console.log(`Deleting user: ${user.name} (${user.email}) with role ${user.role}`);

        // Delete the recruiter
        await prisma.user.delete({
          where: { id },
        });

        console.log('User deleted successfully');
        return res.status(200).json({ 
          message: 'User deleted successfully',
          user: { id, role: user.role, name: user.name, email: user.email }
        });
      } catch (error) {
        console.error('Error deleting recruiter:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return res.status(500).json({ error: 'Failed to delete recruiter', details: errorMessage });
      }
    }

    // Handle unsupported methods
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Unhandled error in recruiter API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ error: 'Internal server error', details: errorMessage });
  } finally {
    await prisma.$disconnect();
  }
} 