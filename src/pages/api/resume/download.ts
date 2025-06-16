import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the request is authorized
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the resume URL from the query parameters
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL parameter' });
  }

  try {
    // Fetch the resume file
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    // Get the file extension from the URL or Content-Type header
    let fileExt = 'pdf';
    const contentType = response.headers['content-type'];
    if (contentType) {
      if (contentType.includes('application/pdf')) {
        fileExt = 'pdf';
      } else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        fileExt = 'docx';
      } else if (contentType.includes('application/msword')) {
        fileExt = 'doc';
      }
    } else if (url.toLowerCase().endsWith('.pdf')) {
      fileExt = 'pdf';
    } else if (url.toLowerCase().endsWith('.docx')) {
      fileExt = 'docx';
    } else if (url.toLowerCase().endsWith('.doc')) {
      fileExt = 'doc';
    }

    // Extract a filename from the URL
    let filename = url.split('/').pop() || `resume.${fileExt}`;
    if (!filename.includes('.')) {
      filename = `${filename}.${fileExt}`;
    }

    // Set appropriate headers for the download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType || `application/${fileExt}`);

    // Stream the file to the client
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ error: 'Failed to download resume' });
  }
} 