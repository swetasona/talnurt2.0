import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  console.log('Admin login attempt for email:', email);

  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find the admin user in database
    console.log('Looking for user with email:', email.toLowerCase());
    const adminUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true
      }
    });

    console.log('User found:', adminUser ? `${adminUser.email} with role ${adminUser.role}` : 'No user found');

    if (!adminUser) {
      console.log('User not found in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify if user is an admin or super_admin
    if (adminUser.role !== 'admin' && adminUser.role !== 'super_admin') {
      console.log('User is not an admin or super_admin, role is:', adminUser.role);
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    // Verify password
    if (!adminUser.password) {
      console.log('User has no password set');
      return res.status(401).json({ error: 'Account not properly configured. Contact administrator.' });
    }

    console.log('Comparing password...');
    const validPassword = await bcrypt.compare(password, adminUser.password);
    console.log('Password valid:', validPassword);
    
    if (!validPassword) {
      console.log('Invalid password for user:', adminUser.email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        userId: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role, // Use actual role from database
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', [
      `admin-token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    ]);

    console.log('Admin login successful for:', adminUser.email);
    return res.status(200).json({
      success: true,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role // Return actual role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 