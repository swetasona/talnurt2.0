// Script to create another test report from a different employee to their manager
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAnotherTestReport() {
  try {
    console.log('Creating another test report from employee to manager...\n');
    
    // Find employees with managers but exclude the one we already used
    const employeeWithManager = await prisma.user.findFirst({
      where: {
        role: 'employee',
        is_active: true,
        NOT: {
          manager_id: null
        },
        name: {
          not: 'Sameer Kumar' // Exclude the employee we already used
        }
      },
      include: {
        manager: true
      }
    });
    
    if (!employeeWithManager) {
      console.log('No other employees with managers found. Cannot create test report.');
      return;
    }
    
    console.log(`Found employee: ${employeeWithManager.name} (${employeeWithManager.id})`);
    console.log(`With manager: ${employeeWithManager.manager.name} (${employeeWithManager.manager.id})`);
    
    // Create a test report
    const report = await prisma.report.create({
      data: {
        title: 'Monthly Project Update',
        content: `# Monthly Project Update

## Project Status
- Project is currently on track
- All milestones have been met
- Client feedback has been positive

## Key Achievements
• Completed the database migration
• Launched the new user interface
• Fixed 15 critical bugs

## Upcoming Challenges
• Integration with third-party API
• Performance optimization for mobile devices

## Resource Needs
• Need additional QA resources
• Request for server upgrades

## Questions/Concerns
Please let me know if there are any changes to the project timeline.`,
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
createAnotherTestReport(); 