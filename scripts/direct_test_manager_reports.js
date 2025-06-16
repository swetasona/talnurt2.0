// Script to directly test the SQL query used for manager team reports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testManagerReports() {
  try {
    console.log('Testing manager team reports SQL query directly...\n');
    
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
    
    console.log(`Found ${managers.length} managers to test`);
    
    // Test each manager's team reports
    for (const manager of managers) {
      console.log(`\nTesting reports for manager: ${manager.name} (${manager.id})`);
      
      // Get the manager's team members
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
      
      console.log(`  Found ${teamMembers.length} team members`);
      
      if (teamMembers.length === 0) {
        console.log('  No team members, skipping...');
        continue;
      }
      
      // Extract team member IDs
      const teamMemberIds = teamMembers.map(member => member.id);
      
      // Execute the exact same query used in the API
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
          WHERE r."recipientId" = '${manager.id}' 
          AND r."authorId" IN (${teamMemberIds.map(id => `'${id}'`).join(',')})
          ORDER BY r."createdAt" DESC
        `;
        
        console.log('  Executing SQL query:');
        console.log(query);
        
        const reports = await prisma.$queryRawUnsafe(query);
        
        console.log(`  Found ${reports.length} reports`);
        
        if (reports.length > 0) {
          console.log('  Reports:');
          reports.forEach((report, index) => {
            console.log(`  ${index + 1}. "${report.title}" from ${report.author_name} (Status: ${report.status})`);
          });
        } else {
          console.log('  No reports found - This explains the empty team reports tab');
        }
      } catch (error) {
        console.error(`  Error executing query for manager ${manager.name}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error testing manager reports:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
testManagerReports(); 