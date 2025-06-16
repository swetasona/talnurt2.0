import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { resumeUrl } = req.query;
    if (!resumeUrl || typeof resumeUrl !== 'string') {
      return res.status(400).json({ error: 'Invalid resume URL' });
    }

    // Fetch the resume PDF
    let resumeBytes;
    try {
      // If it's a local file (starts with /)
      if (resumeUrl.startsWith('/')) {
        const filePath = path.join(process.cwd(), 'public', resumeUrl);
        if (fs.existsSync(filePath)) {
          resumeBytes = fs.readFileSync(filePath);
        } else {
          throw new Error('Resume file not found');
        }
      } else {
        // If it's a remote URL
        const response = await fetch(resumeUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch resume: ${response.statusText}`);
        }
        resumeBytes = await response.buffer();
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
      return res.status(404).json({ error: 'Could not fetch resume file' });
    }

    // Check if it's a PDF
    const isPdf = resumeBytes.toString('ascii', 0, 5) === '%PDF-';
    if (!isPdf) {
      return res.status(400).json({ error: 'Resume is not a PDF file' });
    }

    // Load the PDF
    const pdfDoc = await PDFDocument.load(resumeBytes);
    
    // Return the PDF bytes
    const pdfBytes = await pdfDoc.save();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    
    // Send the PDF
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error processing resume:', error);
    return res.status(500).json({ error: 'Failed to process resume' });
  } finally {
    await prisma.$disconnect();
  }
} 