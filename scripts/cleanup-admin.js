const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function cleanupAdmin() {
  try {
    console.log('🧹 Cleaning up admin users...');
    
    // Delete the super.admin@talnurt.com user (we don't need it)
    try {
      const deleted = await prisma.user.delete({
        where: { email: 'super.admin@talnurt.com' }
      });
      console.log('✅ Removed duplicate super.admin@talnurt.com user');
    } catch (error) {
      console.log('ℹ️  No super.admin@talnurt.com user found (already clean)');
    }
    
    // Ensure admin@talnurt.com exists and has proper superadmin setup
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@talnurt.com' },
      update: {
        name: 'Super Administrator',
        password: hashedPassword,
        role: 'superadmin',  // Changed to superadmin role
        updated_at: new Date()
      },
      create: {
        name: 'Super Administrator',
        email: 'admin@talnurt.com',
        password: hashedPassword,
        role: 'superadmin',  // Changed to superadmin role
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('\n🎉 Admin cleanup complete!');
    console.log('Your superadmin details:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Password: Admin@123`);
    console.log('\n✅ You now have ONE superadmin with full access!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAdmin(); 