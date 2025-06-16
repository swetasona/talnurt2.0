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

  // Handle GET request - Get all industries
  if (req.method === 'GET') {
    try {
      // Query the database for all industries
      const industries = await prisma.industries.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return res.status(200).json(industries);
    } catch (error) {
      console.error('Error fetching industries:', error);
      return res.status(500).json({ error: 'Failed to fetch industries' });
    }
  }

  // Handle POST request - Create a new industry
  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Industry name is required' });
      }

      // Check if industry already exists
      const existingIndustry = await prisma.industries.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive', // Case-insensitive search
          },
        },
      });

      if (existingIndustry) {
        return res.status(409).json({ error: 'An industry with this name already exists' });
      }

      // Create the new industry
      const newIndustry = await prisma.industries.create({
        data: {
          id: uuidv4(),
          name,
          description: description || '',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return res.status(201).json(newIndustry);
    } catch (error) {
      console.error('Error creating industry:', error);
      return res.status(500).json({ error: 'Failed to create industry' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 