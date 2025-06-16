// Script to test if report permissions are being enforced correctly
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReportRestrictions() {
  try {
    console.log('Testing report permissions...\n');
    
    // Get all reports in the system
    const allReports = await prisma.report.findMany({
      include: {
        author: {
          select: {
            name: true,
            role: true,
            manager_id: true
          }
        },
        recipient: {
          select: {
            name: true,
            role: true,
            id: true
          }
        }
      }
    });
    
    console.log(`Found ${allReports.length} total reports in the system\n`);
    
    // Group reports by recipient role
    const reportsByRecipientRole = {};
    
    allReports.forEach(report => {
      const recipientRole = report.recipient.role;
      
      if (!reportsByRecipientRole[recipientRole]) {
        reportsByRecipientRole[recipientRole] = [];
      }
      
      reportsByRecipientRole[recipientRole].push(report);
    });
    
    // Print reports grouped by recipient role
    console.log('Reports by recipient role:');
    for (const [role, reports] of Object.entries(reportsByRecipientRole)) {
      console.log(`\n${role.toUpperCase()} (${reports.length} reports):`);
      
      reports.forEach((report, index) => {
        console.log(`${index + 1}. "${report.title}" from ${report.author.name} (${report.author.role}) to ${report.recipient.name}`);
        
        // For employees sending to managers, verify if manager is their direct manager
        if (report.author.role === 'employee' && report.recipient.role === 'manager') {
          const isDirectManager = report.author.manager_id === report.recipient.id;
          console.log(`   - Direct manager check: ${isDirectManager ? 'PASSED' : 'FAILED'}`);
        }
      });
    }
    
    // Get all managers
    const managers = await prisma.user.findMany({
      where: {
        role: 'manager',
        is_active: true
      },
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`\nFound ${managers.length} managers in the system`);
    
    // For each manager, simulate the team reports API
    for (const manager of managers) {
      console.log(`\nSimulating team reports API for manager: ${manager.name} (${manager.id})`);
      
      // Get team members
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
      
      console.log(`- Has ${teamMembers.length} team members`);
      
      if (teamMembers.length === 0) {
        console.log('- No team members, should return empty array');
        continue;
      }
      
      // Find reports from team members to this manager
      const teamReports = await prisma.report.findMany({
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
      
      console.log(`- Found ${teamReports.length} team reports that should be visible`);
      
      teamReports.forEach((report, index) => {
        console.log(`  ${index + 1}. "${report.title}" from ${report.author.name}`);
      });
      
      // Create the expected UI data structure (same as in the API)
      const formattedReports = teamReports.map(report => ({
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
      
      console.log(`- This manager should see ${formattedReports.length} reports in the UI`);
    }
    
  } catch (error) {
    console.error('Error testing report restrictions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
testReportRestrictions(); 