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
    
    if (decoded.role !== 'superadmin' && decoded.role !== 'admin' && decoded.role !== 'super_admin') {
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

    if (req.method === 'GET') {
      // Get all employer applications with recruiter details
      const applications = await prisma.employer_applications.findMany({
        include: {
          recruiter: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // Add placeholder data for applications with missing recruiters
      const processedApplications = applications.map(app => {
        if (!app.recruiter) {
          return {
            ...app,
            recruiter: {
              id: app.recruiter_id || 'unknown',
              name: '[Deleted User]',
              email: 'user-deleted@example.com',
              company: 'Unknown Company',
              _isPlaceholder: true
            }
          };
        }
        return app;
      });

      return res.status(200).json(processedApplications);
    }

    if (req.method === 'PUT') {
      // Update application status
      const { applicationId, status, admin_notes } = req.body;

      if (!applicationId || !status) {
        return res.status(400).json({ error: 'Application ID and status are required' });
      }

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be pending, approved, or rejected' });
      }

      const updatedApplication = await prisma.employer_applications.update({
        where: { id: applicationId },
        data: {
          status,
          admin_notes: admin_notes || null,
          updated_at: new Date()
        },
        include: {
          recruiter: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
              role: true
            }
          }
        }
      });

      // If approved, update the recruiter's role to 'employer'
      if (status === 'approved' && updatedApplication.recruiter_id) {
        try {
          // Check if the user still exists before trying to update
          const userExists = await prisma.user.findUnique({
            where: { id: updatedApplication.recruiter_id },
            select: { id: true, role: true }
          });
          
          if (userExists) {
            // Only track role change if the role is actually changing
            const isRoleChanging = userExists.role !== 'employer';
            
            await prisma.user.update({
              where: { id: updatedApplication.recruiter_id },
              data: { role: 'employer' }
            });
    
            // If role is changing, track it to force logout
            if (isRoleChanging) {
              await trackRoleChange(updatedApplication.recruiter_id, 'employer');
            }
          } else {
            console.warn(`Cannot update user role for application ${applicationId}: User does not exist`);
          }
        } catch (error) {
          console.error(`Error updating user role for application ${applicationId}:`, error);
          // Continue with the response even if this part fails
        }
      }
      
      // Add placeholder for missing recruiter data in the response
      if (!updatedApplication.recruiter) {
        updatedApplication.recruiter = {
          id: updatedApplication.recruiter_id || 'unknown',
          name: '[Deleted User]',
          email: 'user-deleted@example.com',
          company: 'Unknown Company',
          _isPlaceholder: true
        } as any;
      }

      return res.status(200).json({
        success: true,
        message: `Application ${status} successfully. ${status === 'approved' ? 'User will be logged out automatically and need to log in again to access employer features.' : ''}`,
        application: updatedApplication
      });
    }

    if (req.method === 'DELETE') {
      // Check if applicationId is provided - if yes, delete a specific application
      // If no applicationId, treat as reset endpoint
      const { applicationId } = req.query;
      
      if (applicationId) {
        try {
          // Delete specific application
          await prisma.employer_applications.delete({
            where: { id: applicationId as string }
          });
          
          return res.status(200).json({
            success: true,
            message: 'Application deleted successfully'
          });
        } catch (error) {
          console.error('Error deleting application:', error);
          return res.status(500).json({ error: 'Failed to delete application' });
        }
      }
      
      // Reset endpoint for debugging purposes - this will refresh data if there's any caching issues
      try {
        // Force Prisma to reconnect and clear any connection pools
        await prisma.$disconnect();
        
        // Reconnect to the database
        await prisma.$connect();
        
        // Get fresh data
        const applications = await prisma.employer_applications.findMany({
          include: {
            recruiter: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        });

        // Add placeholder data for applications with missing recruiters
        const processedApplications = applications.map(app => {
          if (!app.recruiter) {
            return {
              ...app,
              recruiter: {
                id: app.recruiter_id || 'unknown',
                name: '[Deleted User]',
                email: 'user-deleted@example.com',
                company: 'Unknown Company',
                _isPlaceholder: true
              }
            };
          }
          return app;
        });

        return res.status(200).json({
          success: true,
          message: 'Application data reset successfully',
          applications: processedApplications
        });
      } catch (error) {
        console.error('Error resetting application data:', error);
        return res.status(500).json({ error: 'Failed to reset application data' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling employer applications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 