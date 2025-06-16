// Script to simulate fetching team reports from the client-side
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const prisma = new PrismaClient();

// Helper function to create a JWT token for a user
async function createAuthToken(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }
  
  // Create a JWT token similar to NextAuth
  const token = jwt.sign(
    {
      name: user.name,
      email: user.email,
      sub: user.id,
      role: user.role
    },
    process.env.NEXTAUTH_SECRET || 'your-fallback-secret-key',
    { expiresIn: '1h' }
  );
  
  return { token, user };
}

async function fetchTeamReportsForManager() {
  try {
    console.log('Simulating team reports fetch from the frontend...\n');
    
    // Get a manager from the database
    const manager = await prisma.user.findFirst({
      where: {
        role: 'manager',
        is_active: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    if (!manager) {
      console.log('No manager found in the database');
      return;
    }
    
    console.log(`Using manager: ${manager.name} (${manager.id})`);
    
    // Create an auth token for the manager
    const { token, user } = await createAuthToken(manager.id);
    
    // Create cookie string similar to what the browser would send
    const cookieStr = cookie.serialize('next-auth.session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    console.log(`Created auth token for manager`);
    
    // Make the API request with the auth cookie
    try {
      console.log('Making API request to /api/reports/team...');
      
      const response = await axios.get('http://localhost:3000/api/reports/team', {
        headers: {
          Cookie: cookieStr
        },
        withCredentials: true
      });
      
      console.log('API Response status:', response.status);
      console.log(`Received ${response.data.length} team reports:`);
      
      if (response.data.length > 0) {
        response.data.forEach((report, index) => {
          console.log(`${index + 1}. "${report.title}" from ${report.authorName} (${report.authorRole}) - Status: ${report.status}`);
        });
      } else {
        console.log('No team reports found');
      }
    } catch (error) {
      console.error('Error making API request:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fetchTeamReportsForManager(); 