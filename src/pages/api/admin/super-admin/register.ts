import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// This should be stored as an environment variable in production
const SUPER_ADMIN_REGISTRATION_KEY = process.env.SUPER_ADMIN_REGISTRATION_KEY || 'talnurt-super-admin-key-2024';
console.log("Using registration key (masked):", SUPER_ADMIN_REGISTRATION_KEY.substring(0, 5) + '...');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("API route called: /api/admin/super-admin/register with method:", req.method);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password, registrationKey } = req.body;
    console.log("Received registration request for:", email);
    
    // Validate inputs
    if (!name || !email || !password || !registrationKey) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      if (!registrationKey) missingFields.push('registrationKey');
      
      console.log("Missing required fields:", missingFields.join(', '));
      return res.status(400).json({ 
        error: 'All fields are required',
        missingFields
      });
    }
    
    // Verify the registration key
    if (registrationKey !== SUPER_ADMIN_REGISTRATION_KEY) {
      console.log("Invalid registration key provided");
      return res.status(403).json({ error: 'Invalid registration key' });
    }
    
    // Check if the email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log("Email already in use:", email);
      return res.status(400).json({ error: 'Email is already in use' });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log("Creating super admin user:", email);
    
    // Create the super admin user
    const superAdmin = await prisma.user.create({
      data: {
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        role: 'super_admin',
      },
    });
    
    console.log("Super admin user created successfully:", email);
    
    // Return success response (omitting password)
    return res.status(201).json({
      success: true,
      user: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        created_at: superAdmin.created_at,
      },
    });
  } catch (error: any) {
    console.error('Super admin registration error:', error);
    return res.status(500).json({ 
      error: 'An error occurred during registration',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
} 