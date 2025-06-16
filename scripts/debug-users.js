// Quick script to debug what users exist in the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUsers() {
  try {
    console.log('=== DEBUGGING USERS ===');
    
    // Get all users and their roles
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        company_id: true,
        company: true
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log(`Total users in database: ${allUsers.length}`);
    
    if (allUsers.length === 0) {
      console.log('NO USERS FOUND IN DATABASE!');
      return;
    }
    
    // Group by role
    const roleGroups = {};
    allUsers.forEach(user => {
      if (!roleGroups[user.role]) {
        roleGroups[user.role] = [];
      }
      roleGroups[user.role].push(user);
    });
    
    console.log('\nUsers by role:');
    Object.keys(roleGroups).forEach(role => {
      console.log(`\n${role.toUpperCase()} (${roleGroups[role].length}):`);
      roleGroups[role].forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Active: ${user.is_active} - Company: ${user.company_id || user.company || 'None'}`);
      });
    });
    
    // Check specifically for the roles the employees API looks for
    const targetRoles = ['manager', 'employee', 'recruiter', 'unassigned'];
    const targetUsers = allUsers.filter(user => 
      targetRoles.includes(user.role) && user.is_active
    );
    
    console.log(`\nUsers with target roles (${targetRoles.join(', ')}): ${targetUsers.length}`);
    if (targetUsers.length === 0) {
      console.log('NO USERS WITH TARGET ROLES FOUND - This explains why the dropdown is empty!');
    }
    
    // If no target users exist, create some test users
    if (targetUsers.length === 0) {
      console.log('\n=== CREATING TEST USERS ===');
      
      const testUsers = [
        {
          name: 'John Manager',
          email: 'john.manager@example.com',
          role: 'manager'
        },
        {
          name: 'Jane Employee',
          email: 'jane.employee@example.com',
          role: 'employee'
        },
        {
          name: 'Bob Recruiter',
          email: 'bob.recruiter@example.com',
          role: 'recruiter'
        },
        {
          name: 'Alice Unassigned',
          email: 'alice.unassigned@example.com',
          role: 'unassigned'
        }
      ];
      
      for (const userData of testUsers) {
        try {
          const user = await prisma.user.create({
            data: {
              name: userData.name,
              email: userData.email,
              role: userData.role,
              is_active: true
            }
          });
          console.log(`✓ Created ${userData.role}: ${userData.name}`);
        } catch (error) {
          console.log(`✗ Failed to create ${userData.name}: ${error.message}`);
        }
      }
      
      console.log('\nTest users created! Refresh the profile allocation page to see them.');
    }
    
  } catch (error) {
    console.error('Error debugging users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUsers(); 