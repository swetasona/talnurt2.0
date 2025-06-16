import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../../../auth/[...nextauth]';

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
      select: { 
        id: true, 
        company_id: true,
        manager_id: true,
        manager: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    if (team.company_id !== user.company_id) {
      return res.status(403).json({ error: 'You can only manage teams from your own company.' });
    }

    // Add a member to the team
    if (req.method === 'POST') {
      const { employee_id } = req.body;

      if (!employee_id) {
        return res.status(400).json({ error: 'Employee ID is required.' });
      }

      // Check if employee exists and is part of the company
      const employee = await prisma.user.findUnique({
        where: { 
          id: employee_id,
          company_id: user.company_id,
          is_active: true
        },
        select: { 
          id: true, 
          name: true,
          team_id: true
        }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      if (employee.team_id) {
        return res.status(400).json({ error: 'Employee is already assigned to a team.' });
      }

      // Add employee to the team and set manager if present
      const updatedEmployee = await prisma.user.update({
        where: { id: employee_id },
        data: { 
          team_id: teamId,
          manager_id: team.manager_id || undefined
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      return res.status(200).json({
        success: true,
        message: `${employee.name} has been added to the team.`,
        employee: updatedEmployee
      });
    }

    // Remove a member from the team
    if (req.method === 'DELETE') {
      const { employee_id } = req.body;

      if (!employee_id) {
        return res.status(400).json({ error: 'Employee ID is required.' });
      }

      // Check if employee exists and is part of this team
      const employee = await prisma.user.findUnique({
        where: { 
          id: employee_id,
          team_id: teamId,
          is_active: true
        },
        select: { 
          id: true, 
          name: true,
          manager_id: true
        }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found or not part of this team.' });
      }

      // Check if current manager is the team manager
      const isManagerFromTeam = employee.manager_id === team.manager_id;

      // Remove employee from the team and reset their manager if it was set by the team
      await prisma.user.update({
        where: { id: employee_id },
        data: { 
          team_id: null,
          // Only reset manager if it was the team's manager
          ...(isManagerFromTeam && { manager_id: null })
        }
      });

      let message = `${employee.name} has been removed from the team.`;
      if (isManagerFromTeam) {
        message = `${employee.name} has been removed from the team and their manager has been reset.`;
      }

      return res.status(200).json({
        success: true,
        message: message
      });
    }

    // List all available employees that can be added to this team
    if (req.method === 'GET') {
      // Get all employees from the company that aren't in any team
      const availableEmployees = await prisma.user.findMany({
        where: {
          company_id: user.company_id,
          role: 'employee',
          team_id: null,
          is_active: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: { name: 'asc' }
      });

      // Get current team members
      const teamMembers = await prisma.user.findMany({
        where: {
          team_id: teamId,
          role: 'employee',
          is_active: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          manager: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return res.status(200).json({
        availableEmployees,
        teamMembers,
        teamManager: team.manager
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling team members request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 