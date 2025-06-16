// Script to check and fix company_id issues
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function fixCompanyIds() {
  try {
    console.log('=== COMPANY ID FIX SCRIPT ===');
    
    // 1. Check if any companies exist
    const existingCompanies = await prisma.companies.findMany({
      take: 5
    });
    
    console.log(`Found ${existingCompanies.length} companies`);
    
    // Create a company if none exists
    let company;
    if (existingCompanies.length === 0) {
      console.log('No companies found. Creating a default company...');
      company = await prisma.companies.create({
        data: {
          name: 'Talnurt Inc.',
          location: 'San Francisco, CA',
          description: 'Default company for the recruitment portal',
          logo_url: null,
          website: 'https://talnurt.com'
        }
      });
      console.log('Created default company:', company.name, company.id);
    } else {
      company = existingCompanies[0];
      console.log('Using existing company:', company.name, company.id);
    }
    
    // 2. Find all employer users
    const employers = await prisma.user.findMany({
      where: {
        role: 'employer'
      }
    });
    
    console.log(`Found ${employers.length} employer users`);
    
    // 3. Update employers to have the company_id
    for (const employer of employers) {
      if (!employer.company_id) {
        console.log(`Employer ${employer.name} (${employer.email}) has no company_id. Updating...`);
        await prisma.user.update({
          where: { id: employer.id },
          data: { company_id: company.id }
        });
        console.log(`Updated employer ${employer.name} with company_id: ${company.id}`);
      } else {
        console.log(`Employer ${employer.name} already has company_id: ${employer.company_id}`);
      }
    }
    
    // 4. Find all employee/manager users
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ['manager', 'employee', 'recruiter', 'unassigned']
        }
      }
    });
    
    console.log(`Found ${employees.length} employee/manager/recruiter/unassigned users`);
    
    // 5. Update employees to have the same company_id
    for (const employee of employees) {
      if (!employee.company_id) {
        console.log(`User ${employee.name} (${employee.email}, ${employee.role}) has no company_id. Updating...`);
        await prisma.user.update({
          where: { id: employee.id },
          data: { 
            company_id: company.id,
            is_active: true
          }
        });
        console.log(`Updated user ${employee.name} with company_id: ${company.id}`);
      } else {
        console.log(`User ${employee.name} already has company_id: ${employee.company_id}`);
      }
    }
    
    // 6. Check if we need to create test employees
    if (employees.length === 0) {
      console.log('No employees found. Creating test employees...');
      
      const roles = ['manager', 'employee', 'recruiter', 'unassigned'];
      
      for (const role of roles) {
        const user = await prisma.user.create({
          data: {
            name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            email: `test.${role}@talnurt.com`,
            role: role,
            company_id: company.id,
            is_active: true
          }
        });
        console.log(`Created test ${role}: ${user.name} (${user.email})`);
      }
    }
    
    console.log('=== COMPANY ID FIX COMPLETE ===');
    console.log('Please refresh the profile allocation page to see if employees are now visible.');
    
  } catch (error) {
    console.error('Error fixing company IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompanyIds(); 