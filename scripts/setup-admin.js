const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('Setting up admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    console.log('Password hashed successfully');
    
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@talnurt.com' }
    });
    
    if (existingAdmin) {
      // Update existing admin user
      console.log('Updating existing admin user...');
      const updatedAdmin = await prisma.user.update({
        where: { email: 'admin@talnurt.com' },
        data: {
          name: 'Super Administrator',
          password: hashedPassword,
          role: 'admin',
          updated_at: new Date()
        }
      });
      console.log('Admin user updated successfully:', updatedAdmin.email);
    } else {
      // Create new admin user
      console.log('Creating new admin user...');
      const newAdmin = await prisma.user.create({
        data: {
          id: 'admin-superuser-001',
          name: 'Super Administrator',
          email: 'admin@talnurt.com',
          password: hashedPassword,
          role: 'admin',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('Admin user created successfully:', newAdmin.email);
    }
    
    // Verify the admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@talnurt.com' }
    });
    
    console.log('\n✅ Admin setup complete!');
    console.log('Email:', admin.email);
    console.log('Name:', admin.name);
    console.log('Role:', admin.role);
    console.log('Password: Admin@123');
    console.log('\nYou can now login at: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin(); 