import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db-connection-manager'; // Use the singleton Prisma client

const SECRET = process.env.NEXTAUTH_SECRET || 'my-super-secure-nextauth-secret-123!@#';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Verify the user is authenticated
    const token = await getToken({ req, secret: SECRET });
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get the user ID and current role from query parameters
    const { userId, currentRole } = req.query;
    
    if (!userId || !currentRole) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Verify that the token user ID matches the requested user ID
    if (token.id !== userId) {
      return res.status(403).json({ error: 'Forbidden - cannot check role for another user' });
    }
    
    // Get the user's current role from the database
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { role: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if role has changed
    const hasRoleChanged = user.role !== currentRole;
    
    // Check for role changes in the role_changes table if we have it
    let lastRoleChange = null;
    
    try {
      // First check if the table exists
      const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'role_changes'
        );
      `;
      
      if (tableExists[0].exists) {
        // Get the most recent role change
        const roleChanges = await prisma.$queryRaw<Array<{ new_role: string, changed_at: Date }>>`
          SELECT new_role, changed_at FROM role_changes 
          WHERE user_id = ${userId as string}
          ORDER BY changed_at DESC
          LIMIT 1;
        `;
        
        if (roleChanges.length > 0) {
          lastRoleChange = roleChanges[0];
        }
      }
    } catch (error) {
      console.error('Error checking role_changes table:', error);
      // Continue without role_changes data
    }
    
    return res.status(200).json({
      hasRoleChanged,
      databaseRole: user.role,
      sessionRole: currentRole,
      lastRoleChange
    });
  } catch (error) {
    console.error('Error checking user role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 