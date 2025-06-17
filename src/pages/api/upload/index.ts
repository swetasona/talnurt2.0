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
        console.log(`Upload directory ensured: ${uploadDir}`);
        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error('Error parsing form:', err);
            reject(err);
            return;
          }
          console.log('Form parsed successfully');
          resolve({ fields, files });
        });
      })
      .catch(error => {
        console.error('Error creating upload directory:', error);
        reject(error);
      });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting file upload process');
    
    // Parse the form
    const { files } = await parseForm(req);
    
    console.log('Files received:', Object.keys(files));
    
    // In formidable v2.1.5, files structure has changed
    const fileField = files.file;
    
    if (!fileField) {
      console.error('No file field found in the request');
      return res.status(400).json({ error: 'No file uploaded or invalid file type. Only JPG, JPEG, or PNG files are allowed.' });
    }

    // Get the first file if it's an array, or use the file directly if it's a single file object
    const file = Array.isArray(fileField) ? fileField[0] : fileField;
    
    if (!file) {
      console.error('No file found in the file field');
      return res.status(400).json({ error: 'No file uploaded or invalid file type. Only JPG, JPEG, or PNG files are allowed.' });
    }

    console.log('File received:', {
      originalFilename: file.originalFilename,
      filepath: file.filepath,
      mimetype: file.mimetype,
      size: file.size
    });

    // Validate file type again on server side
    const fileExt = path.extname(file.originalFilename || '').toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(fileExt)) {
      console.error(`Invalid file extension: ${fileExt}`);
      // Delete the file that was already uploaded
      await fs.unlink(file.filepath);
      return res.status(400).json({ error: 'Invalid file type. Only JPG, JPEG, or PNG files are allowed.' });
    }

    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}-${path.basename(file.originalFilename || 'upload')}`;
    
    // Move the file to the final location with the unique name
    const finalPath = path.join(uploadDir, uniqueFilename);
    await fs.rename(file.filepath, finalPath);
    
    console.log(`File moved to: ${finalPath}`);
    
    // Return the URL for the uploaded file
    const fileUrl = `/uploads/companies/${uniqueFilename}`;
    
    console.log(`Upload successful, returning URL: ${fileUrl}`);
    
    return res.status(200).json({
      url: fileUrl,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
} 