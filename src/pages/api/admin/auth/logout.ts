// src/pages/api/admin/auth/logout.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { logger } from '../../../../utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info('Admin logout API called', { method: req.method });
  
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { method: req.method });
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    logger.info('Processing logout request');
    
    // Clear the admin token cookie
    res.setHeader('Set-Cookie', [
      serialize('adminToken', '', {
        maxAge: -1,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      })
    ]);

    logger.info('Admin logout successful');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Admin logout failed', error);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
}
