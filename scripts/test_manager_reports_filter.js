// Script to test if managers can only see reports they've sent to employers or received from their team members
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testManagerReportsFilter() {
  try {
    console.log('Testing manager reports filtering...\n');
    
    // Get all managers
    const managers = await prisma.user.findMany({
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
    
    console.log(`Found ${managers.length} managers in the system`);
    
    for (const manager of managers) {
      console.log(`\nAnalyzing reports for manager: ${manager.name} (${manager.id})`);
      
      // 1. Get reports authored by this manager
      const authoredReports = await prisma.report.findMany({
        where: {
          authorId: manager.id
        },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });
      
      console.log(`Manager has authored ${authoredReports.length} reports total`);
      
      // 2. Filter to only those sent to employers
      const reportsToEmployers = authoredReports.filter(report => 
        report.recipient.role === 'employer' || report.recipient.role === 'admin'
      );
      
      console.log(`Of those, ${reportsToEmployers.length} were sent to employers or admins (should be visible):`);
      reportsToEmployers.forEach(report => {
        console.log(`- "${report.title}" to ${report.recipient.name} (${report.recipient.role})`);
      });
      
      const otherAuthoredReports = authoredReports.filter(report => 
        report.recipient.role !== 'employer' && report.recipient.role !== 'admin'
      );
      
      if (otherAuthoredReports.length > 0) {
        console.log(`${otherAuthoredReports.length} reports were sent to non-employers (should NOT be visible):`);
        otherAuthoredReports.forEach(report => {
          console.log(`- "${report.title}" to ${report.recipient.name} (${report.recipient.role})`);
        });
      }
      
      // 3. Get reports received by this manager
      const receivedReports = await prisma.report.findMany({
        where: {
          recipientId: manager.id
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              manager_id: true
            }
          }
        }
      });
      
      console.log(`\nManager has received ${receivedReports.length} reports total (all should be visible):`);
      
      // Check which reports are from team members
      const reportsFromTeamMembers = receivedReports.filter(report => 
        report.author.manager_id === manager.id
      );
      
      console.log(`Of those, ${reportsFromTeamMembers.length} are from team members:`);
      reportsFromTeamMembers.forEach(report => {
        console.log(`- "${report.title}" from ${report.author.name} (${report.author.role})`);
      });
      
      // 4. Simulate the SQL query used in the API
      try {
        const query = `
          SELECT 
            r.*, 
            a.name as author_name, 
            a.role as author_role,
            rc.name as recipient_name,
            rc.role as recipient_role
          FROM reports r
          JOIN users a ON r."authorId" = a.id
          JOIN users rc ON r."recipientId" = rc.id
          WHERE 
            (r."authorId" = '${manager.id}' AND (rc.role = 'employer' OR rc.role = 'admin')) 
            OR 
            (r."recipientId" = '${manager.id}')
          ORDER BY r."createdAt" DESC
        `;
        
        console.log('\nExecuting the exact SQL query used in the API:');
        
        const filteredReports = await prisma.$queryRawUnsafe(query);
        
        console.log(`SQL query returned ${filteredReports.length} reports`);
        
        // This should match the sum of reportsToEmployers.length + receivedReports.length
        const expectedCount = reportsToEmployers.length + receivedReports.length;
        console.log(`Expected count: ${expectedCount}`);
        
        if (filteredReports.length === expectedCount) {
          console.log('✅ SQL query is working correctly!');
        } else {
          console.log('❌ SQL query result does not match expected count');
        }
        
        // Log the reports returned by the SQL query
        console.log('\nReports returned by the SQL query:');
        filteredReports.forEach((report, index) => {
          console.log(`${index + 1}. "${report.title}" - From: ${report.author_name} (${report.author_role}) to ${report.recipient_name} (${report.recipient_role})`);
        });
      } catch (error) {
        console.error('Error executing SQL query:', error);
      }
    }
    
  } catch (error) {
    console.error('Error testing manager reports filter:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
testManagerReportsFilter(); 