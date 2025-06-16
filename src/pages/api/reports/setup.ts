import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const session = await getServerSession(req, res, authOptions);

  // Check authentication but allow any authenticated user
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Create reports table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" VARCHAR(36) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'Unread',
        "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "authorId" VARCHAR(36) NOT NULL,
        "recipientId" VARCHAR(36) NOT NULL,
        
        CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
      );
    `;

    // Add foreign keys (if the table was just created)
    try {
      await prisma.$executeRaw`
        ALTER TABLE "reports" 
        ADD CONSTRAINT "reports_author_fkey" 
        FOREIGN KEY ("authorId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      console.log("Foreign key author_fkey may already exist");
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "reports" 
        ADD CONSTRAINT "reports_recipient_fkey" 
        FOREIGN KEY ("recipientId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      console.log("Foreign key recipient_fkey may already exist");
    }

    // Create indexes
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "reports_authorId_idx" ON "reports"("authorId");
      `;
    } catch (e) {
      console.log("Index authorId_idx may already exist");
    }

    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "reports_recipientId_idx" ON "reports"("recipientId");
      `;
    } catch (e) {
      console.log("Index recipientId_idx may already exist");
    }

    return res.status(200).json({ success: true, message: 'Reports table set up successfully' });
  } catch (error) {
    console.error('Error setting up reports table:', error);
    return res.status(500).json({ error: 'Failed to set up reports table' });
  }
} 