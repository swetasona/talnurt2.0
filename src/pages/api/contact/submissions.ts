import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET method to retrieve submissions
  if (req.method === 'GET') {
    try {
      // Optional query parameters for filtering and pagination
      const { status, page = '1', limit = '10' } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;
      
      // Build where clause for filtering
      const where: any = {};
      if (status) {
        where.status = status;
      }
      
      // Get submissions with pagination
      const submissions = await prisma.contactSubmission.findMany({
        where,
        orderBy: {
          submittedAt: 'desc',
        },
        skip,
        take: limitNum,
      });
      
      // Get total count for pagination
      const totalCount = await prisma.contactSubmission.count({ where });
      
      return res.status(200).json({ 
        data: submissions,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // POST method to create a new submission
  if (req.method === 'POST') {
    try {
      const { name, email, subject, message, countryCode, phoneNumber } = req.body;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Create contact submission in database
      const submission = await prisma.contactSubmission.create({
        data: {
          name,
          email,
          subject,
          message,
          phoneNumber: phoneNumber ? `${countryCode} ${phoneNumber}` : null,
          status: 'PENDING',
          submittedAt: new Date(),
        },
      });

      // Here you could also add email notification logic
      // For example, send an email to admin and an auto-reply to the user

      return res.status(201).json({ success: true, data: submission });
    } catch (error) {
      console.error('Contact submission error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Handle other methods
  return res.status(405).json({ message: 'Method not allowed' });
} 