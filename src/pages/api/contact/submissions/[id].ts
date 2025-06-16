import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid submission ID' });
  }

  // GET method to retrieve a specific submission
  if (req.method === 'GET') {
    try {
      const submission = await prisma.contactSubmission.findUnique({
        where: { id }
      });
      
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      return res.status(200).json({ data: submission });
    } catch (error: any) {
      console.error('Error fetching contact submission:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // PATCH method to update a submission (e.g., status)
  if (req.method === 'PATCH') {
    try {
      const { status } = req.body;
      
      // Validate status
      if (!status || !['PENDING', 'RESPONDED', 'ARCHIVED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      // Update the submission
      const updatedSubmission = await prisma.contactSubmission.update({
        where: { id },
        data: { 
          status,
          updatedAt: new Date() 
        }
      });
      
      return res.status(200).json({ data: updatedSubmission });
    } catch (error: any) {
      console.error('Error updating contact submission:', error);
      
      // Check if it's a Prisma error for record not found
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // DELETE method to remove a submission
  if (req.method === 'DELETE') {
    try {
      await prisma.contactSubmission.delete({
        where: { id }
      });
      
      return res.status(204).send(null); // 204 No Content
    } catch (error: any) {
      console.error('Error deleting contact submission:', error);
      
      // Check if it's a Prisma error for record not found
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Handle other methods
  return res.status(405).json({ message: 'Method not allowed' });
} 