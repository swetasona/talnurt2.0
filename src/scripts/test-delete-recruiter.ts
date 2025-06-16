/**
 * Script to test the delete recruiter API endpoint directly.
 * 
 * To run this script:
 * 1. Replace the recruiterId with an actual recruiter ID
 * 2. Set the adminToken to your admin token value (you can get this from browser cookies)
 * 3. Run with: npx ts-node src/scripts/test-delete-recruiter.ts
 */

import fetch from 'node-fetch';

// Define response types
interface AuthResponse {
  authenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
}

interface DeleteResponse {
  message?: string;
  user?: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
  error?: string;
  details?: string;
}

// Replace these values with your actual data
const recruiterId = 'YOUR_RECRUITER_ID_HERE';
const adminToken = 'YOUR_ADMIN_TOKEN_HERE';
const baseUrl = 'http://localhost:3000'; // Use your development server URL

async function testDeleteRecruiter() {
  try {
    console.log(`Testing delete functionality for recruiter ID: ${recruiterId}`);
    
    // First check authentication status
    const authResponse = await fetch(`${baseUrl}/api/admin/auth/verify`, {
      method: 'GET',
      headers: {
        'Cookie': `admin-token=${adminToken}`
      }
    });
    
    const authData = await authResponse.json() as AuthResponse;
    console.log('Authentication status:', authData);
    
    if (!authData.authenticated) {
      console.error('Not authenticated. Please check your admin token.');
      return;
    }
    
    // Now attempt to delete the recruiter
    const deleteResponse = await fetch(`${baseUrl}/api/admin/recruiters/${recruiterId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `admin-token=${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json() as DeleteResponse;
      console.error(`Error (${deleteResponse.status}):`, errorData);
      return;
    }
    
    const successData = await deleteResponse.json() as DeleteResponse;
    console.log('Delete successful:', successData);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

testDeleteRecruiter(); 