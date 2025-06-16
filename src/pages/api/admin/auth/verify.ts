import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies['admin-token'];

    if (!token) {
      return res.status(401).json({ authenticated: false, error: 'No token found' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return res.status(200).json({
      authenticated: true,
      user: {
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ authenticated: false, error: 'Invalid token' });
  }
} 