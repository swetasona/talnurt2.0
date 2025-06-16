// Password storage utility that uses the database for persistence
// This approach allows sharing password data between admin and employer APIs
import { PrismaClient } from '@prisma/client';

interface PasswordStorage {
  [requestId: string]: string;
}

// Result type for the database query
interface MetadataResult {
  id: string;
  metadata: string | null;
}

// In-memory cache for faster access during a session
export const generatedPasswords: PasswordStorage = {};

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Stores a generated password for a user creation request in the database
 * Uses the metadata field to store the password as JSON
 * 
 * @param requestId - The ID of the user creation request
 * @param password - The generated password
 */
export async function storePassword(requestId: string, password: string): Promise<void> {
  // Store in memory for fast access during current session
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

/**
 * Retrieves a generated password for a user creation request
 * First checks the in-memory cache, then falls back to the database
 * 
 * @param requestId - The ID of the user creation request
 * @returns The generated password or null if not found
 */
export async function getPassword(requestId: string): Promise<string | null> {
  // First check in-memory cache for fast access
  if (generatedPasswords[requestId]) {
    return generatedPasswords[requestId];
  }
  
  try {
    // If not in memory, try to fetch from database
    const result = await prisma.$queryRaw<MetadataResult[]>`
      SELECT id, metadata
      FROM user_creation_requests
      WHERE id = ${requestId}
      AND status = 'approved'
    `;
    
    if (result && result.length > 0 && result[0].metadata) {
      try {
        // Parse the metadata JSON from the database
        const metadata = JSON.parse(result[0].metadata);
        if (metadata.password) {
          // Store in memory cache for future fast access
          generatedPasswords[requestId] = metadata.password;
          return metadata.password;
        }
      } catch (e) {
        console.error('Error parsing metadata JSON:', e);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving password from database:', error);
    return null;
  }
}

/**
 * Loads all approved requests' passwords from the database into memory
 * Call this at application startup
 */
export async function loadAllPasswordsFromDatabase(): Promise<void> {
  try {
    console.log('Loading approved request passwords from database...');
    
    // Query all approved requests with metadata
    const results = await prisma.$queryRaw<MetadataResult[]>`
      SELECT id, metadata
      FROM user_creation_requests
      WHERE status = 'approved'
      AND metadata IS NOT NULL
    `;
    
    let loadedCount = 0;
    
    for (const row of results) {
      if (row.metadata) {
        try {
          const metadata = JSON.parse(row.metadata);
          if (metadata.password) {
            generatedPasswords[row.id] = metadata.password;
            loadedCount++;
          }
        } catch (e) {
          console.error(`Error parsing metadata for request ${row.id}:`, e);
        }
      }
    }
    
    console.log(`Loaded ${loadedCount} passwords from database`);
  } catch (error) {
    console.error('Error loading passwords from database:', error);
  }
} 