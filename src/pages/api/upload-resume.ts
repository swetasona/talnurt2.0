import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
  // Always set JSON content type header first thing
  res.setHeader('Content-Type', 'application/json');
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', success: false });
  }

  try {
    console.log('Starting resume upload process...');
    
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    console.log('Upload directory path:', uploadDir);
    
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Created uploads directory:', uploadDir);
      } catch (dirError: any) {
        console.error('Failed to create uploads directory:', dirError);
        return res.status(500).json({ 
          error: 'Server error: Could not create uploads directory', 
          details: dirError.message,
          success: false 
        });
      }
    }

    // Verify the directory is writable
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log('Upload directory is writable');
    } catch (accessError: any) {
      console.error('Upload directory is not writable:', accessError);
      return res.status(500).json({ 
        error: 'Server error: Upload directory is not writable', 
        details: accessError.message,
        success: false 
      });
    }

    // Parse form data
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: false
    });

    console.log('Processing file upload...');

    // Parse the form
    const formData = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    console.log('Received form data fields:', Object.keys(formData.fields));
    console.log('Received form data files:', Object.keys(formData.files));

    // Make sure a file was uploaded
    const fileField = formData.files.file || formData.files.resume;
    if (!fileField) {
      console.error('No file field found in upload. Available fields:', Object.keys(formData.files));
      return res.status(400).json({ 
        error: 'No file uploaded', 
        success: false 
      });
    }

    // Get the candidate ID from the form data
    const candidateId = formData.fields.candidateId?.[0] || uuidv4();
    console.log('Using candidate ID:', candidateId);

    // Handle single file or array of files
    const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField;
    console.log('File details:', {
      name: uploadedFile.originalFilename || 'unknown',
      size: uploadedFile.size,
      type: uploadedFile.mimetype
    });

    // Verify it's a PDF or DOCX
    const allowedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
      // Remove the temporary file
      fs.unlinkSync(uploadedFile.filepath);
      console.error('Invalid file type:', uploadedFile.mimetype);
      return res.status(400).json({ 
        error: 'Only PDF and DOCX files are allowed', 
        success: false 
      });
    }

    // Generate a unique filename
    const originalExt = path.extname(uploadedFile.originalFilename || '.pdf');
    const uniqueFilename = `resume_${candidateId}_${Date.now()}${originalExt}`;
    const destinationPath = path.join(uploadDir, uniqueFilename);
    console.log('Destination path:', destinationPath);

    // Rename/move the file
    try {
      fs.copyFileSync(uploadedFile.filepath, destinationPath);
      fs.unlinkSync(uploadedFile.filepath); // Remove the temp file
      console.log('File moved successfully');
    } catch (moveError: any) {
      console.error('Error moving file:', moveError);
      return res.status(500).json({ 
        error: 'Failed to save uploaded file', 
        details: moveError.message,
        success: false 
      });
    }

    // Check if file exists at destination
    if (!fs.existsSync(destinationPath)) {
      console.error('File not found at destination after move');
      return res.status(500).json({ 
        error: 'File processing error: not found after move', 
        success: false 
      });
    }

    // Return the file URL
    const fileUrl = `/uploads/${uniqueFilename}`;
    console.log('Upload successful, returning URL:', fileUrl);
    
    return res.status(200).json({ 
      success: true,
      fileUrl,
      filePath: fileUrl // Note: using relative URL, not full path
    });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to upload resume: ' + error.message 
    });
  }
} 