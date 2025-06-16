import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Disable the default body parser to handle files
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads/companies');

// Allowed file types
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

// Parse form with formidable
const parseForm = async (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    filter: (part) => {
      // Return true if we should keep this file
      return part.mimetype ? ALLOWED_FILE_TYPES.includes(part.mimetype) : false;
    }
  });

  return new Promise((resolve, reject) => {
    // Ensure upload directory exists
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ fields, files });
        });
      })
      .catch(reject);
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form
    const { files } = await parseForm(req);
    const fileArray = files.file;
    
    if (!fileArray || !Array.isArray(fileArray) || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file uploaded or invalid file type. Only JPG, JPEG, or PNG files are allowed.' });
    }

    const file = fileArray[0];

    // Validate file type again on server side
    const fileExt = path.extname(file.originalFilename || '').toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(fileExt)) {
      // Delete the file that was already uploaded
      await fs.unlink(file.filepath);
      return res.status(400).json({ error: 'Invalid file type. Only JPG, JPEG, or PNG files are allowed.' });
    }

    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}-${path.basename(file.originalFilename || 'upload')}`;
    
    // Move the file to the final location with the unique name
    const finalPath = path.join(uploadDir, uniqueFilename);
    await fs.rename(file.filepath, finalPath);
    
    // Return the URL for the uploaded file
    const fileUrl = `/uploads/companies/${uniqueFilename}`;
    
    return res.status(200).json({
      url: fileUrl,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
} 