// Script to generate and store passwords for approved requests that don't have passwords
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// In-memory cache for passwords
const generatedPasswords = {};

// Function to generate a secure random password
function generateSecurePassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

// Store password in database metadata
async function storePassword(requestId, password) {
  // Store in memory
  generatedPasswords[requestId] = password;
  
  try {
    // Store in database by updating the user_creation_requests record
    await prisma.$executeRaw`
      UPDATE user_creation_requests 
      SET metadata = jsonb_build_object('password', ${password})::text
      WHERE id = ${requestId}
    `;
    console.log(`Password stored in database for request ${requestId}`);
  } catch (error) {
    console.error('Error storing password in database:', error);
    // Try alternate method if the first fails (e.g., if JSON functions aren't available)
    try {
      const jsonMetadata = JSON.stringify({ password });
      await prisma.$executeRaw`
        UPDATE user_creation_requests 
        SET metadata = ${jsonMetadata}
        WHERE id = ${requestId}
      `;
      console.log(`Password stored in database using alternate method for request ${requestId}`);
    } catch (fallbackError) {
      console.error('Error storing password using fallback method:', fallbackError);
    }
  }
}

async function regenerateMissingPasswords() {
  try {
    console.log('Fetching approved requests...');
    
    // Get all approved requests
    const approvedRequests = await prisma.user_creation_requests.findMany({
      where: {
        status: 'approved'
      }
    });
    
    console.log(`Found ${approvedRequests.length} approved requests`);
    
    // Get users that were created from these requests to make sure they exist
    const emails = approvedRequests.map(req => req.email);
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: emails
        }
      },
      select: {
        email: true
      }
    });
    
    const existingEmails = new Set(existingUsers.map(user => user.email));
    
    // Process each request
    let updatedCount = 0;
    for (const request of approvedRequests) {
      // Check if this request already has metadata with a password
      if (request.metadata) {
        try {
          const metadata = JSON.parse(request.metadata);
          if (metadata.password) {
            console.log(`Request ${request.id} for ${request.email} already has a password`);
            continue; // Skip this request
          }
        } catch (e) {
          // Metadata exists but isn't valid JSON or doesn't have a password
          console.log(`Request ${request.id} has invalid metadata, will regenerate password`);
        }
      }
      
      // Verify user exists
      if (!existingEmails.has(request.email)) {
        console.log(`User with email ${request.email} doesn't exist, skipping`);
        continue;
      }
      
      console.log(`Processing request for ${request.email}...`);
      
      // Generate a new password
      const newPassword = generateSecurePassword();
      
      // Hash the password for storage in the users table
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update the user's password in the database
      await prisma.user.updateMany({
        where: {
          email: request.email
        },
        data: {
          password: hashedPassword
        }
      });
      
      // Store the password in the user_creation_requests metadata
      await storePassword(request.id, newPassword);
      
      console.log(`Password regenerated for ${request.email}: ${newPassword}`);
      updatedCount++;
    }
    
    console.log(`Password regeneration completed. Updated ${updatedCount} users.`);
  } catch (error) {
    console.error('Error regenerating passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
regenerateMissingPasswords(); 