// Script to diagnose report recipients for Huma Ahmad with the new implementation
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseHumaReportRecipients() {
  try {
    console.log('======== HUMA AHMAD REPORT RECIPIENTS DIAGNOSTICS ========');
    
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
        company: true,
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
          role: 'manager',
          id: { not: huma.id } // Exclude Huma herself
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      
      console.log(`Found ${managers.length} other managers in the same company:`);
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
      
      // 6. Check if Huma has a direct manager
      if (huma.manager_id) {
        const manager = await prisma.user.findUnique({
          where: { id: huma.manager_id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });
        
        console.log('Huma\'s direct manager:');
        console.log(manager);
      } else {
        console.log('Huma does not have a direct manager assigned');
      }
      
      // 7. Check if Huma is an employee or manager
      if (huma.role === 'employee') {
        console.log('Huma is an employee. Simulating the NEW implementation:');
        console.log('With the new implementation, Huma should only be able to send reports to:');
        console.log('1. Her direct manager (if assigned)');
        console.log('2. Employers in her company');
        console.log('3. Admin users');
        
        let validRecipients = [];
        
        // Add direct manager if exists
        if (huma.manager_id) {
          const manager = await prisma.user.findUnique({
            where: { id: huma.manager_id },
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          });
          
          if (manager) {
            validRecipients.push(manager);
            console.log('✓ Added Huma\'s direct manager');
          }
        } else {
          console.log('✗ No direct manager to add');
        }
        
        // Add employers from same company
        if (employers.length > 0) {
          validRecipients = [...validRecipients, ...employers];
          console.log(`✓ Added ${employers.length} employers from the same company`);
        } else {
          console.log('✗ No employers in the same company to add');
        }
        
        // Add admins
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
        
        if (admins.length > 0) {
          validRecipients = [...validRecipients, ...admins];
          console.log(`✓ Added ${admins.length} admin users`);
        } else {
          console.log('✗ No admin users to add');
        }
        
        console.log(`\nTotal valid recipients: ${validRecipients.length}`);
        console.log(validRecipients);
      } else if (huma.role === 'manager') {
        console.log('Huma is a manager, not an employee. The new implementation affects employees only.');
        console.log('As a manager, Huma should be able to send reports to:');
        console.log('1. Employers in her company');
        console.log('2. Admin users');
        
        let validRecipients = [];
        
        // Add employers from same company
        if (employers.length > 0) {
          validRecipients = [...validRecipients, ...employers];
          console.log(`✓ Added ${employers.length} employers from the same company`);
        } else {
          console.log('✗ No employers in the same company to add');
        }
        
        // Add admins
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
        
        if (admins.length > 0) {
          validRecipients = [...validRecipients, ...admins];
          console.log(`✓ Added ${admins.length} admin users`);
        } else {
          console.log('✗ No admin users to add');
        }
        
        console.log(`\nTotal valid recipients: ${validRecipients.length}`);
        console.log(validRecipients);
      }
    }
    
    console.log('\n======== DIAGNOSTICS COMPLETED ========');
  } catch (error) {
    console.error('Error in diagnosis script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnosis
diagnoseHumaReportRecipients(); 