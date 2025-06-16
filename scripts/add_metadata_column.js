// Script to add the missing metadata column to the user_creation_requests table
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMetadataColumn() {
  try {
    console.log('Adding metadata column to user_creation_requests table...');
    
    // Execute raw SQL to add the column
    await prisma.$executeRaw`ALTER TABLE user_creation_requests ADD COLUMN IF NOT EXISTS metadata TEXT;`;
    
    console.log('Column added successfully!');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addMetadataColumn(); 