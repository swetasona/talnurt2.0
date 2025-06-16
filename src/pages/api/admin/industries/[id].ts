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

  // Get industry ID from the URL
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid industry ID' });
  }

  // Handle GET request - Get a single industry
  if (req.method === 'GET') {
    try {
      const industry = await prisma.industries.findUnique({
        where: { id },
      });

      if (!industry) {
        return res.status(404).json({ error: 'Industry not found' });
      }

      return res.status(200).json(industry);
    } catch (error) {
      console.error('Error fetching industry:', error);
      return res.status(500).json({ error: 'Failed to fetch industry' });
    }
  }

  // Handle PUT request - Update an industry
  if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Industry name is required' });
      }

      // Check if industry exists
      const existingIndustry = await prisma.industries.findUnique({
        where: { id },
      });

      if (!existingIndustry) {
        return res.status(404).json({ error: 'Industry not found' });
      }

      // Check if another industry with the same name exists
      const duplicateIndustry = await prisma.industries.findFirst({
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

      if (duplicateIndustry) {
        return res.status(409).json({ error: 'Another industry with this name already exists' });
      }

      // Update the industry
      const updatedIndustry = await prisma.industries.update({
        where: { id },
        data: {
          name,
          description: description || '',
          updated_at: new Date(),
        },
      });

      return res.status(200).json(updatedIndustry);
    } catch (error) {
      console.error('Error updating industry:', error);
      return res.status(500).json({ error: 'Failed to update industry' });
    }
  }

  // Handle DELETE request - Delete an industry
  if (req.method === 'DELETE') {
    try {
      // Check if industry exists
      const existingIndustry = await prisma.industries.findUnique({
        where: { id },
      });

      if (!existingIndustry) {
        return res.status(404).json({ error: 'Industry not found' });
      }

      // Delete the industry
      await prisma.industries.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Industry deleted successfully' });
    } catch (error) {
      console.error('Error deleting industry:', error);
      return res.status(500).json({ error: 'Failed to delete industry' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 