// Script to create a test user creation request
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUserRequest() {
  try {
    console.log('Creating test user creation request...');
    
    // First, find an existing company and user to use as requester
    const company = await prisma.companies.findFirst();
    if (!company) {
      console.error('No company found in database');
      return;
    }
    
    const requester = await prisma.user.findFirst({
      where: {
        role: 'employer',
        company_id: company.id
      }
    });
    
    if (!requester) {
      console.error('No employer user found for the company');
      return;
    }
    
    // Create the test user creation request
    const newRequest = await prisma.user_creation_requests.create({
      data: {
        name: 'Test User',
        email: 'testuser@example.com',
        role: 'employee',
        company_id: company.id,
        requested_by: requester.id,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('Test user creation request created:', newRequest);
  } catch (error) {
    console.error('Error creating test user request:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUserRequest(); 