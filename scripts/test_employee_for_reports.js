// Script to test the report recipients for a specific employee
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmployeeReportRecipients() {
  try {
    console.log('======== TESTING EMPLOYEE REPORT RECIPIENTS ========');
    
    // Find an employee with a manager for testing
    const employee = await prisma.user.findFirst({
      where: {
        role: 'employee',
        is_active: true,
        manager_id: { not: null } // Must have a manager
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
      }
    });
    
    if (!employee) {
      console.log('No employee with a manager found for testing');
      
      // Try to find any employee
      const anyEmployee = await prisma.user.findFirst({
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
          manager_id: true
        }
      });
      
      if (!anyEmployee) {
        console.log('No employees found in the system');
        return;
      }
      
      console.log('Found employee without manager:');
      console.log(anyEmployee);
      
      // Continue with this employee
      if (!anyEmployee.company_id) {
        console.log('Employee has no company, cannot test report recipients');
        return;
      }
      
      console.log('\n--------- Testing without manager ---------');
      
      // Get employers from the same company
      const employers = await prisma.user.findMany({
        where: {
          company_id: anyEmployee.company_id,
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
      
      // Get admins
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
      
      console.log('Valid report recipients (NEW implementation):');
      console.log('1. Employers from the same company:');
      if (employers.length > 0) {
        employers.forEach((employer, i) => {
          console.log(`   ${i + 1}. ${employer.name} (${employer.email})`);
        });
      } else {
        console.log('   None found');
      }
      
      console.log('2. Admin users:');
      if (admins.length > 0) {
        admins.forEach((admin, i) => {
          console.log(`   ${i + 1}. ${admin.name} (${admin.email})`);
        });
      } else {
        console.log('   None found');
      }
      
      return;
    }
    
    console.log('Found employee with manager:');
    console.log({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      company: employee.company,
      company_id: employee.company_id,
      manager: employee.manager ? {
        id: employee.manager.id,
        name: employee.manager.name,
        email: employee.manager.email,
        role: employee.manager.role
      } : null
    });
    
    // Get all managers in the company (to demonstrate the old vs new implementation)
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
    
    // Get employers from the same company
    const employers = await prisma.user.findMany({
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
    
    // Get admins
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
    
    console.log('\n--------- OLD vs NEW Implementation ---------');
    
    console.log('OLD implementation (all managers):');
    console.log('1. Managers in the company:');
    if (allManagers.length > 0) {
      allManagers.forEach((manager, i) => {
        const isDirectManager = manager.id === employee.manager_id;
        console.log(`   ${i + 1}. ${manager.name} (${manager.email})${isDirectManager ? ' ← Direct manager' : ''}`);
      });
    } else {
      console.log('   None found');
    }
    
    console.log('\nNEW implementation (only direct manager):');
    console.log('1. Direct manager:');
    if (employee.manager) {
      console.log(`   1. ${employee.manager.name} (${employee.manager.email})`);
    } else {
      console.log('   None assigned');
    }
    
    console.log('\nBoth implementations:');
    console.log('2. Employers from the same company:');
    if (employers.length > 0) {
      employers.forEach((employer, i) => {
        console.log(`   ${i + 1}. ${employer.name} (${employer.email})`);
      });
    } else {
      console.log('   None found');
    }
    
    console.log('3. Admin users:');
    if (admins.length > 0) {
      admins.forEach((admin, i) => {
        console.log(`   ${i + 1}. ${admin.name} (${admin.email})`);
      });
    } else {
      console.log('   None found');
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