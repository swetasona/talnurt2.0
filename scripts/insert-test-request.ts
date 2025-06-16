import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUserRequest() {
  try {
    console.log('Creating test user creation request...');
    
    // First, find an existing company
    const company = await prisma.companies.findFirst();
    if (!company) {
      console.error('No company found in database');
      return;
    }
    console.log('Found company:', company.name);
    
    // Find an employer user
    let requester = await prisma.user.findFirst({
      where: {
        role: {
          in: ['employer', 'manager']
        },
        company_id: company.id
      }
    });
    
    // If no employer user exists, create one
    if (!requester) {
      console.log('No employer user found. Creating a test employer user...');
      
      // Hash a password for the new user
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      // Create a new employer user
      requester = await prisma.user.create({
        data: {
          name: 'Test Employer',
          email: `employer${Date.now()}@example.com`,
          password: hashedPassword,
          role: 'employer',
          company_id: company.id,
          is_active: true
        }
      });
      
      console.log('Created test employer user:', requester.name);
    } else {
      console.log('Found requester:', requester.name);
    }
    
    // Create the test user creation request
    const newRequest = await prisma.user_creation_requests.create({
      data: {
        name: 'Test User',
        email: `testuser${Date.now()}@example.com`,
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