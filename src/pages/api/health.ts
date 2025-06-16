import { NextApiRequest, NextApiResponse } from 'next';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let prisma;
  let dbStatus = 'unknown';
  
  try {
    // Get a database connection
    prisma = await getConnection();
    
    // Check database connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
    
    // Release the connection
    releaseConnection();
    
    // Return health status
    return res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      error: 'Health check failed'
    });
  }
} 