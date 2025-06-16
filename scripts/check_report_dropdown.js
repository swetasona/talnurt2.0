// Script to simulate the exact query that's fetching recipients for an employee
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkReportDropdown() {
  try {
    console.log('Checking employee report dropdown recipients...\n');
    
    // Find an employee for testing
    const employee = await prisma.user.findFirst({
      where: {
        role: 'employee',
        is_active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        company_id: true,
        manager_id: true
      }
    });
    
    if (!employee) {
      console.log('No employee found for testing');
      return;
    }
    
    console.log(`Testing for employee: ${employee.name} (${employee.email})`);
    console.log(`Company ID: ${employee.company_id}`);
    console.log(`Manager ID: ${employee.manager_id}`);
    
    // Simulate the exact query that's run in the API
    let employeeRecipients = [];
    
    // Get direct manager if exists
    if (employee.manager_id) {
      const manager = await prisma.user.findUnique({
        where: { 
          id: employee.manager_id
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      
      if (manager) {
        console.log(`\nDirect manager: ${manager.name} (${manager.role})`);
        employeeRecipients.push(manager);
      }
    }
    
    // Get employers from same company
    if (employee.company_id) {
      const employers = await prisma.user.findMany({
        where: {
          role: 'employer',
          company_id: employee.company_id,
          id: {
            not: employee.id
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      
      console.log(`\nEmployers from same company (${employers.length}):`);
      employers.forEach(employer => {
        console.log(`- ${employer.name} (${employer.role})`);
      });
      
      employeeRecipients = [...employeeRecipients, ...employers];
    }
    
    // Add admin users (not superadmin)
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
    
    console.log(`\nAdmins (${admins.length}):`);
    admins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.role}) [ID: ${admin.id}]`);
    });
    
    employeeRecipients = [...employeeRecipients, ...admins];
    
    // Sort by name
    employeeRecipients.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('\nFinal dropdown options:');
    employeeRecipients.forEach(recipient => {
      console.log(`- ${recipient.name} (${recipient.role}) [ID: ${recipient.id}]`);
    });
    
    // Check if there's a "Super Administrator" in the list
    const superAdmin = employeeRecipients.find(r => r.name.includes('Super Administrator'));
    if (superAdmin) {
      console.log('\n⚠️ Found "Super Administrator" in the recipients list:');
      console.log(`ID: ${superAdmin.id}, Name: ${superAdmin.name}, Role: ${superAdmin.role}`);
    } else {
      console.log('\n✅ No "Super Administrator" found in the recipients list.');
    }
    
  } catch (error) {
    console.error('Error checking report dropdown:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
checkReportDropdown(); 