const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['recruiter', 'unassigned', 'employee', 'employer', 'manager']
        }
      }
    });
    
    console.log(JSON.stringify(users, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 