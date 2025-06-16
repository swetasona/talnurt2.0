import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check columns in users table
    const usersTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    console.log('Users table columns:');
    console.log(usersTableInfo);
    
    // Check if company column exists
    const companyColumn = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'company';
    `;
    
    console.log('Company column exists:', companyColumn);
    
    // Check a sample user
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        company_id: true,
        role: true
      }
    });
    
    console.log('Sample user:');
    console.log(sampleUser);
    
  } catch (error) {
    console.error('Error checking database schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSchema(); 