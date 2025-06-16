import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedResumeParserResponse, FileInfo } from '@/types/resume';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadResult {
  filePath: string;
  originalFilename: string;
}

// Custom file interface that works with different versions of formidable
interface FormidableFile {
  filepath?: string;
  path?: string;
  originalFilename?: string;
  name?: string;
  size: number;
  mimetype?: string;
  type?: string;
}

// For formidable types
interface Files {
  [key: string]: FormidableFile | FormidableFile[] | undefined;
}

// In-memory cache for recent parses to improve performance
const parseCache = new Map<string, {
  timestamp: number,
  result: EnhancedResumeParserResponse
}>();

// Cache expiration time (30 minutes)
const CACHE_TTL = 30 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Always set JSON content type header first
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', success: false });
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    console.log('Upload directory path:', uploadsDir);
    
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Created uploads directory:', uploadsDir);
      } catch (dirError: any) {
        console.error('Failed to create uploads directory:', dirError);
        return res.status(500).json({ 
          error: 'Server error: Could not create uploads directory', 
          details: dirError.message,
          success: false 
        });
      }
    }

    // Configure formidable
    const options = {
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: false
    };

    console.log('Processing file upload...');

    // Step 1: Upload the file
    const { filePath, originalFilename } = await uploadFile(req, options);
    
    // Check if we have a cached result for this file
    const fileHash = `${originalFilename}-${fs.statSync(filePath).size}`;
    
    const cachedResult = parseCache.get(fileHash);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      console.log('Using cached result for', originalFilename);
      
      // Update file info in the cached result
      cachedResult.result.fileInfo = {
        filePath,
        filename: path.basename(filePath),
        originalFilename,
        extension: path.extname(filePath)
      };
      
      return res.status(200).json(cachedResult.result);
    }
    
    // Step 2: Parse the resume using DeepSeek
    const parseResult = await parseResumeWithDeepSeek(filePath);
    
    // Process contact info if available in DeepSeek response format
    const rawResult = parseResult as any;
    if (rawResult.contact_info) {
      // Extract contact info properties to top level for frontend compatibility
      parseResult.email = rawResult.contact_info.email;
      parseResult.phone = rawResult.contact_info.phone;
      parseResult.linkedin = rawResult.contact_info.linkedin;
      parseResult.github = rawResult.contact_info.github;
      parseResult.website = rawResult.contact_info.website;
    }
    
    // Add file info to result
    parseResult.fileInfo = {
      filePath,
      filename: path.basename(filePath),
      originalFilename,
      extension: path.extname(filePath)
    };
    
    // Cache the result if successful
    if (parseResult.success) {
      parseCache.set(fileHash, {
        timestamp: Date.now(),
        result: parseResult
      });
    }
    
    // Return the successful result
    console.log('Resume parsed successfully with DeepSeek');
    return res.status(200).json(parseResult);
    
  } catch (error: any) {
    console.error('Error processing resume with DeepSeek:', error);
    
    // Detailed error information
    let errorDetails = error.message || 'Unknown error';
    
    return res.status(500).json({ 
      error: 'Failed to process resume with DeepSeek',
      details: errorDetails,
      success: false
    });
  }
}

