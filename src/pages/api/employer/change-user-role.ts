import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get user from session or JWT token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const session = await getSession({ req });
  
  const userId = token?.sub || session?.user?.id || '';
  const userRole = token?.role || session?.user?.role || '';
  
  // Only employers can change roles
  if (userRole !== 'employer') {
    return res.status(403).json({ error: 'Unauthorized. Only employers can change user roles.' });
  }

  try {
    const { targetUserId, newRole } = req.body;

    // Validate input
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!newRole || !['employee', 'manager'].includes(newRole)) {
      return res.status(400).json({ error: 'New role must be either "employee" or "manager"' });
    }

    // Get the employer's company
    const employer = await prisma.user.findUnique({
      where: { id: userId },
      select: { company_id: true, company: true }
    });

    if (!employer?.company_id) {
      return res.status(400).json({ error: 'You must have a company to change user roles.' });
    }

    // Get the target user with all necessary information
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        company_id: true,
        company: true,
        role: true,
        team_id: true,
        managedTeams: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    // Verify user exists and belongs to the same company
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.company_id !== employer.company_id) {
      return res.status(403).json({ error: 'You can only change roles for employees in your company' });
    }

    // If the user is already the requested role, return early
    if (targetUser.role === newRole) {
      return res.status(200).json({ 
        message: `${targetUser.name} is already a ${newRole}`,
        user: targetUser
      });
    }

    // Start a transaction for role change
    const result = await prisma.$transaction(async (tx) => {
      // If changing from manager to employee, handle team management
      if (targetUser.role === 'manager' && newRole === 'employee') {
        // If the manager has teams, delete them
        if (targetUser.managedTeams && targetUser.managedTeams.length > 0) {
          // For each team managed by this user
          for (const team of targetUser.managedTeams) {
            // First, update all team members to remove team_id and manager_id references
            await tx.user.updateMany({
              where: { 
                team_id: team.id
              },
              data: { 
                team_id: null,
                manager_id: null
              }
            });
            
            // Delete the team
            await tx.teams.delete({
              where: { id: team.id }
            });
          }
        }
      }

      // Update the user's role
      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: { 
          role: newRole,
          // If changing to employee and they have no team, ensure they don't have manager status
          ...(newRole === 'employee' && !targetUser.team_id ? { manager_id: null } : {})
        }
      });

      return updatedUser;
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: `Role changed successfully to ${newRole}`,
      user: result,
      teamsDeleted: targetUser.role === 'manager' && newRole === 'employee' ? targetUser.managedTeams.length : 0
    });

  } catch (error) {
    console.error('Error changing user role:', error);
    return res.status(500).json({ error: 'Failed to change user role' });
  } finally {
    await prisma.$disconnect();
  }
} 