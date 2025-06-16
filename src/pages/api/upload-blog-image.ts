import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Always set JSON content type header first thing
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create blogs upload directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'blogs');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created blogs uploads directory:', uploadsDir);
    }

    // Parse the form data with formidable
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      uploadDir: uploadsDir,
    });

    // Parse the form data
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Error parsing form:', err);
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    // Check if a file was uploaded
    const fileKey = Object.keys(files)[0];
    const file = fileKey ? files[fileKey] : null;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileObj = Array.isArray(file) ? file[0] : file;
    
    // Validate file type (only allow images)
    const mimeType = fileObj.mimetype || '';
    if (!mimeType.startsWith('image/')) {
      // Clean up the file if it's not an image
      try {
        fs.unlinkSync(fileObj.filepath);
      } catch (err) {
        console.error('Failed to delete invalid file:', err);
      }
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    // Generate a unique filename for the uploaded file
    const uniqueId = uuidv4();
    const originalName = fileObj.originalFilename || 'image.jpg';
    const fileExt = path.extname(originalName);
    const newFilename = `${uniqueId}${fileExt}`;
    const newFilePath = path.join(uploadsDir, newFilename);

    // Rename the uploaded file
    try {
      fs.renameSync(fileObj.filepath, newFilePath);
    } catch (err) {
      console.error('Error renaming file:', err);
      return res.status(500).json({ error: 'Failed to process uploaded file' });
    }

    // Generate the URL path for the image
    const fileUrl = `/uploads/blogs/${newFilename}`;

    // Return success response with file URL
    return res.status(200).json({
      success: true,
      fileUrl
    });
  } catch (error: any) {
    console.error('Error in upload handler:', error);
    return res.status(500).json({
      error: `Upload error: ${error.message}`
    });
  }
} 