// Script to diagnose why recipients aren't showing up for Huma Ahmad
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseReportRecipients() {
  try {
    console.log('---------- REPORT RECIPIENTS DIAGNOSTICS ----------');
    
    // 1. Find Huma Ahmad in the database
    const huma = await prisma.user.findFirst({
      where: {
        name: {
          contains: 'Huma Ahmad'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company_id: true,
        manager_id: true,
        team_id: true
      }
    });
    
    if (!huma) {
      console.log('User "Huma Ahmad" not found in database');
      return;
    }
    
    console.log('Huma Ahmad found:');
    console.log(huma);
    
    // 2. Check if Huma has a company_id
    if (!huma.company_id) {
      console.log('ISSUE: Huma Ahmad does not have a company_id assigned');
    } else {
      // 3. Get info about Huma's company
      const company = await prisma.companies.findUnique({
        where: { id: huma.company_id },
        select: {
          id: true,
          name: true
        }
      });
      
      console.log(`Huma's company: ${company?.name || 'Unknown'} (${huma.company_id})`);
      
      // 4. Check if there are any managers in Huma's company
      const managers = await prisma.user.findMany({
        where: {
          company_id: huma.company_id,
          role: 'manager'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      
      console.log(`Found ${managers.length} managers in the same company:`);
      console.log(managers);
      
      // 5. Check if there are any employers in Huma's company
      const employers = await prisma.user.findMany({
        where: {
          company_id: huma.company_id,
          role: 'employer'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      
      console.log(`Found ${employers.length} employers in the same company:`);
      console.log(employers);
    }
    
    // 6. Check if there are any admins in the system
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['admin', 'superadmin']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log(`Found ${admins.length} admins/superadmins in the system:`);
    console.log(admins);
    
    // 7. Simulate the actual query that should be used to get recipients
    if (huma.company_id) {
      const validRecipientRoles = ['manager', 'admin', 'superadmin'];
      
      const simulatedRecipients = await prisma.user.findMany({
        where: {
          role: {
            in: validRecipientRoles
          },
          id: {
            not: huma.id // Exclude current user
          },
          company_id: huma.company_id // Only from same company
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          company_id: true
        }
      });
      
      console.log(`Simulated query found ${simulatedRecipients.length} recipients:`);
      console.log(simulatedRecipients);
    }
    
    console.log('---------- END DIAGNOSTICS ----------');
  } catch (error) {
    console.error('Error in diagnosis script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnosis
diagnoseReportRecipients(); 