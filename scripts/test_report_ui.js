// Script to test the UI rendering of team reports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReportUI() {
  try {
    console.log('Testing UI rendering of team reports...\n');
    
    // 1. Get a manager and their team members
    const manager = await prisma.user.findFirst({
      where: {
        role: 'manager',
        is_active: true
      },
      select: {
        id: true,
        name: true,
        company_id: true
      }
    });
    
    if (!manager) {
      console.log('No manager found. Cannot test report UI.');
      return;
    }
    
    console.log(`Using manager: ${manager.name} (${manager.id})`);
    
    // 2. Get the manager's team members
    const teamMembers = await prisma.user.findMany({
      where: {
        manager_id: manager.id,
        role: 'employee',
        is_active: true
      },
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`Found ${teamMembers.length} team members`);
    
    // 3. Get reports from team members to the manager
    const reports = await prisma.report.findMany({
      where: {
        recipientId: manager.id,
        authorId: {
          in: teamMembers.map(member => member.id)
        }
      },
      include: {
        author: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });
    
    console.log(`Found ${reports.length} reports from team members to manager`);
    
    // 4. Create the expected UI data structure
    const formattedReports = reports.map(report => ({
      id: report.id,
      title: report.title,
      content: report.content,
      date: new Date(report.createdAt).toISOString().split('T')[0],
      recipientId: report.recipientId,
      authorId: report.authorId,
      authorName: report.author.name,
      authorRole: report.author.role,
      status: report.status
    }));
    
    console.log('\nFormatted reports for UI:');
    if (formattedReports.length > 0) {
      formattedReports.forEach((report, index) => {
        console.log(`\nReport ${index + 1}:`);
        console.log(JSON.stringify(report, null, 2));
      });
    } else {
      console.log('No reports to display.');
    }
    
    // 5. Verify if our data structure matches what the UI expects
    console.log('\nVerifying data structure for UI:');
    
    const uiExpectedFields = ['id', 'title', 'content', 'date', 'authorName', 'authorRole', 'status'];
    
    if (formattedReports.length > 0) {
      const report = formattedReports[0];
      const missingFields = uiExpectedFields.filter(field => !report.hasOwnProperty(field));
      
      if (missingFields.length > 0) {
        console.error(`WARNING: The following fields are missing from the report data and may cause UI issues:`);
        console.error(missingFields.join(', '));
      } else {
        console.log('Data structure looks good! All expected fields are present.');
      }
    }
    
  } catch (error) {
    console.error('Error testing report UI:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
testReportUI(); 