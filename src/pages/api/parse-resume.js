import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Always set JSON content type header first
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', success: false });
  }

  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'No file path provided', success: false });
    }
    
    console.log('Received request to parse file:', filePath);
    
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return res.status(400).json({ 
        error: 'File not found', 
        details: `File at path ${filePath} does not exist`,
        success: false
      });
    }
    
    // Get file extension
    const fileExt = path.extname(filePath).toLowerCase();
    console.log('File extension:', fileExt);
    
    // Validate file type
    if (!['.pdf', '.docx', '.doc'].includes(fileExt)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only PDF and DOCX files are supported.',
        success: false
      });
    }
    
    // Set path to parser script
    const parserScript = path.join(process.cwd(), 'python', 'resume_parser_transformer.py');
    console.log('Parser script path:', parserScript);
    
    // Check if parser script exists
    if (!fs.existsSync(parserScript)) {
      console.error(`Parser script not found: ${parserScript}`);
      return res.status(500).json({ 
        error: 'Parser script not found',
        details: 'The resume parser script is missing. Please make sure it\'s installed correctly.',
        success: false
      });
    }
    
    // Set environment variable for original file extension
    process.env.ORIGINAL_FILE_EXTENSION = fileExt.substring(1);
    
    // Execute the parser with a timeout
    console.log(`Parsing resume file: ${filePath}`);
    
    // Create an AbortController to handle timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 180000); // 3 minute timeout
    
    try {
      // Execute the parser - ensure paths have double quotes to handle spaces
      console.log(`Executing: python "${parserScript}" "${filePath}"`);
      const output = execSync(`python "${parserScript}" "${filePath}"`, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: 180000 // 3 minute timeout
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      // Check for empty output
      if (!output || output.trim() === '') {
        console.error('Parser returned empty output');
        return res.status(500).json({
          error: 'Parser returned empty output',
          details: 'The Python script completed but returned no data',
          success: false
        });
      }
      
      // Log first few characters of output for debugging
      console.log(`Parser output (first 100 chars): ${output.substring(0, 100)}...`);
      
      // Parse the JSON output
      try {
        const result = JSON.parse(output);
        
        // Add path info to result
        result.fileInfo = {
          filePath,
          filename: path.basename(filePath),
          extension: fileExt
        };
        
        // Check if the result contains required fields
        if (!result.success && result.error) {
          console.error('Parser returned error:', result.error);
          return res.status(500).json({
            error: result.error,
            details: result.details || 'The parser encountered an error during processing',
            success: false
          });
        }
        
        // Check if name was detected, if not add a warning
        if (!result.name || result.name.trim() === '') {
          console.warn('Name was not detected in the resume');
          result.warnings = result.warnings || [];
          result.warnings.push('Name could not be detected from the resume');
        }
        
        // Return the successful result
        console.log('Resume parsed successfully');
        return res.status(200).json(result);
      } catch (jsonError) {
        console.error('Error parsing JSON output:', jsonError);
        console.log('Raw output:', output);
        return res.status(500).json({ 
          error: 'Failed to parse parser output',
          details: `Invalid JSON response: ${jsonError.message}. First 200 characters of output: ${output.substring(0, 200)}...`,
          success: false
        });
      }
    } catch (execError) {
      // Clear the timeout since we got an error
      clearTimeout(timeoutId);
      
      console.error('Error executing parser:', execError);
      
      // Check if the error is due to timeout
      if (execError.signal === 'SIGTERM' || execError.message.includes('timeout')) {
        return res.status(500).json({ 
          error: 'Parser execution timed out', 
          details: 'The parsing process took too long and was terminated. Try with a simpler resume or try again later.',
          success: false
        });
      } 
      
      // If we got stderr output from the process, include it
      let errorDetails = execError.message || 'Unknown error';
      if (execError.stderr) {
        errorDetails += `\nStderr: ${execError.stderr}`;
      }
      
      // Check if the error is from the child process
      if (execError.status) {
        return res.status(500).json({ 
          error: 'Parser execution failed', 
          details: errorDetails,
          success: false
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to parse resume',
        details: errorDetails,
        success: false
      });
    }
  } catch (error) {
    console.error('Error executing parser:', error);
    
    // Detailed error information
    let errorDetails = error.message || 'Unknown error';
    if (error.stack) {
      errorDetails += `\nStack trace: ${error.stack}`;
    }
    
    return res.status(500).json({ 
      error: 'Failed to parse resume',
      details: errorDetails,
      success: false
    });
  }
} 