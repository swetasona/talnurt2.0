import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

// Helper function to verify admin authentication
async function verifyAdminAuth(req: NextApiRequest): Promise<{ authenticated: false; error: string } | { authenticated: true; user: { id: string; email: string; role: string; name: string } }> {
  try {
    const token = req.cookies['admin-token'];
    
    if (!token) {
      return { authenticated: false, error: 'No token found' };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('Decoded token role:', decoded.role);
    
    if (decoded.role !== 'superadmin' && decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return { authenticated: false, error: 'Insufficient permissions' };
    }

    return { 
      authenticated: true, 
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      }
    };
  } catch (error) {
    return { authenticated: false, error: 'Invalid token' };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("API endpoint called: /api/admin/recruiters");
  
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    
    if (!authResult.authenticated) {
      console.log("Authentication failed:", authResult.error);
      return res.status(401).json({ error: authResult.error });
    }
    
    console.log(`Authenticated as ${authResult.user.role}: ${authResult.user.email}`);

    // Handle GET request - List all recruiters
    if (req.method === 'GET') {
      try {
        console.log("Fetching recruiters from database");
        const recruiters = await prisma.user.findMany({
          where: {
            role: {
              in: ['recruiter', 'unassigned', 'employee', 'manager', 'employer']
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            company: true,
            created_at: true,
            updated_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        });
        
        console.log(`Found ${recruiters.length} recruiters`);
        return res.status(200).json(recruiters);
      } catch (error) {
        console.error('Error fetching recruiters:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return res.status(500).json({ error: 'Failed to fetch recruiters', details: errorMessage });
      }
    }
    
    // Handle POST request - Create a new recruiter
    if (req.method === 'POST') {
      try {
        const { name, email, password, company } = req.body;
        console.log(`Creating recruiter: ${name}, ${email}, company: ${company}`);
        
        // Validate required fields
        if (!name || !email || !password || !company) {
          console.log("Missing required fields:", { name: !!name, email: !!email, password: !!password, company: !!company });
          return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });
        
        if (existingUser) {
          console.log(`Email ${email} already in use`);
          return res.status(400).json({ error: 'Email already in use' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create the recruiter
        const newId = uuidv4();
        console.log(`Creating recruiter with ID: ${newId}`);
        
        const recruiter = await prisma.user.create({
          data: {
            id: newId,
            name,
            email,
            password: hashedPassword,
            role: 'unassigned',
            company,
          },
        });
        
        console.log(`Recruiter created successfully: ${recruiter.id}`);
        const responseData = {
          id: recruiter.id,
          name: recruiter.name,
          email: recruiter.email,
          role: recruiter.role,
          company: recruiter.company,
          created_at: recruiter.created_at
        };
        
        return res.status(201).json(responseData);
      } catch (error) {
        console.error('Error creating recruiter:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return res.status(500).json({ error: 'Failed to create recruiter', details: errorMessage });
      }
    }
    
    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Unhandled error in recruiters API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ error: 'Internal server error', details: errorMessage });
  } finally {
    await prisma.$disconnect();
  }
} 