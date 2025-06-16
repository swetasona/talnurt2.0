const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        role: 'super_admin'
      }
    });

    if (existingSuperAdmin) {
      console.log('A super admin user already exists:', existingSuperAdmin.email);
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    // Create the super admin user
    const superAdmin = await prisma.user.create({
      data: {
        id: uuidv4(),
        name: 'Super Administrator',
        email: 'super.admin@talnurt.com',
        password: hashedPassword,
        role: 'super_admin',
      },
    });

    console.log('Super admin created successfully:');
    console.log({
      id: superAdmin.id,
      name: superAdmin.name,
      email: superAdmin.email,
      role: superAdmin.role
    });

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin(); 