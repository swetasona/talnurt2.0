const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function productionSetup() {
  try {
    console.log('🚀 Starting production setup...');
    
    // Get admin credentials from environment variables or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@talnurt.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'Super Administrator';
    
    console.log(`Setting up superadmin: ${adminEmail}`);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      // Update existing admin user
      console.log('Updating existing superadmin user...');
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          name: adminName,
          password: hashedPassword,
          role: 'superadmin',
          updated_at: new Date()
        }
      });
      console.log('✅ Superadmin user updated successfully');
    } else {
      // Create new admin user
      console.log('Creating new superadmin user...');
      await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'superadmin',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('✅ Superadmin user created successfully');
    }
    
    // Verify setup
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      }
    });
    
    console.log('\n🎉 Production setup complete!');
    console.log('Superadmin Details:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Created: ${admin.created_at}`);
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy your application');
    console.log('2. Access admin panel at: /admin/login');
    console.log('3. Change default password after first login');
    
  } catch (error) {
    console.error('❌ Production setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  productionSetup();
}

module.exports = { productionSetup }; 