// Script to directly fix the admin user name in the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminName() {
  try {
    console.log('Looking for admin user to fix...');
    
    // Get the admin user
    const adminUser = await prisma.user.findUnique({
      where: {
        id: 'admin-superuser-001'
      }
    });
    
    if (!adminUser) {
      console.log('Admin user not found with ID: admin-superuser-001');
      
      // Try to find any admin users
      const admins = await prisma.user.findMany({
        where: {
          role: 'admin'
        }
      });
      
      if (admins.length === 0) {
        console.log('No admin users found in the database');
        return;
      }
      
      console.log(`Found ${admins.length} admin users:`);
      for (const admin of admins) {
        console.log(`ID: ${admin.id}, Name: ${admin.name}, Role: ${admin.role}`);
        
        // Update each admin's name to ensure no "(Admin)" suffix
        const newName = admin.name.replace(/\s*\([^)]*\)/g, '');
        console.log(`Updating name from "${admin.name}" to "${newName}"`);
        
        await prisma.user.update({
          where: { id: admin.id },
          data: { name: newName }
        });
      }
    } else {
      console.log(`Found admin user: ${adminUser.name} (${adminUser.role})`);
      
      // Remove any parenthetical suffixes from the name
      const newName = 'Administrator';
      console.log(`Updating name from "${adminUser.name}" to "${newName}"`);
      
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { name: newName }
      });
      
      console.log('Admin user name updated successfully');
    }
    
    // Final verification
    const verifyAdmin = await prisma.user.findUnique({
      where: {
        id: 'admin-superuser-001'
      }
    });
    
    if (verifyAdmin) {
      console.log(`\nVerified admin user: ${verifyAdmin.name} (${verifyAdmin.role})`);
    }
    
  } catch (error) {
    console.error('Error fixing admin name:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixAdminName(); 