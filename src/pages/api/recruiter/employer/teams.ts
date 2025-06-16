import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the session to verify the user is authenticated and has appropriate access
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user has appropriate access (employer or manager)
    if (session.user.role !== 'employer' && session.user.role !== 'manager') {
      return res.status(403).json({ error: 'Employer or manager access required.' });
    }

    const userId = session.user.id;

    if (req.method === 'GET') {
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          company_id: true,
          role: true
        }
      });

      if (!user?.company_id) {
        return res.status(200).json({ teams: [] });
      }

      // Get teams based on company_id
      const teams = await prisma.teams.findMany({
        where: {
          company_id: user.company_id
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
              role: 'employee',
              is_active: true
            }
          }
        }
      });

      // If user is a manager, filter to only show their teams
      const filteredTeams = user.role === 'manager' 
        ? teams.filter(team => team.manager?.id === userId)
        : teams;

      console.log(`Retrieved ${filteredTeams.length} teams for ${user.role} with ID ${userId}`);
      return res.status(200).json({ teams: filteredTeams });
    }

    if (req.method === 'POST') {
      // Only employers can create teams
      if (session.user.role !== 'employer') {
        return res.status(403).json({ error: 'Only employers can create teams' });
      }
      
      // Create new team
      const { name, manager_id } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Team name is required.' });
      }

      // Get the user's company
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { company_id: true }
      });

      if (!user?.company_id) {
        return res.status(400).json({ error: 'You must have a company profile to create teams.' });
      }

      // Validate manager if provided
      if (manager_id) {
        const manager = await prisma.user.findUnique({
          where: { 
            id: manager_id,
            company_id: user.company_id,
            role: 'manager',
            is_active: true
          }
        });

        if (!manager) {
          return res.status(400).json({ error: 'The selected manager is not valid.' });
        }
      }

      // Check if team with this name already exists in the company
      const existingTeam = await prisma.teams.findFirst({
        where: {
          name: name.trim(),
          company_id: user.company_id
        }
      });

      if (existingTeam) {
        return res.status(409).json({ error: 'A team with this name already exists in your company.' });
      }

      // Create the team
      const team = await prisma.teams.create({
        data: {
          name: name.trim(),
          company_id: user.company_id,
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
              role: 'employee',
              is_active: true
            }
          }
        }
      });

      // If a manager was assigned, update their team_id
      if (manager_id) {
        await prisma.user.update({
          where: { id: manager_id },
          data: { team_id: team.id }
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Team created successfully.',
        team
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling teams request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 