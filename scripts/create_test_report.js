// Script to create a test report from an employee to their manager
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestReport() {
  try {
    console.log('Creating test reports from employees to managers...\n');
    
    // First, find an employee who has a manager
    const employeeWithManager = await prisma.user.findFirst({
      where: {
        role: 'employee',
        is_active: true,
        NOT: {
          manager_id: null
        }
      },
      include: {
        manager: true
      }
    });
    
    if (!employeeWithManager) {
      console.log('No employees with managers found. Cannot create test report.');
      return;
    }
    
    console.log(`Found employee: ${employeeWithManager.name} (${employeeWithManager.id})`);
    console.log(`With manager: ${employeeWithManager.manager.name} (${employeeWithManager.manager.id})`);
    
    // Create a test report
    const report = await prisma.report.create({
      data: {
        title: 'Weekly Progress Report - Test',
        content: `# Weekly Progress Report

## Activities Completed
• Completed task 1
• Started work on project X
• Attended team meeting on Tuesday

## Challenges Faced
• Some technical issues with the database
• Waiting for response from the client

## Next Week's Plan
• Complete project X
• Start preparing for the presentation
• Schedule meeting with stakeholders

## Additional Notes
This is a test report created for debugging purposes.`,
        authorId: employeeWithManager.id,
        recipientId: employeeWithManager.manager_id,
        status: 'Unread'
      }
    });
    
    console.log('\nReport created successfully:');
    console.log(`- ID: ${report.id}`);
    console.log(`- Title: ${report.title}`);
    console.log(`- From: ${employeeWithManager.name} (${employeeWithManager.id})`);
    console.log(`- To: ${employeeWithManager.manager.name} (${employeeWithManager.manager.id})`);
    console.log(`- Status: ${report.status}`);
    
  } catch (error) {
    console.error('Error creating test report:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createTestReport(); 