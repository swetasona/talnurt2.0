import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow this in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create admin user
    const { email = 'admin@talnurt.com', password = 'Admin@123', name = 'Admin User' } = req.body;
    
    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If user exists but is not admin, update role to admin
      if (existingUser.role !== 'admin') {
        const updatedUser = await prisma.user.update({
          where: { email },
          data: { role: 'admin' },
        });
        return res.status(200).json({
          message: 'User role updated to admin',
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
          },
        });
      }
      
      return res.status(200).json({
        message: 'Admin user already exists',
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin user
    const newUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        role: 'admin',
      },
    });

    // Return success response
    return res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return res.status(500).json({
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 