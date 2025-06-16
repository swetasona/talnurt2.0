// Script to debug what's being shown in the dropdown
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDropdown() {
  try {
    console.log('Debugging dropdown display issues...\n');
    
    // Check all admin users in the system
    const admins = await prisma.user.findMany({
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
    
    console.log(`Found ${admins.length} admin users:`);
    admins.forEach(admin => {
      console.log(`ID: ${admin.id}, Name: "${admin.name}", Email: ${admin.email}, Role: ${admin.role}`);
    });
    
    // Check all users with "Administrator" in their name
    const adminNameUsers = await prisma.user.findMany({
      where: {
        name: {
          contains: 'Administrator',
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
    
    console.log(`\nFound ${adminNameUsers.length} users with "Administrator" in their name:`);
    adminNameUsers.forEach(user => {
      console.log(`ID: ${user.id}, Name: "${user.name}", Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Check if there are any users with parentheses in their name
    const parenthesesUsers = await prisma.user.findMany({
      where: {
        name: {
          contains: '(',
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
    
    console.log(`\nFound ${parenthesesUsers.length} users with parentheses in their name:`);
    parenthesesUsers.forEach(user => {
      console.log(`ID: ${user.id}, Name: "${user.name}", Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Simulate what would be displayed in the dropdown
    console.log('\nSimulating dropdown display:');
    
    // Get the admin and remove any parentheses
    const adminForDropdown = admins[0];
    if (adminForDropdown) {
      const displayName = adminForDropdown.name.replace(/\s*\([^)]*\)/g, '');
      const roleDisplay = adminForDropdown.role.charAt(0).toUpperCase() + adminForDropdown.role.slice(1);
      
      console.log(`Option text: "${displayName} (${roleDisplay})"`);
    }
    
    // Direct database update to fix any issues
    if (admins.length > 0) {
      const admin = admins[0];
      
      if (admin.name.includes('(') || admin.name.includes(')')) {
        console.log(`\nFixing admin name: "${admin.name}"`);
        
        const newName = 'Administrator';
        await prisma.user.update({
          where: { id: admin.id },
          data: { name: newName }
        });
        
        console.log(`Updated admin name to "${newName}"`);
      }
    }
    
  } catch (error) {
    console.error('Error debugging dropdown:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
debugDropdown(); 