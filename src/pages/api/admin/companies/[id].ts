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

  // Get company ID from the URL
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid company ID' });
  }

  // Handle GET request - Get a single company
  if (req.method === 'GET') {
    try {
      const company = await prisma.companies.findUnique({
        where: { id },
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      return res.status(200).json(company);
    } catch (error) {
      console.error('Error fetching company:', error);
      return res.status(500).json({ error: 'Failed to fetch company' });
    }
  }

  // Handle PUT request - Update a company
  if (req.method === 'PUT') {
    try {
      const { 
        name, 
        description, 
        industry, 
        location,
        logo_url,
        website
      } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      // Check if company exists
      const existingCompany = await prisma.companies.findUnique({
        where: { id },
      });

      if (!existingCompany) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Check if another company with the same name exists
      const duplicateCompany = await prisma.companies.findFirst({
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

      if (duplicateCompany) {
        return res.status(409).json({ error: 'Another company with this name already exists' });
      }

      // Update the company
      const updatedCompany = await prisma.companies.update({
        where: { id },
        data: {
          name,
          description: description || '',
          industry: industry || '',
          location: location || '',
          logo_url: logo_url || existingCompany.logo_url || '',
          website: website || existingCompany.website || '',
          updated_at: new Date(),
        },
      });

      return res.status(200).json(updatedCompany);
    } catch (error) {
      console.error('Error updating company:', error);
      return res.status(500).json({ error: 'Failed to update company' });
    }
  }

  // Handle DELETE request - Delete a company
  if (req.method === 'DELETE') {
    try {
      // Check if company exists
      const existingCompany = await prisma.companies.findUnique({
        where: { id },
      });

      if (!existingCompany) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Delete the company
      await prisma.companies.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Company deleted successfully' });
    } catch (error) {
      console.error('Error deleting company:', error);
      return res.status(500).json({ error: 'Failed to delete company' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 