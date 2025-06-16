import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password, role, company } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Validate role if provided
    const validRoles = ['applicant', 'recruiter'];
    const userRole = role && validRoles.includes(role) ? role : 'applicant';
    
    // Don't allow direct admin registration for security
    if (role === 'admin') {
      return res.status(403).json({ error: 'Unauthorized role assignment' });
    }

    // If recruiter role, require company name
    if (userRole === 'recruiter' && !company) {
      return res.status(400).json({ error: 'Company name is required for recruiter accounts' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with company data if applicable
    const userData: any = {
      id: uuidv4(), // Add this if you're using uuid
      name,
      email,
      password: hashedPassword,
      role: userRole,
    };

    // Add company field for recruiters
    if (userRole === 'recruiter' && company) {
      userData.company = company;
    }

    // Create the user
    const user = await prisma.user.create({
      data: userData
    });

    // Return success without revealing sensitive data
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'An error occurred during registration' });
  }
} 