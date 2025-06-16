const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function fixUserCompany() {
  try {
    console.log('Fixing user company association...');
    
    // First, check the current user's data
    const user = await prisma.user.findUnique({
      where: { email: 'swetasona2610@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company_id: true,
        company: true
      }
    });
    
    console.log('Current user data:', user);
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    // If user already has a company_id, we're good
    if (user.company_id) {
      console.log('User already has company_id:', user.company_id);
      return;
    }
    
    // Check if there are any existing companies
    let company = await prisma.companies.findFirst();
    
    if (!company) {
      // Create a default company if none exists
      console.log('No companies found, creating a default company...');
      company = await prisma.companies.create({
        data: {
          id: uuidv4(),
          name: 'Talnurt Solutions',
          industry: 'Technology',
          location: 'Global',
          description: 'A leading recruitment solutions company',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('Created company:', company);
    } else {
      console.log('Using existing company:', company);
    }
    
    // Update the user with the company_id
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        company_id: company.id,
        company: company.name // Also set the string field for consistency
      }
    });
    
    console.log('Updated user with company association:', {
      userId: updatedUser.id,
      companyId: company.id,
      companyName: company.name
    });
    
    console.log('✅ User company association fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing user company association:', error);
  }
}

fixUserCompany(); 