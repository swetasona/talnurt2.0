import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Stream, Writable } from 'stream';

// Helper function to get MIME type from file extension
const getMimeType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: urlPath } = req.query;
  
  // Security check: Make sure path is an array and doesn't contain any path traversal
  if (!Array.isArray(urlPath) || urlPath.some(segment => segment.includes('..'))) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  
  // Construct the file path
  const filePath = path.join(process.cwd(), 'uploads', ...urlPath);
  
  // Check if file exists
  try {
    const stat = fs.statSync(filePath);
    
    if (!stat.isFile()) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    // Set content-type based on file extension
    const contentType = getMimeType(filePath);
    res.setHeader('Content-Type', contentType);
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    
    // Make sure we handle stream errors
    fileStream.on('error', (err) => {
      console.error(`Error streaming file: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });
    
    // Pipe the file to the response
    await new Promise<void>((resolve, reject) => {
      fileStream.pipe(res as unknown as Writable);
      fileStream.on('end', () => resolve());
      fileStream.on('error', reject);
    });
    
    return;
  } catch (error) {
    console.error(`Error serving file from ${filePath}:`, error);
    return res.status(404).json({ error: 'File not found' });
  }
} 