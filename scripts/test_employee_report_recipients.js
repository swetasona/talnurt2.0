// Script to test the employee report recipients functionality
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmployeeReportRecipients() {
  try {
    console.log('======== TESTING EMPLOYEE REPORT RECIPIENTS ========');
    
    // 1. Find employees in the system
    const employees = await prisma.user.findMany({
      where: {
        role: 'employee',
        is_active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        company_id: true,
        company: true,
        manager_id: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      take: 5 // Limit to 5 employees for testing
    });
    
    console.log(`Found ${employees.length} employees for testing`);
    
    // 2. For each employee, check who they can send reports to
    for (const employee of employees) {
      console.log('\n-------------------------------------------');
      console.log(`Testing employee: ${employee.name} (${employee.email})`);
      console.log(`Company: ${employee.company || 'Not set'} (ID: ${employee.company_id || 'Not set'})`);
      console.log(`Manager: ${employee.manager ? employee.manager.name : 'Not set'} (ID: ${employee.manager_id || 'Not set'})`);
      
      // 3. Get company employers (if company is set)
      let employers = [];
      if (employee.company_id) {
        employers = await prisma.user.findMany({
          where: {
            company_id: employee.company_id,
            role: 'employer',
            is_active: true
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });
        
        console.log(`Employers in company: ${employers.length}`);
        employers.forEach(employer => {
          console.log(` - ${employer.name} (${employer.email})`);
        });
      } else {
        console.log('No company set, no employers to find');
      }
      
      // 4. Get all managers in the company (to show the difference between old and new implementation)
      if (employee.company_id) {
        const allManagers = await prisma.user.findMany({
          where: {
            company_id: employee.company_id,
            role: 'manager',
            is_active: true
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });
        
        console.log(`All managers in company: ${allManagers.length}`);
        allManagers.forEach(manager => {
          const isEmployeeManager = manager.id === employee.manager_id;
          console.log(` - ${manager.name} (${manager.email})${isEmployeeManager ? ' ← Employee\'s direct manager' : ''}`);
        });
      } else {
        console.log('No company set, no managers to find');
      }
      
      // 5. Simulate the API call to get valid recipients for this employee
      console.log('\nSimulated API call to get recipients:');
      
      let validRecipients = [];
      
      // Add the direct manager if exists
      if (employee.manager_id && employee.manager) {
        validRecipients.push(employee.manager);
        console.log(` + Added direct manager: ${employee.manager.name}`);
      } else {
        console.log(' - No direct manager to add');
      }
      
      // Add employers from the same company
      if (employers.length > 0) {
        console.log(` + Added ${employers.length} employers from the same company`);
        validRecipients = [...validRecipients, ...employers];
      } else {
        console.log(' - No employers from the same company to add');
      }
      
      // Add admin/superadmin users
      const admins = await prisma.user.findMany({
        where: {
          role: {
            in: ['admin', 'superadmin']
          },
          is_active: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      
      if (admins.length > 0) {
        console.log(` + Added ${admins.length} admin/superadmin users`);
        validRecipients = [...validRecipients, ...admins];
      } else {
        console.log(' - No admin users to add');
      }
      
      console.log(`\nTotal valid recipients: ${validRecipients.length}`);
      
      // 6. Output detailed information about each valid recipient
      if (validRecipients.length > 0) {
        console.log('\nValid recipients:');
        validRecipients.forEach((recipient, index) => {
          console.log(`${index + 1}. ${recipient.name} (${recipient.email}) - ${recipient.role.charAt(0).toUpperCase() + recipient.role.slice(1)}`);
        });
      } else {
        console.log('No valid recipients found for this employee.');
      }
    }
    
    console.log('\n======== TEST COMPLETED ========');
  } catch (error) {
    console.error('Error in test script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEmployeeReportRecipients(); 