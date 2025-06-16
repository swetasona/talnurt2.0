import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JobPosting } from '@/types';

// Disable the default body parser to allow formidable to parse the request
export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse the incoming form data
const parseForm = async (req: NextApiRequest): Promise<{ fields: any; files: any }> => {
  return new Promise((resolve, reject) => {
    // Create temp upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'tmp');
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => {
        const form = new IncomingForm({
          keepExtensions: true,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          uploadDir,
          multiples: false,
        });

        console.log('Starting to parse form data');
        
        form.on('fileBegin', function(name, file) {
          console.log('File upload started:', name, file.originalFilename);
        });
        
        form.on('file', function(name, file) {
          console.log('File received:', name, file.originalFilename, file.filepath);
        });
        
        form.on('error', function(err) {
          console.error('Form error:', err);
          reject(err);
        });

        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error('Error parsing form:', err);
            return reject(err);
          }
          console.log('Form parsed successfully', {
            fields: Object.keys(fields),
            files: files.file ? 'File uploaded' : 'No file uploaded',
          });
          resolve({ fields, files });
        });
      })
      .catch(error => {
        console.error('Error creating upload directory:', error);
        reject(error);
      });
  });
};

// Process the Excel file and extract job data
const processExcelFile = async (filePath: string): Promise<JobPosting[]> => {
  try {
    console.log('Processing Excel file:', filePath);
    // Check if file exists
    try {
      await fs.access(filePath);
      console.log('File exists and is accessible');
    } catch (error) {
      console.error('File does not exist or is not accessible:', error);
      throw new Error('File not found or not accessible');
    }
    
    // Read the file
    const buffer = await fs.readFile(filePath);
    console.log('File read successfully, size:', buffer.length);
    
    // Parse the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Validate workbook
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Invalid Excel file: No sheets found');
    }
    
    // Look for the JobPostings sheet specifically
    const jobPostingsSheetName = workbook.SheetNames.find(name => 
      name.toLowerCase() === 'jobpostings' || name.toLowerCase() === 'job postings'
    );
    
    // If JobPostings sheet not found, try to use the last sheet (not the first which is likely Instructions)
    const sheetName = jobPostingsSheetName || workbook.SheetNames[workbook.SheetNames.length - 1];
    
    console.log('Using sheet:', sheetName);
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Successfully extracted ${rawData.length} rows from Excel`);
    
    // Filter out empty rows (rows without title or with empty title)
    const filteredData = rawData.filter((row: any) => {
      return row.title && row.title.trim() !== '';
    });
    
    console.log(`Filtered down to ${filteredData.length} valid rows with titles`);
    
    // Map the data to our JobPosting type
    const jobs: JobPosting[] = filteredData.map((row: any, index: number) => {
      console.log(`Processing row ${index + 1}:`, row.title || 'No title');
      
      // Extract requirements as an array
      let requirements: string[] = [];
      if (row.requirements) {
        if (typeof row.requirements === 'string') {
          requirements = row.requirements.split('\n').filter(Boolean);
        } else if (Array.isArray(row.requirements)) {
          requirements = row.requirements;
        }
      }
      
      // Extract skills as an array
      let skills: string[] = [];
      if (row.skills) {
        if (typeof row.skills === 'string') {
          skills = row.skills.split('\n').filter(Boolean);
        } else if (Array.isArray(row.skills)) {
          skills = row.skills;
        }
      }
      
      // Create a job posting object
      const job: JobPosting = {
        id: uuidv4(),
        title: row.title || '',
        company: row.company || '',
        department: row.department || '',
        location: row.location || '',
        jobType: row.jobType || 'full-time',
        workMode: row.workMode || 'on-site',
        experience: row.experience || '',
        industry: row.industry || '',
        description: row.description || '',
        summary: row.summary || '',
        responsibilities: row.responsibilities || '',
        requirements: requirements,
        skills: skills,
        salary: row.salary || '',
        currency: (row.currency || 'USD').substring(0, 10), // Limit to 10 chars
        benefits: row.benefits || '',
        postedDate: row.postedDate || new Date().toISOString().split('T')[0],
        deadline: row.deadline || '',
        applicationEmail: row.applicationEmail || '',
        applicationUrl: row.applicationUrl || '',
        contactPerson: row.contactPerson || '',
        status: (row.status as 'open' | 'closed' | 'draft') || 'open',
        isInternalOnly: row.isInternalOnly === 'true' || row.isInternalOnly === true || false,
        isFeatured: row.isFeatured === 'true' || row.isFeatured === true || false,
      };
      
      return job;
    });
    
    console.log(`Processed ${jobs.length} jobs from Excel file`);
    return jobs;
  } catch (error: any) {
    console.error('Error processing Excel file:', error);
    throw new Error(`Failed to process Excel file: ${error.message}`);
  } finally {
    // Clean up - delete the temp file
    try {
      await fs.unlink(filePath);
      console.log('Temporary file deleted:', filePath);
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Import/parse endpoint called with method:', req.method);
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form data
    console.log('Calling parseForm to process uploaded file');
    const { files } = await parseForm(req);
    
    console.log('Form parsing complete, files:', Object.keys(files));
    const file = files.file;
    
    if (!file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File upload details:', {
      originalFilename: file.originalFilename,
      size: file.size,
      filepath: file.filepath,
      mimetype: file.mimetype
    });
    
    // Check file type (accept only Excel files)
    const fileExtension = path.extname(file.originalFilename || '').toLowerCase();
    console.log('File extension:', fileExtension);
    
    if (fileExtension !== '.xlsx' && fileExtension !== '.xls') {
      console.error('Invalid file type:', fileExtension);
      return res.status(400).json({ error: 'Only Excel files (.xlsx, .xls) are allowed' });
    }
    
    // Process the Excel file
    console.log('Starting to process Excel file');
    const jobs = await processExcelFile(file.filepath);
    
    // Return the parsed jobs
    console.log(`Returning ${jobs.length} parsed jobs`);
    return res.status(200).json({ 
      message: 'Excel file parsed successfully',
      jobs,
      count: jobs.length
    });
  } catch (error: any) {
    console.error('Error parsing Excel file:', error);
    return res.status(500).json({ 
      error: 'Failed to parse Excel file', 
      message: error.message || 'An unexpected error occurred'
    });
  }
} 