import { NextApiRequest, NextApiResponse } from 'next';
import * as XLSX from 'xlsx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Define the template columns (headers)
    const headers = [
      'title',
      'company',
      'department',
      'location',
      'jobType',  // full-time, part-time, contract, temporary, internship
      'workMode', // on-site, remote, hybrid
      'experience',
      'industry',
      'description',
      'summary',
      'responsibilities',
      'requirements', // Can be multi-line text
      'skills',       // Can be multi-line text
      'salary',
      'currency',     // USD, EUR, GBP, etc.
      'benefits',
      'postedDate',   // YYYY-MM-DD
      'deadline',     // YYYY-MM-DD
      'applicationEmail',
      'applicationUrl',
      'contactPerson',
      'status',       // open, closed, draft
      'isInternalOnly', // true, false
      'isFeatured',   // true, false
    ];
    
    // Create an example row for reference
    const exampleRow = {
      'title': 'Software Engineer',
      'company': 'Example Corp',
      'department': 'Engineering',
      'location': 'New York, NY',
      'jobType': 'full-time',
      'workMode': 'hybrid',
      'experience': '3-5 years',
      'industry': 'Technology',
      'description': 'We are looking for a talented software engineer to join our team...',
      'summary': 'Join our dynamic engineering team working on cutting-edge technologies.',
      'responsibilities': 'Develop and maintain web applications\nWrite clean, maintainable code\nCollaborate with cross-functional teams',
      'requirements': 'Bachelor\'s degree in Computer Science or related field\nProficiency in JavaScript/TypeScript\nExperience with React and Next.js',
      'skills': 'JavaScript\nTypeScript\nReact\nNext.js\nNode.js',
      'salary': '100000-120000',
      'currency': 'USD',
      'benefits': 'Health insurance, 401k, flexible working hours',
      'postedDate': new Date().toISOString().split('T')[0], // Today's date
      'deadline': '', // Example: '2023-12-31'
      'applicationEmail': 'careers@example.com',
      'applicationUrl': 'https://example.com/careers',
      'contactPerson': 'Jane Smith',
      'status': 'open',
      'isInternalOnly': false,
      'isFeatured': true,
    };
    
    // Create the worksheet for the template
    const templateData = [headers, Object.values(exampleRow)];
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths for better readability
    const wsCols = headers.map(() => ({ wch: 25 })); // Width for all columns
    worksheet['!cols'] = wsCols;
    
    // Add the JobPostings worksheet FIRST to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'JobPostings');
    
    // Create a notes sheet with instructions
    const notes = [
      ['Job Posting Template - Instructions'],
      [''],
      ['1. Fill in the template with your job posting data in the JobPostings sheet'],
      ['2. For fields like "requirements" and "skills", separate multiple items with a new line'],
      ['3. For jobType, use one of: full-time, part-time, contract, temporary, internship'],
      ['4. For workMode, use one of: on-site, remote, hybrid'],
      ['5. For status, use one of: open, closed, draft'],
      ['6. For isInternalOnly and isFeatured, use true or false'],
      ['7. For dates (postedDate, deadline), use YYYY-MM-DD format'],
      ['8. IMPORTANT: Delete all empty rows after your job entries to avoid importing blank jobs'],
      ['9. The "title" field is required - rows without a title will be ignored'],
      [''],
      ['Note: Fields with * are required (title, description, location)'],
      [''],
      ['IMPORTANT: Make sure you are entering data in the "JobPostings" sheet, not this Instructions sheet!']
    ];
    
    // Create the worksheet for the instructions
    const notesWs = XLSX.utils.aoa_to_sheet(notes);
    
    // Set column widths for notes
    const notesWsCols = [{ wch: 70 }]; // Width for first column
    notesWs['!cols'] = notesWsCols;
    
    // Add the Instructions worksheet SECOND to the workbook
    XLSX.utils.book_append_sheet(workbook, notesWs, 'Instructions');
    
    // Generate the Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=job_posting_template.xlsx');
    
    // Send the file
    res.send(excelBuffer);
  } catch (error: any) {
    console.error('Error generating template:', error);
    return res.status(500).json({ 
      error: 'Failed to generate template', 
      message: error.message || 'An unexpected error occurred'
    });
  }
} 