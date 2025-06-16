import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET || 'my-super-secure-nextauth-secret-123!@#';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Custom signout API called');
  
  if (req.method !== 'POST') {
    console.log('Invalid method for signout:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify the user is authenticated
    const token = await getToken({ req, secret });
    
    if (token) {
      console.log('User found, clearing session for:', token.email);
    } else {
      console.log('No user token found, user already logged out');
      // User is already logged out
      return res.status(200).json({ success: true, message: 'Already logged out' });
    }

    // Clear all auth cookies using Set-Cookie headers
    const cookies = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.csrf-token',
    ];

    // Set each cookie to expire using Set-Cookie headers
    const cookieHeaders = cookies.map(cookieName => {
      const isSecure = process.env.NODE_ENV === 'production';
      return `${cookieName}=; Max-Age=0; Path=/; HttpOnly${isSecure ? '; Secure' : ''}; SameSite=Lax`;
    });

    res.setHeader('Set-Cookie', cookieHeaders);

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during custom sign out:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 