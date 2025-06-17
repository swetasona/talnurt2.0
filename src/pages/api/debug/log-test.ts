// src/pages/api/debug/log-test.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info('Debug log test API called');
  
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    logger.info('Database connection successful', result);
    
    // Log environment variables (excluding sensitive ones)
    logger.info('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      HOSTNAME: process.env.HOSTNAME,
      PORT: process.env.PORT,
      BASE_URL: process.env.BASE_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL
    });
    
    // Return success
    res.status(200).json({ 
      success: true, 
      message: 'Log test successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    logger.error('Error in debug log test', error);
    res.status(500).json({ 
      success: false, 
      message: 'Log test failed',
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
