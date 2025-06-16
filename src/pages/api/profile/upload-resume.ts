import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '../auth/[...nextauth]';

// Disable body parsing to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication using server-side session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Parse form data
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Parse the form
    const formData = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Make sure a file was uploaded
    const fileField = formData.files.file;
    if (!fileField) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Handle single file or array of files
    const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField;

    // Verify it's a PDF
    if (uploadedFile.mimetype !== 'application/pdf') {
      // Remove the temporary file
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Generate a unique filename
    const uniqueFilename = `resume_${session.user.id}_${Date.now()}${path.extname(uploadedFile.originalFilename || '.pdf')}`;
    const destinationPath = path.join(uploadDir, uniqueFilename);

    // Rename/move the file
    fs.copyFileSync(uploadedFile.filepath, destinationPath);
    fs.unlinkSync(uploadedFile.filepath); // Remove the temp file

    // Return the file URL
    const fileUrl = `/uploads/${uniqueFilename}`;
    return res.status(200).json({ fileUrl });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    return res.status(500).json({ error: 'Failed to upload resume: ' + error.message });
  }
} 