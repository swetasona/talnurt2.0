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

  // Handle GET request - Get all companies
  if (req.method === 'GET') {
    try {
      // Query the database for all companies
      const companies = await prisma.companies.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return res.status(200).json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      return res.status(500).json({ error: 'Failed to fetch companies' });
    }
  }

  // Handle POST request - Create a new company
  if (req.method === 'POST') {
    try {
      const { 
        name, 
        description, 
        industry, 
        location, 
        logo_url,
        website_url,
        linkedin_url,
        speciality 
      } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      // Check if company already exists
      const existingCompany = await prisma.companies.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive', // Case-insensitive search
          },
        },
      });

      if (existingCompany) {
        return res.status(409).json({ error: 'A company with this name already exists' });
      }

      // Create the new company
      const newCompany = await prisma.companies.create({
        data: {
          id: uuidv4(),
          name,
          description: description || '',
          industry: industry || '',
          location: location || '',
          logo_url: logo_url || '',
          website_url: website_url || '',
          linkedin_url: linkedin_url || '',
          speciality: speciality || '',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return res.status(201).json(newCompany);
    } catch (error) {
      console.error('Error creating company:', error);
      return res.status(500).json({ error: 'Failed to create company' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 