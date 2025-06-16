// Script to recreate the admin user with the correct name format
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function recreateAdmin() {
  try {
    console.log('Recreating the admin user...');
    
    // Find existing admin
    const existingAdmin = await prisma.user.findUnique({
      where: {
        id: 'admin-superuser-001'
      }
    });
    
    console.log('Existing admin:', existingAdmin);
    
    // Store the original data
    const originalEmail = existingAdmin?.email || 'admin@talnurt.com';
    
    // Delete the existing admin
    if (existingAdmin) {
      console.log('Deleting existing admin user...');
      await prisma.user.delete({
        where: {
          id: 'admin-superuser-001'
        }
      });
    }
    
    // Create a new admin user
    console.log('Creating new admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const newAdmin = await prisma.user.create({
      data: {
        id: 'admin-superuser-001',
        name: 'Administrator',
        email: originalEmail,
        password: hashedPassword,
        role: 'admin',
        is_active: true
      }
    });
    
    console.log('New admin created successfully:', newAdmin);
    
  } catch (error) {
    console.error('Error recreating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
recreateAdmin(); 