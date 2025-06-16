const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Running custom migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../prisma/migrations/20240615_add_profile_allocation_to_recruiter_candidates.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into separate statements
    const statements = sql.split(';').filter(statement => statement.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement}`);
      await prisma.$executeRawUnsafe(statement);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration(); 