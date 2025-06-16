import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '../../../auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let prisma;

  try {
    // Get a database connection
    prisma = await getConnection();

    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      releaseConnection();
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user is authorized (employee, manager, or employer)
    if (!['employee', 'manager', 'employer'].includes(session.user.role)) {
      releaseConnection();
      return res.status(403).json({ error: 'Access denied. You do not have permission to access this resource.' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      releaseConnection();
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    if (req.method === 'GET') {
      // Fetch the candidate
      const candidate = await prisma.candidates.findUnique({
        where: { id }
      });

      if (!candidate) {
        releaseConnection();
        return res.status(404).json({ error: 'Candidate not found' });
      }

      if (!candidate.resume_url) {
        releaseConnection();
        return res.status(404).json({ error: 'Resume not found for this candidate' });
      }

      // Get the absolute path to the resume file
      const resumePath = path.join(process.cwd(), 'public', candidate.resume_url);

      // Check if the file exists
      if (!fs.existsSync(resumePath)) {
        releaseConnection();
        return res.status(404).json({ error: 'Resume file not found' });
      }

      // Determine the file type
      const fileExt = path.extname(resumePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (fileExt === '.pdf') {
        contentType = 'application/pdf';
      } else if (fileExt === '.doc' || fileExt === '.docx') {
        contentType = 'application/msword';
      }

      // Release the connection before streaming the file
      releaseConnection();

      // Set the content type and disposition
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(resumePath)}"`);

      // Stream the file
      const fileStream = fs.createReadStream(resumePath);
      fileStream.pipe(res);
      
      return;
    }

    // Handle other HTTP methods
    releaseConnection();
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error serving candidate resume:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 