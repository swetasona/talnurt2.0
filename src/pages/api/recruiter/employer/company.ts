import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';

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

    const userId = session.user.id;

    if (req.method === 'GET') {
      // Get company profile for the user - using the correct field structure
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          company_id: true
        }
      });

      if (!user?.company_id) {
        return res.status(200).json({
          company: null
        });
      }

      // Get the actual company data from the companies table
      const company = await prisma.companies.findUnique({
        where: { id: user.company_id }
      });

      return res.status(200).json({
        company: company || null
      });
    }

    if (req.method === 'POST') {
      // Create new company profile
      const { name, industry, location, description, linkedin_url, logo_url, website_url } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: 'Company name is required.' });
      }

      // Check if company with this name already exists
      const existingCompany = await prisma.companies.findFirst({
        where: { name: name.trim() }
      });

      if (existingCompany) {
        return res.status(409).json({ error: 'A company with this name already exists.' });
      }

      // Create the company
      const company = await prisma.companies.create({
        data: {
          name: name.trim(),
          industry: industry?.trim() || null,
          location: location?.trim() || null,
          description: description?.trim() || null,
          logo_url: logo_url?.trim() || null,
          website: website_url?.trim() || null,
        }
      });

      // Link the user to this company - update the company_id field
      await prisma.user.update({
        where: { id: userId },
        data: { company_id: company.id }
      });

      return res.status(201).json({
        success: true,
        message: 'Company created successfully.',
        company
      });
    }

    if (req.method === 'PUT') {
      // Update existing company profile
      const { name, industry, location, description, linkedin_url, logo_url, website_url } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: 'Company name is required.' });
      }

      // Get the user's current company
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          company_id: true
        }
      });

      if (!user?.company_id) {
        return res.status(404).json({ error: 'No company profile found to update.' });
      }

      // Get the actual company record
      const currentCompany = await prisma.companies.findUnique({
        where: { id: user.company_id }
      });

      if (!currentCompany) {
        return res.status(404).json({ error: 'No company profile found to update.' });
      }

      // Check if another company with this name exists (excluding current company)
      const existingCompany = await prisma.companies.findFirst({
        where: {
          name: name.trim(),
          id: { not: currentCompany.id }
        }
      });

      if (existingCompany) {
        return res.status(409).json({ error: 'A company with this name already exists.' });
      }

      // Update the company
      const updatedCompany = await prisma.companies.update({
        where: { id: currentCompany.id },
        data: {
          name: name.trim(),
          industry: industry?.trim() || null,
          location: location?.trim() || null,
          description: description?.trim() || null,
          logo_url: logo_url?.trim() || null,
          website: website_url?.trim() || null,
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Company updated successfully.',
        company: updatedCompany
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling company request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 