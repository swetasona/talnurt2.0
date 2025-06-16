// Script to create a test report from a manager to an employer
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestManagerToEmployerReport() {
  try {
    console.log('Creating test report from manager to employer...\n');
    
    // Find a manager first
    const manager = await prisma.user.findFirst({
      where: {
        role: 'manager',
        is_active: true,
        NOT: {
          company_id: null
        }
      },
      select: {
        id: true,
        name: true,
        company_id: true
      }
    });
    
    if (!manager) {
      console.log('No manager found. Cannot create test report.');
      return;
    }
    
    console.log(`Found manager: ${manager.name} (${manager.id})`);
    
    // Find an employer from the same company
    const employer = await prisma.user.findFirst({
      where: {
        role: 'employer',
        is_active: true,
        company_id: manager.company_id
      },
      select: {
        id: true,
        name: true,
        company_id: true
      }
    });
    
    if (!employer) {
      console.log(`No employer found in company ${manager.company_id}. Cannot create test report.`);
      return;
    }
    
    console.log(`Found employer: ${employer.name} (${employer.id}) in company ${employer.company_id}`);
    
    // Create a test report
    const report = await prisma.report.create({
      data: {
        title: 'Manager Monthly Team Report',
        content: `# Monthly Team Performance Report

## Team Overview
Our team has been making consistent progress this month. All key metrics are trending positively.

## Achievements
• Completed Project X ahead of schedule
• Reduced bug backlog by 35%
• Improved team velocity by 20%

## Challenges
• Still facing resource constraints on Project Y
• Need additional budget for training

## Team Member Highlights
• Sameer Kumar - Led the database migration project successfully
• Ravish Sheikh - Implemented new security protocols
• Revti Kumari - Optimized our CI/CD pipeline

## Next Month's Goals
• Launch new feature set
• Complete annual performance reviews
• Begin planning for Q4 initiatives

## Resource Requests
Please review our budget request for additional team training.`,
        authorId: manager.id,
        recipientId: employer.id,
        status: 'Unread'
      }
    });
    
    console.log('\nReport created successfully:');
    console.log(`- ID: ${report.id}`);
    console.log(`- Title: ${report.title}`);
    console.log(`- From: ${manager.name} (Manager)`);
    console.log(`- To: ${employer.name} (Employer)`);
    console.log(`- Status: ${report.status}`);
    
  } catch (error) {
    console.error('Error creating test report:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createTestManagerToEmployerReport(); 