import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const companies = await prisma.companies.findMany();
      return res.status(200).json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      return res.status(500).json({ error: 'Failed to fetch companies' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { name, logo_url, industry, website_url, linkedin_url, speciality, location, description } = req.body;
      
      const company = await prisma.companies.create({
        data: {
          name,
          logo_url,
          industry,
          website_url,
          linkedin_url,
          speciality,
          location,
          description,
        },
      });
      
      return res.status(201).json(company);
    } catch (error) {
      console.error('Error creating company:', error);
      return res.status(500).json({ error: 'Failed to create company' });
    }
  }
  
  if (req.method === 'PUT') {
    try {
      const { id, name, logo_url, industry, website_url, linkedin_url, speciality, location, description } = req.body;
      
      const company = await prisma.companies.update({
        where: { id },
        data: {
          name,
          logo_url,
          industry,
          website_url,
          linkedin_url,
          speciality,
          location,
          description,
        },
      });
      
      return res.status(200).json(company);
    } catch (error) {
      console.error('Error updating company:', error);
      return res.status(500).json({ error: 'Failed to update company' });
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      await prisma.companies.delete({
        where: { id: String(id) },
      });
      
      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting company:', error);
      return res.status(500).json({ error: 'Failed to delete company' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
} 