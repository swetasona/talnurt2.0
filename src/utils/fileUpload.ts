/**
 * Utility functions for handling file uploads
 */

/**
 * Validates a file based on type and size constraints
 * 
 * @param file - The file to validate
 * @returns An object containing validation result and any error message
 */
export const validateFile = (file: File) => {
  // Check file type
  const acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  console.log('Validating file:', {
    name: file.name,
    type: file.type,
    size: file.size
  });
  
  if (!acceptedTypes.includes(file.type)) {
    console.warn('Invalid file type:', file.type);
    return {
      valid: false,
      error: 'Please upload a PDF or DOCX file'
    };
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    console.warn('File too large:', file.size);
    return {
      valid: false,
      error: 'File size should be less than 5MB'
    };
  }
  
  return {
    valid: true,
    error: null
  };
};

/**
 * Uploads a file to the server
 * 
 * @param file - The file to upload
 * @param candidateId - The ID of the candidate
 * @returns Promise resolving to the uploaded file URL
 */
export const uploadFile = async (file: File, candidateId: string): Promise<string> => {
  console.log('Starting file upload for candidate:', candidateId);
  
  const fileFormData = new FormData();
  fileFormData.append('file', file);
  fileFormData.append('candidateId', candidateId);
  
  // Log form data for debugging
  console.log('Form data prepared:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    candidateId
  });
  
  // Upload the resume with timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    console.log('Sending upload request to /api/upload-resume');
    
    const uploadRes = await fetch('/api/upload-resume', {
      method: 'POST',
      body: fileFormData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Upload response status:', uploadRes.status);
    
    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('Resume upload failed:', {
        status: uploadRes.status,
        statusText: uploadRes.statusText,
        response: errorText
      });
      
      let errorMessage;
      try {
        // Try to parse the error as JSON
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorText;
      } catch {
        // If parsing fails, use the raw text
        errorMessage = errorText;
      }
      
      throw new Error(`Upload failed: ${errorMessage}`);
    }
    
    const responseText = await uploadRes.text();
    console.log('Raw response:', responseText);
    
    let uploadData;
    try {
      uploadData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Server returned an invalid JSON response');
    }
    
    if (!uploadData.fileUrl) {
      console.error('Response missing fileUrl:', uploadData);
      throw new Error('Server returned an invalid response (missing fileUrl)');
    }
    
    console.log('File uploaded successfully:', uploadData.fileUrl);
    return uploadData.fileUrl;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('File upload error:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('File upload timed out. Please try again.');
    }
    
    throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
  }
}; 