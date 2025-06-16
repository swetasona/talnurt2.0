import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runSqlUpdate() {
  try {
    console.log('Running SQL update to populate company field...');
    
    // Update users with company names from the companies table
    const result = await prisma.$executeRaw`
      UPDATE users 
      SET company = companies.name
      FROM companies
      WHERE users.company_id = companies.id
      AND users.company IS NULL
    `;
    
    console.log(`Updated ${result} users with company names`);
    
    // Verify the update
    const updatedUsers = await prisma.user.findMany({
      where: {
        NOT: {
          company: null
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        company_id: true
      },
      take: 5
    });
    
    console.log('Sample updated users:');
    console.log(updatedUsers);
    
  } catch (error) {
    console.error('Error running SQL update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runSqlUpdate(); 