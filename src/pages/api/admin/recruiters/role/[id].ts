import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

// Helper function to verify admin authentication
async function verifyAdminAuth(req: NextApiRequest): Promise<{ authenticated: false; error: string } | { authenticated: true; user: { id: string; email: string; role: string; name: string } }> {
  try {
    const token = req.cookies['admin-token'];
    
    if (!token) {
      return { authenticated: false, error: 'No token found' };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Only allow superadmin and admin to change roles
    if (decoded.role !== 'superadmin' && decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      console.log(`Role ${decoded.role} is not authorized to change recruiter roles`);
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
    return { authenticated: false, error: 'Invalid token' };
  }
}

// Track role changes to invalidate sessions
async function trackRoleChange(userId: string, newRole: string): Promise<void> {
  try {
    // First, check if role_changes table exists
    const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'role_changes'
      );
    `;
    
    // Create the table if it doesn't exist
    if (!tableExists[0].exists) {
      await prisma.$executeRaw`
        CREATE TABLE role_changes (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          new_role VARCHAR(50) NOT NULL,
          changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;
    }
    
    // Insert role change record
    await prisma.$executeRaw`
      INSERT INTO role_changes (user_id, new_role, changed_at)
      VALUES (${userId}, ${newRole}, CURRENT_TIMESTAMP);
    `;
    
    console.log(`Role change tracked for user ${userId} to ${newRole}`);
  } catch (error) {
    console.error('Error tracking role change:', error);
    // Don't throw error to avoid disrupting the main process
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    
    if (!authResult.authenticated) {
      return res.status(401).json({ error: authResult.error });
    }

    const { id } = req.query;

    // Validate ID
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Handle PUT request - Update a user's role
    if (req.method === 'PUT') {
      try {
        const { role } = req.body;
        
        // Validate role
        const validRoles = ['unassigned', 'employee', 'employer', 'manager', 'admin'];
        if (!role || !validRoles.includes(role)) {
          return res.status(400).json({ error: 'Invalid role. Must be one of: unassigned, employee, employer, manager, admin' });
        }
        
        // Check if user exists and get current role
        const user = await prisma.user.findUnique({
          where: { id },
          select: { id: true, name: true, email: true, role: true }
        });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Only track if role is actually changing
        const isRoleChanging = user.role !== role;

        // Update the user's role
        const updatedUser = await prisma.user.update({
          where: { id },
          data: { role },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            company: true,
            created_at: true,
            updated_at: true
          }
        });

        console.log(`Role updated for user ${user.email} from ${user.role} to ${role} by ${authResult.user.email}`);
        
        // Track role change to invalidate session if role is different
        if (isRoleChanging) {
          await trackRoleChange(user.id, role);
        }
        
        return res.status(200).json({
          ...updatedUser,
          roleChanged: isRoleChanging,
          message: isRoleChanging ? 
            "Role updated successfully. User will need to log in again." : 
            "Role updated successfully."
        });
      } catch (error) {
        console.error('Error updating user role:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return res.status(500).json({ error: 'Failed to update user role', details: errorMessage });
      }
    }

    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Unhandled error in role update API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ error: 'Internal server error', details: errorMessage });
  } finally {
    await prisma.$disconnect();
  }
} 