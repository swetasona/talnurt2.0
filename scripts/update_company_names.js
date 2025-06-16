// Script to update the company name field for all users based on their company_id
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCompanyNames() {
  try {
    console.log('Updating company names for users...');
    
    // Get all users with company_id but no company name
    const usersToUpdate = await prisma.user.findMany({
      where: {
        company_id: { not: null },
        company: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        company_id: true
      }
    });
    
    console.log(`Found ${usersToUpdate.length} users to update`);
    
    // Get all companies
    const companies = await prisma.companies.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    const companyMap = new Map();
    companies.forEach(company => {
      companyMap.set(company.id, company.name);
    });
    
    console.log('Companies found:', companyMap.size);
    
    // Update users with the correct company name
    let updatedCount = 0;
    for (const user of usersToUpdate) {
      const companyName = companyMap.get(user.company_id);
      
      if (companyName) {
        console.log(`Updating ${user.name} (${user.email}) with company name: ${companyName}`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { company: companyName }
        });
        
        updatedCount++;
      } else {
        console.log(`Could not find company name for user ${user.name} with company_id ${user.company_id}`);
      }
    }
    
    console.log(`Updated company names for ${updatedCount} users`);
  } catch (error) {
    console.error('Error updating company names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateCompanyNames(); 