// Script to check if there are employees with managers assigned and any reports from employees to managers
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkManagerReports() {
  try {
    console.log('Checking manager-employee relationships and reports...\n');
    
    // Check if the reports table exists
    let reportsTableExists = true;
    try {
      await prisma.$executeRaw`SELECT 1 FROM reports LIMIT 1`;
      console.log('Reports table exists');
    } catch (error) {
      console.error('Reports table does not exist:', error.message);
      reportsTableExists = false;
    }
    
    // 1. Find all managers
    const managers = await prisma.user.findMany({
      where: {
        role: 'manager',
        is_active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        company_id: true
      }
    });
    
    console.log(`Found ${managers.length} managers in the system`);
    
    // 2. For each manager, check if they have employees
    for (const manager of managers) {
      console.log(`\nChecking employees for manager: ${manager.name} (${manager.id})`);
      
      const employees = await prisma.user.findMany({
        where: {
          manager_id: manager.id,
          role: 'employee',
          is_active: true
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });
      
      console.log(`  Found ${employees.length} employees reporting to this manager`);
      
      if (employees.length > 0) {
        console.log('  Employees:');
        employees.forEach(emp => {
          console.log(`  - ${emp.name} (${emp.id})`);
        });
        
        // 3. Check if there are any reports from these employees to the manager
        if (reportsTableExists) {
          const employeeIds = employees.map(emp => emp.id);
          
          // Use a simpler query with Prisma's built-in methods
          const reports = await prisma.report.findMany({
            where: {
              recipientId: manager.id,
              authorId: {
                in: employeeIds
              }
            },
            include: {
              author: {
                select: {
                  name: true
                }
              }
            }
          });
          
          console.log(`  Found ${reports.length} reports from employees to this manager`);
          
          if (reports.length > 0) {
            console.log('  Reports:');
            reports.forEach(report => {
              console.log(`  - "${report.title}" from ${report.author.name} (Status: ${report.status})`);
            });
          } else {
            console.log('  No reports found - This explains the empty team reports tab');
          }
        }
      }
    }
    
    // 4. Check if there are any team reports at all
    if (reportsTableExists) {
      const allReports = await prisma.report.findMany({
        select: {
          id: true,
          title: true,
          authorId: true,
          recipientId: true,
          status: true,
          author: {
            select: {
              name: true,
              role: true
            }
          },
          recipient: {
            select: {
              name: true,
              role: true
            }
          }
        }
      });
      
      console.log(`\nTotal reports in the system: ${allReports.length}`);
      
      if (allReports.length > 0) {
        console.log('\nSample of reports:');
        allReports.slice(0, 5).forEach(report => {
          console.log(`- "${report.title}" from ${report.author.name} (${report.author.role}) to ${report.recipient.name} (${report.recipient.role})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking manager reports:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkManagerReports(); 