import { NextApiRequest, NextApiResponse } from 'next';
import { getCandidateById, updateCandidate, deleteCandidate } from '@/lib/db-postgres';
import { Candidate } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    console.error('Invalid candidate ID provided:', id);
    return res.status(400).json({ error: 'Invalid candidate ID' });
  }
  
  console.log(`API request for candidate with ID: ${id}, method: ${req.method}`);
  
  try {
    switch (req.method) {
      case 'GET':
        try {
        // Get candidate by ID
        const candidate = await getCandidateById(id);
        
        if (!candidate) {
          console.log(`No candidate found with ID: ${id}`);
          return res.status(404).json({ error: 'Candidate not found' });
        }
        
        console.log(`Found candidate in database: ${candidate.name}`);
        return res.status(200).json(candidate);
        } catch (fetchError: any) {
          console.error(`Error getting candidate by ID: ${id}`, fetchError);
          return res.status(500).json({ 
            error: 'Error retrieving candidate', 
            message: fetchError.message || 'Unknown error'
          });
        }
        
      case 'PUT':
        // Update candidate
        console.log(`Updating candidate with ID: ${id}`);
        const updatedCandidateData = req.body as Candidate;
        const updatedCandidate = await updateCandidate(id, updatedCandidateData);
        
        if (!updatedCandidate) {
          console.log(`Failed to update candidate with ID: ${id}`);
          return res.status(404).json({ error: 'Candidate not found or update failed' });
        }
        
        console.log(`Successfully updated candidate: ${updatedCandidate.name}`);
        return res.status(200).json(updatedCandidate);
        
      case 'DELETE':
        // Delete candidate
        try {
          console.log(`Processing DELETE request for candidate ID: ${id}`);
          
          // Attempt to delete the candidate
          const deletedCandidate = await deleteCandidate(id);
          
          // Log the result
          console.log(`Delete result for candidate ${id}:`, deletedCandidate ? 'Success' : 'No result');
          
          // If the result is falsy, throw an appropriate error
          if (!deletedCandidate) {
            throw new Error(`Failed to delete candidate with ID: ${id}`);
          }
          
          // Return a 200 response with the deleted candidate data
          return res.status(200).json({ 
            success: true, 
            message: 'Candidate deleted successfully', 
            data: deletedCandidate 
          });
        } catch (deleteError: any) {
          console.error(`Error deleting candidate ${id}:`, deleteError);
          
          // For 'not found' errors, use 404 status code
          if (deleteError.message && deleteError.message.includes('not found')) {
            return res.status(404).json({ 
              error: 'Candidate not found',
              message: deleteError.message
            });
          }
          
          // For other errors, use 500 status code
          return res.status(500).json({ 
            error: 'Failed to delete candidate',
            message: deleteError.message || 'Unknown error occurred',
            stack: process.env.NODE_ENV === 'development' ? deleteError.stack : undefined
          });
        }
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error(`Error processing request for candidate ID ${id}:`, error);
    return res.status(500).json({ 
      error: error.message || 'Something went wrong',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
} 