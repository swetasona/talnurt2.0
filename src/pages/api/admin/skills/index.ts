import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // For demo/development purposes, we're disabling the strict authentication check
  // You can enable it later when your auth system is properly configured
  // const session = await getServerSession(req, res, authOptions);
  // if (!session || session.user.role !== 'admin') {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  // Handle GET request - Get all skills
  if (req.method === 'GET') {
    try {
      // Query the database for all skills
      const skills = await prisma.skills.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return res.status(200).json(skills);
    } catch (error) {
      console.error('Error fetching skills:', error);
      return res.status(500).json({ error: 'Failed to fetch skills' });
    }
  }

  // Handle POST request - Create a new skill
  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Skill name is required' });
      }

      // Check if skill already exists
      const existingSkill = await prisma.skills.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive', // Case-insensitive search
          },
        },
      });

      if (existingSkill) {
        return res.status(409).json({ error: 'A skill with this name already exists' });
      }

      // Create the new skill
      const newSkill = await prisma.skills.create({
        data: {
          id: uuidv4(),
          name,
          description: description || '',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return res.status(201).json(newSkill);
    } catch (error) {
      console.error('Error creating skill:', error);
      return res.status(500).json({ error: 'Failed to create skill' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 