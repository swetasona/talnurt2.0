// Script to delete all jobs from the database
// Usage: node scripts/delete-all-jobs.js

const https = require('https');
const http = require('http');

// Configuration
const API_HOST = 'localhost';
const API_PORT = 3000;
const API_PATH = '/api/jobs/delete-all?confirm=true';

// Function to make the API request
async function deleteAllJobs() {
  return new Promise((resolve, reject) => {
    // Use HTTP for localhost, HTTPS for production
    const client = API_HOST === 'localhost' ? http : https;
    
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PATH,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Success!');
            console.log(`📊 ${responseData.message}`);
            resolve(responseData);
          } else {
            console.error('❌ Error:');
            console.error(`   Status: ${res.statusCode}`);
            console.error(`   Message: ${responseData.message || responseData.error || 'Unknown error'}`);
            reject(new Error(responseData.message || responseData.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

// Run the script
console.log('🗑️  Deleting all jobs from the database...');
console.log('⚠️  WARNING: This operation cannot be undone!');

// Add a small delay to show the warning
setTimeout(async () => {
  try {
    await deleteAllJobs();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}, 1000); 