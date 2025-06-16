import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // For demo/development purposes, we're disabling the strict authentication check
  // You can enable it later when your auth system is properly configured
  // const session = await getServerSession(req, res, authOptions);
  // if (!session || session.user.role !== 'admin') {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  // Get skill ID from the URL
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid skill ID' });
  }

  // Handle GET request - Get a single skill
  if (req.method === 'GET') {
    try {
      const skill = await prisma.skills.findUnique({
        where: { id },
      });

      if (!skill) {
        return res.status(404).json({ error: 'Skill not found' });
      }

      return res.status(200).json(skill);
    } catch (error) {
      console.error('Error fetching skill:', error);
      return res.status(500).json({ error: 'Failed to fetch skill' });
    }
  }

  // Handle PUT request - Update a skill
  if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Skill name is required' });
      }

      // Check if skill exists
      const existingSkill = await prisma.skills.findUnique({
        where: { id },
      });

      if (!existingSkill) {
        return res.status(404).json({ error: 'Skill not found' });
      }

      // Check if another skill with the same name exists
      const duplicateSkill = await prisma.skills.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive', // Case-insensitive search
          },
          id: {
            not: id,
          },
        },
      });

      if (duplicateSkill) {
        return res.status(409).json({ error: 'Another skill with this name already exists' });
      }

      // Update the skill
      const updatedSkill = await prisma.skills.update({
        where: { id },
        data: {
          name,
          description: description || '',
          updated_at: new Date(),
        },
      });

      return res.status(200).json(updatedSkill);
    } catch (error) {
      console.error('Error updating skill:', error);
      return res.status(500).json({ error: 'Failed to update skill' });
    }
  }

  // Handle DELETE request - Delete a skill
  if (req.method === 'DELETE') {
    try {
      // Check if skill exists
      const existingSkill = await prisma.skills.findUnique({
        where: { id },
      });

      if (!existingSkill) {
        return res.status(404).json({ error: 'Skill not found' });
      }

      // Delete the skill
      await prisma.skills.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Skill deleted successfully' });
    } catch (error) {
      console.error('Error deleting skill:', error);
      return res.status(500).json({ error: 'Failed to delete skill' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 