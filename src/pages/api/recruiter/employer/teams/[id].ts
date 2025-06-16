import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../../auth/[...nextauth]';

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

    const { id: teamId } = req.query;
    const userId = session.user.id;

    if (!teamId || typeof teamId !== 'string') {
      return res.status(400).json({ error: 'Invalid team ID.' });
    }

    // Verify the team belongs to the user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { company_id: true }
    });

    if (!user?.company_id) {
      return res.status(403).json({ error: 'You must have a company to manage teams.' });
    }

    const team = await prisma.teams.findUnique({
      where: { id: teamId },
      select: { id: true, company_id: true }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    if (team.company_id !== user.company_id) {
      return res.status(403).json({ error: 'You can only manage teams from your own company.' });
    }

    if (req.method === 'PUT') {
      // Update team
      const { name, manager_id } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: 'Team name is required.' });
      }

      // Validate manager if provided
      if (manager_id) {
        const manager = await prisma.user.findUnique({
          where: { id: manager_id },
          select: { id: true, role: true }
        });

        if (!manager) {
          return res.status(400).json({ error: 'Selected manager not found.' });
        }

        if (manager.role !== 'manager') {
          return res.status(400).json({ error: 'Selected user must have manager role.' });
        }
      }

      // Check if another team with this name exists in the company (excluding current team)
      const existingTeam = await prisma.teams.findFirst({
        where: {
          name: name.trim(),
          company_id: user.company_id,
          id: { not: teamId }
        }
      });

      if (existingTeam) {
        return res.status(409).json({ error: 'A team with this name already exists in your company.' });
      }

      // Get the current team's manager to potentially clear their team_id
      const currentTeam = await prisma.teams.findUnique({
        where: { id: teamId },
        select: { 
          manager_id: true,
          members: {
            where: {
              role: 'employee'
            },
            select: {
              id: true,
              manager_id: true
            }
          }
        }
      });

      // Update the team
      const updatedTeam = await prisma.teams.update({
        where: { id: teamId },
        data: {
          name: name.trim(),
          manager_id: manager_id || null
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          members: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            },
            where: {
              role: 'employee'
            }
          }
        }
      });

      // Update manager assignments
      // If there was a previous manager and it's different from the new one, clear their team_id
      if (currentTeam?.manager_id && currentTeam.manager_id !== manager_id) {
        await prisma.user.update({
          where: { id: currentTeam.manager_id },
          data: { team_id: null }
        });
        
        // Update team members who had the previous manager to have no manager
        await prisma.user.updateMany({
          where: { 
            team_id: teamId,
            manager_id: currentTeam.manager_id
          },
          data: { manager_id: null }
        });
      }

      // If a new manager was assigned, update their team_id
      if (manager_id) {
        await prisma.user.update({
          where: { id: manager_id },
          data: { team_id: teamId }
        });
        
        // Update all team members to have the new manager
        await prisma.user.updateMany({
          where: { 
            team_id: teamId,
            role: 'employee'
          },
          data: { manager_id: manager_id }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Team updated successfully.',
        team: updatedTeam
      });
    }

    if (req.method === 'DELETE') {
      // Delete team
      // First, clear team_id and manager_id (if matching team manager) from all users associated with this team
      const teamToDelete = await prisma.teams.findUnique({
        where: { id: teamId },
        select: { manager_id: true }
      });
      
      if (teamToDelete?.manager_id) {
        // Reset manager for team members who have this team's manager
        await prisma.user.updateMany({
          where: { 
            team_id: teamId, 
            manager_id: teamToDelete.manager_id 
          },
          data: { 
            team_id: null,
            manager_id: null 
          }
        });
        
        // Clear team_id for any remaining team members
        await prisma.user.updateMany({
          where: { 
            team_id: teamId,
            manager_id: { not: teamToDelete.manager_id }
          },
          data: { team_id: null }
        });
      } else {
        // No manager, just clear team_id
        await prisma.user.updateMany({
          where: { team_id: teamId },
          data: { team_id: null }
        });
      }

      // Then delete the team
      await prisma.teams.delete({
        where: { id: teamId }
      });

      return res.status(200).json({
        success: true,
        message: 'Team deleted successfully.'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling team request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 