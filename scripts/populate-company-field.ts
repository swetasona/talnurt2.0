import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateCompanyField() {
  try {
    console.log('Populating company field for existing users...');
    
    // Get all users with company_id but without company name
    const usersWithCompanyId = await prisma.user.findMany({
      where: {
        company_id: {
          not: null
        },
        company: null
      },
      include: {
        companyRelation: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${usersWithCompanyId.length} users to update`);
    
    // Update each user with the company name
    for (const user of usersWithCompanyId) {
      if (user.companyRelation?.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            company: user.companyRelation.name
          }
        });
        console.log(`Updated user ${user.name} with company: ${user.companyRelation.name}`);
      }
    }
    
    console.log('Company field population completed!');
    
  } catch (error) {
    console.error('Error populating company field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateCompanyField(); 