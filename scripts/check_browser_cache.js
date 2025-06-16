// Script to verify if there's any Super Administrator users
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBrowserCache() {
  try {
    console.log('Checking all users with "admin" role...');
    
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'admin'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Check if there's any user containing "Super Administrator" in the name
    console.log('\nChecking for any users with "Super Administrator" in the name...');
    const superAdminUsers = await prisma.user.findMany({
      where: {
        name: {
          contains: 'Super',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    if (superAdminUsers.length === 0) {
      console.log('✅ No users found with "Super" in the name.');
    } else {
      console.log(`⚠️ Found ${superAdminUsers.length} users with "Super" in the name:`);
      superAdminUsers.forEach(user => {
        console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
      });
      
      // Fix if there is still a Super Administrator
      for (const user of superAdminUsers) {
        if (user.name.includes('Super Administrator')) {
          console.log(`Updating ${user.name} to "System Administrator"...`);
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              name: 'System Administrator'
            }
          });
          console.log('Update complete.');
        }
      }
    }
    
    // Check for users with (Admin) suffix in the name
    console.log('\nChecking for any users with "(Admin)" in the name...');
    const adminSuffixUsers = await prisma.user.findMany({
      where: {
        name: {
          contains: '(Admin)',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    if (adminSuffixUsers.length === 0) {
      console.log('✅ No users found with "(Admin)" in the name.');
    } else {
      console.log(`⚠️ Found ${adminSuffixUsers.length} users with "(Admin)" in the name:`);
      adminSuffixUsers.forEach(user => {
        console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
      });
      
      // Fix if there are users with (Admin) in name
      for (const user of adminSuffixUsers) {
        console.log(`Removing "(Admin)" from ${user.name}...`);
        const newName = user.name.replace(/\s*\(Admin\)/, '');
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            name: newName
          }
        });
        console.log(`Updated to: ${newName}`);
      }
    }
    
    console.log('\nRefreshing checks...');
    
    // Final check
    const finalAdminUsers = await prisma.user.findMany({
      where: {
        role: 'admin'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log(`\nFinal admin users (${finalAdminUsers.length}):`);
    finalAdminUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkBrowserCache(); 