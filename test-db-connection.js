const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try to query the users table
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    // Print the first user (if any)
    if (users.length > 0) {
      console.log('First user:', {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role
      });
    }
    
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
