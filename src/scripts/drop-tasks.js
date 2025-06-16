// Script to drop task tables
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting to drop task tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'drop-task-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement}`);
        await prisma.$executeRawUnsafe(`${statement};`);
      }
    }
    
    console.log('Successfully dropped task tables');
  } catch (error) {
    console.error('Error dropping task tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 