// Script to update Super Administrator user role
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSuperAdministrator() {
  try {
    console.log('Starting debugging of Super Administrator issue...');
    
    // First list all users to see what we're working with
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log('All users in the system:');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Look for any user with 'superadmin' role
    const superadmins = await prisma.user.findMany({
      where: {
        role: 'superadmin'
      }
    });
    
    console.log(`\nFound ${superadmins.length} superadmin users`);
    
    // Update any users with superadmin role to admin
    if (superadmins.length > 0) {
      for (const user of superadmins) {
        console.log(`Updating ${user.name} from superadmin to admin role`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'admin' }
        });
      }
      
      console.log('Successfully updated superadmin users to admin role');
    }
    
    // Check for users named "Super Administrator"
    const superAdminUsers = await prisma.user.findMany({
      where: {
        name: {
          contains: 'Super Administrator',
          mode: 'insensitive'
        }
      }
    });
    
    console.log(`\nFound ${superAdminUsers.length} users with "Super Administrator" in their name`);
    
    if (superAdminUsers.length > 0) {
      for (const user of superAdminUsers) {
        console.log(`Updating ${user.name} (${user.id}) to role: admin and name: System Administrator`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            role: 'admin',
            name: 'System Administrator'
          }
        });
      }
      
      console.log('Successfully updated Super Administrator users');
    }
    
    console.log('\nChecking complete. Listing users after update:');
    
    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    updatedUsers.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error updating Super Administrator:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixSuperAdministrator(); 