async function uploadFile(req: NextApiRequest, options: any): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm(options);
    
    // Use type assertion to work around formidable type issues
    form.parse(req, (err, fields, files: any) => {
      if (err) {
        console.error('Error parsing form:', err);
        return reject(new Error(`File upload failed: ${err.message}`));
      }

      try {
        // Handle different versions of formidable
        const fileOrFiles = files.resume;
        const file = fileOrFiles && (Array.isArray(fileOrFiles) 
          ? fileOrFiles[0] 
          : fileOrFiles);
        
        if (!file) {
          return reject(new Error('No file uploaded'));
        }

        console.log('File received:', {
          originalFilename: file.originalFilename || file.name,
          size: file.size,
          type: file.mimetype || file.type
        });

        // Generate a unique filename
        const timestamp = Date.now();
        const originalFilename = file.originalFilename || file.name || 'unknown.pdf';
        const fileExtension = path.extname(originalFilename);
        const newFilename = `resume_deepseek_${timestamp}${fileExtension}`;
        const newPath = path.join(options.uploadDir, newFilename);

        // Get the temporary file path
        const tempPath = file.filepath || file.path;
        if (!tempPath) {
          return reject(new Error('No temporary file path available'));
        }
        
        console.log('Temporary file path:', tempPath);
        console.log('Moving file to:', newPath);

        // Rename the file
        try {
          fs.renameSync(tempPath, newPath);
          console.log('File moved successfully');
        } catch (renameError) {
          console.error('Error moving file:', renameError);
          // Try copy + delete as fallback
          try {
            fs.copyFileSync(tempPath, newPath);
            fs.unlinkSync(tempPath);
            console.log('File copied successfully (fallback method)');
          } catch (copyError: any) {
            console.error('Error copying file (fallback):', copyError);
            return reject(new Error(`Failed to process uploaded file: ${copyError.message}`));
          }
        }

        // Verify the file exists at the new location
        if (!fs.existsSync(newPath)) {
          console.error('File not found at target path after move/copy');
          return reject(new Error('File moved but not found at target location'));
        }

        resolve({
          filePath: newPath,
          originalFilename: originalFilename
        });
        
      } catch (error: any) {
        console.error('Error processing uploaded file:', error);
        reject(new Error(`Error processing uploaded file: ${error.message}`));
      }
    });
  });
}

