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
    
    if (decoded.role !== 'superadmin' && decoded.role !== 'super_admin') {
      return { authenticated: false, error: 'Insufficient permissions. Only super admins can migrate roles.' };
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("API endpoint called: /api/admin/recruiters/migrate-roles");
  
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    
    if (!authResult.authenticated) {
      console.log("Authentication failed:", authResult.error);
      return res.status(401).json({ error: authResult.error });
    }
    
    console.log(`Authenticated as superadmin: ${authResult.user.email}`);

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Find all users with role 'recruiter'
    const recruiters = await prisma.user.findMany({
      where: {
        role: 'recruiter',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log(`Found ${recruiters.length} recruiters to update`);

    if (recruiters.length === 0) {
      return res.status(200).json({ message: 'No recruiters to update', updated: 0 });
    }

    // Update all recruiters to have role 'unassigned'
    const updatePromises = recruiters.map(recruiter => 
      prisma.user.update({
        where: { id: recruiter.id },
        data: { role: 'unassigned' },
      })
    );

    const updatedRecruiters = await Promise.all(updatePromises);
    
    console.log(`Successfully updated ${updatedRecruiters.length} recruiters to role 'unassigned'`);
    
    return res.status(200).json({ 
      message: 'Successfully updated recruiters', 
      updated: updatedRecruiters.length,
      recruiters: updatedRecruiters.map(r => ({ id: r.id, name: r.name, email: r.email, role: r.role }))
    });
  } catch (error) {
    console.error('Error in migrate-roles API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ error: 'Internal server error', details: errorMessage });
  } finally {
    await prisma.$disconnect();
  }
} 