async function parseResumeWithDeepSeek(filePath: string): Promise<EnhancedResumeParserResponse> {
  // Set path to DeepSeek parser script
  const parserScript = path.join(process.cwd(), 'python', 'deepseek_resume_parser.py');
  
  console.log(`DeepSeek parser script path: ${parserScript}`);
  
  // Check if parser script exists
  if (!fs.existsSync(parserScript)) {
    console.error(`DeepSeek parser script not found: ${parserScript}`);
    throw new Error('DeepSeek parser script not found. Please make sure it\'s installed correctly.');
  }
  
  // Set environment variable for original file extension
  const fileExt = path.extname(filePath).toLowerCase();
  process.env.ORIGINAL_FILE_EXTENSION = fileExt.substring(1);
  
  return new Promise((resolve, reject) => {
    console.log(`Executing: python "${parserScript}" "${filePath}"`);
    
    // Use a timeout of 2 minutes (reasonable for API calls)
    const timeout = 120000;
    let timedOut = false;
    
    // Create a timer for the timeout
    const timer = setTimeout(() => {
      timedOut = true;
      console.log('DeepSeek parser execution timed out');
      
      // Return minimal valid response
      resolve({
        success: false,
        error: 'DeepSeek parser timed out after 2 minutes',
        details: 'The parsing process is taking too long. Try again with a smaller file or try later.',
        education: [],
        experience: [],
        skill: {
          technical_skills: [],
          soft_skills: [],
          tools: []
        }
      });
    }, timeout);
    
    // Execute the process asynchronously
    const process = exec(`python "${parserScript}" "${filePath}"`, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });
    
    let output = '';
    let errorOutput = '';
    
    // Collect standard output - This should now be clean JSON only
    process.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    // Collect error output - This should contain all log/debug messages
    process.stderr?.on('data', (data) => {
      errorOutput += data.toString();
      // Log debug messages to console
      console.log(`DeepSeek stderr: ${data}`);
    });
    
    // Handle process completion
    process.on('close', (code) => {
      clearTimeout(timer);
      
      // If already resolved due to timeout, don't process further
      if (timedOut) return;
      
      if (code !== 0) {
        console.error(`DeepSeek parser exited with code ${code}`);
        console.error('Error output:', errorOutput);
        
        // Return minimal valid response with error
        return resolve({
          success: false,
          error: `DeepSeek parser failed with exit code ${code}`,
          details: errorOutput || 'No error details available',
          education: [],
          experience: [],
          skill: {
            technical_skills: [],
            soft_skills: [],
            tools: []
          }
        });
      }
      
      if (!output || output.trim() === '') {
        console.error('DeepSeek parser returned empty output');
        console.log('Error/debug output:', errorOutput);
        return resolve({
          success: false,
          error: 'DeepSeek parser returned empty output',
          details: errorOutput || 'The Python script completed but returned no data',
          education: [],
          experience: [],
          skill: {
            technical_skills: [],
            soft_skills: [],
            tools: []
          }
        });
      }
      
      // Log a sample of the output for debugging
      console.log(`DeepSeek parser output (first 100 chars): ${output.substring(0, 100)}...`);
      
      // First, try to parse the output directly as JSON since the Python script
      // should now be sending clean JSON to stdout
      try {
        const result = JSON.parse(output.trim());
        console.log("Successfully parsed JSON output directly");
        
        // Don't modify the structure - return exactly what the Python script provides
        // Just ensure the basic fields exist for safety
        const finalResult: any = {
          ...result,
          success: result.success !== false,  // Default to true unless explicitly false
          education: result.education || [],
          experience: result.experience || []
        };
        
        // Ensure skill object exists with proper subfields
        if (!finalResult.skill) {
          // If skill is missing but skills exists, use that instead
          if (finalResult.skills && typeof finalResult.skills === 'object' && !Array.isArray(finalResult.skills)) {
            finalResult.skill = finalResult.skills;
            // Remove the old skills field to prevent duplication
            delete finalResult.skills;
          } else {
            // Create empty skill structure
            finalResult.skill = {
              technical_skills: [],
              soft_skills: [],
              tools: []
            };
          }
        }
        
        // Clean up any top-level duplicated fields
        const fieldsToRemove = [
          'technical_skills', 
          'soft_skills', 
          'tools', 
          'skills',  // Remove 'skills' if 'skill' is present
          'email',
          'phone',
          'linkedin',
          'github',
          'language_skills'
        ];
        
        // Remove any fields that should not be at the top level
        for (const field of fieldsToRemove) {
          if (finalResult[field]) {
            console.log(`Removing duplicated field from response: ${field}`);
            delete finalResult[field];
          }
        }
        
        return resolve(finalResult as EnhancedResumeParserResponse);
      } catch (e) {
        console.log("Failed to parse clean JSON output, attempting fallback methods:", e);
        
        // If direct parsing fails, use the extractJSON fallback methods
        const extractJSON = () => {
          // APPROACH 1: Direct JSON parse attempt on entire output
          // This should now work with the updated Python script that outputs clean JSON
          try {
            const result = JSON.parse(output.trim());
            console.log("Successfully parsed entire output as JSON");
            return result;
          } catch (e) {
            console.log("Failed to parse entire output as JSON");
          }
          
          // APPROACH 2: Search for JSON objects using regex - find the largest JSON object
          // Keep this as a fallback for backward compatibility
          const jsonRegexAll = /(\{[\s\S]*?\})/g;
          let match;
          const matches = [];
          
          // Use exec in a loop instead of matchAll for better compatibility
          while ((match = jsonRegexAll.exec(output)) !== null) {
            matches.push(match);
            // Avoid infinite loops with zero-width matches
            if (match.index === jsonRegexAll.lastIndex) {
              jsonRegexAll.lastIndex++;
            }
          }
          
          if (matches.length > 0) {
            // Sort matches by length to try the largest JSON object first
            matches.sort((a, b) => b[0].length - a[0].length);
            
            for (const match of matches) {
              try {
                console.log("Found JSON object of length:", match[0].length);
                return JSON.parse(match[0]);
              } catch (e) {
                console.log("Failed to parse JSON object:", e);
                // Continue with next match
              }
            }
          }
          
          // APPROACH 3: Find the outermost braces
          const startIndex = output.indexOf('{');
          const endIndex = output.lastIndexOf('}');
          
          if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
            const jsonText = output.substring(startIndex, endIndex + 1);
            
            try {
              console.log("Extracted JSON using outermost braces");
              return JSON.parse(jsonText);
            } catch (e) {
              console.log("Failed to parse JSON from outermost braces");
              
              // Simple repair attempt: Fix trailing commas
              try {
                const fixedText = jsonText.replace(/,\s*([}\]])/g, '$1');
                console.log("Attempting to fix trailing commas");
                return JSON.parse(fixedText);
              } catch (e) {
                console.log("Failed to fix JSON with trailing comma repair");
              }
            }
          }
          
          // If all extraction methods fail, return null
          console.log("All JSON extraction methods failed");
          return null;
        };
        
        // Try to extract JSON using fallback methods
        const parsedResult = extractJSON();
        
        if (parsedResult) {
          // Determine if we have valid data regardless of success flag
          const hasValidData = Boolean(
            (parsedResult.name && parsedResult.name.trim() !== '') || 
            (parsedResult.education && parsedResult.education.length > 0) ||
            (parsedResult.experience && parsedResult.experience.length > 0) ||
            (parsedResult.skill && typeof parsedResult.skill === 'object' && 
              Object.values(parsedResult.skill as Record<string, string[]>).some((arr) => Array.isArray(arr) && arr.length > 0))
          );
          
          // Override success field if we have valid data but success is false
          if (hasValidData && !parsedResult.success) {
            console.log('Found valid data but success flag is false. Overriding success status.');
            parsedResult.success = true;
          }
          
          // Check if the result contains required fields
          if (!parsedResult.success && parsedResult.error) {
            console.error('DeepSeek parser returned error:', parsedResult.error);
            return resolve({
              ...parsedResult,
              education: parsedResult.education || [],
              experience: parsedResult.experience || [],
              skill: parsedResult.skill || {
                technical_skills: [],
                soft_skills: [],
                tools: []
              }
            });
          }
          
          // Create a clean result with the required structure
          const result: any = {
            success: parsedResult.success !== false,
            name: parsedResult.name || '',
            contact_info: parsedResult.contact_info || {
              email: parsedResult.email || '',
              phone: parsedResult.phone || '',
              linkedin: parsedResult.linkedin || '',
              github: parsedResult.github || ''
            },
            education: parsedResult.education || [],
            experience: parsedResult.experience || []
          };
          
          // Handle skill field correctly
          if (parsedResult.skill) {
            result.skill = parsedResult.skill;
          } else if (parsedResult.skills) {
            result.skill = parsedResult.skills;
          } else {
            // Create skill structure from individual fields if necessary
            const techSkills = parsedResult.technical_skills || [];
            const softSkills = parsedResult.soft_skills || [];
            const toolsList = parsedResult.tools || [];
            
            if (techSkills.length > 0 || softSkills.length > 0 || toolsList.length > 0) {
              result.skill = {
                technical_skills: techSkills,
                soft_skills: softSkills,
                tools: toolsList
              };
            } else {
              // Default empty structure
              result.skill = {
                technical_skills: [],
                soft_skills: [],
                tools: []
              };
            }
          }
          
          // Clean up any top-level duplicated fields
          const fieldsToRemove = [
            'technical_skills', 
            'soft_skills', 
            'tools', 
            'skills',
            'email',
            'phone',
            'linkedin',
            'github',
            'language_skills'
          ];
          
          for (const field of fieldsToRemove) {
            if (field in result) {
              console.log(`Removing duplicated field from fallback response: ${field}`);
              delete result[field];
            }
          }
          
          return resolve(result as EnhancedResumeParserResponse);
        } else {
          // If JSON extraction failed, create error response
          console.error('Error parsing JSON output from DeepSeek');
          console.log('Complete raw output:', output);
          
          // Create minimal valid response
          const fileInfo: FileInfo = {
            filePath,
            filename: path.basename(filePath),
            originalFilename: path.basename(filePath),
            extension: path.extname(filePath)
          };
          
          // Return error response with required empty arrays
          resolve({
            success: false,
            error: 'Failed to extract valid JSON from model output',
            details: output.substring(0, 500), // Include a portion of the raw output in details field
            fileInfo,
            education: [],
            experience: [],
            skill: {
              technical_skills: [],
              soft_skills: [],
              tools: []
            }
          });
        }
      }
    });
    
    // Handle process errors
    process.on('error', (err) => {
      clearTimeout(timer);
      
      // If already resolved due to timeout, don't process further
      if (timedOut) return;
      
      console.error('Error executing DeepSeek parser:', err);
      
      // Return error response
      resolve({
        success: false,
        error: `Failed to execute DeepSeek parser: ${err.message}`,
        education: [],
        experience: [],
        skill: {
          technical_skills: [],
          soft_skills: [],
          tools: []
        }
      });
    });
  });
} 