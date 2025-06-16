import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { executeQuery } from '@/lib/db';
import { JWT } from 'next-auth/jwt';
import prisma from '@/lib/db-connection-manager'; // Use the singleton Prisma client

// Fix for SSL errors in development environment
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Define extended types for token and session
interface ExtendedJWT extends JWT {
  id?: string;
  role?: string;
  company?: string;
}

// Ensure users table exists
const ensureUserTablesExist = async () => {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'applicant',
        company VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    return true;
  } catch (error) {
    console.error('Error ensuring user tables exist:', error);
    return false;
  }
};

// Check if the user's role has changed since last login - with improved error handling
const checkForRoleChanges = async (userId: string, currentRole: string): Promise<boolean> => {
  try {
    // Create role_changes table if it doesn't exist
    try {
      const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'role_changes'
        );
      `;
      
      if (!tableExists[0].exists) {
        return false; // No table, so no role changes to check
      }
    } catch (error) {
      console.error('Error checking if role_changes table exists:', error);
      return false;
    }
    
    // Check for role changes after the last login
    const roleChanges = await prisma.$queryRaw<Array<{ new_role: string }>>`
      SELECT new_role FROM role_changes 
      WHERE user_id = ${userId}
      ORDER BY changed_at DESC
      LIMIT 1;
    `;
    
    if (roleChanges.length === 0) {
      return false;
    }
    
    // If latest role change doesn't match current token role, session should be invalidated
    return roleChanges[0].new_role !== currentRole;
  } catch (error) {
    console.error('Error checking for role changes:', error);
    return false;
  }
};

const SECRET = process.env.NEXTAUTH_SECRET || 'my-super-secure-nextauth-secret-123!@#';
console.log('Using NextAuth secret (masked):', SECRET.substring(0, 3) + '...');

// Cache for user data to reduce database queries
const userCache = new Map<string, any>();
const CACHE_TTL = 60 * 1000; // 60 seconds

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== 'production',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }, // Optional role hint for specific logins
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        console.log('Trying to authenticate user:', credentials.email);
        const requestedRole = credentials.role || null;
        
        if (requestedRole) {
          console.log('Role requested:', requestedRole);
        }

        try {
          // Try to use Prisma client first
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user) {
            console.log('User not found via Prisma:', credentials.email);
            
            // Fall back to direct SQL if needed
            await ensureUserTablesExist();
            const users = await executeQuery(
              'SELECT * FROM users WHERE email = $1',
              [credentials.email]
            );
            
            if (users.length === 0) {
              console.log('User also not found via SQL:', credentials.email);
              return null;
            }
            
            const sqlUser = users[0];
            console.log('User found via SQL:', sqlUser.email, 'Role:', sqlUser.role);
            
            // If a specific role was requested, verify the user has this role
            if (requestedRole && sqlUser.role !== requestedRole) {
              console.log(`User ${sqlUser.email} does not have required role: ${requestedRole}`);
              return null;
            }

            // Check password
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              sqlUser.password
            );

            if (!isPasswordValid) {
              console.log('Invalid password for user:', credentials.email);
              return null;
            }

            console.log('Successfully authenticated user via SQL:', credentials.email);
            
            // Return user object
            return {
              id: sqlUser.id,
              name: sqlUser.name,
              email: sqlUser.email,
              role: sqlUser.role,
              company: sqlUser.company,
            };
          }
          
          console.log('User found via Prisma:', user.email, 'Role:', user.role);
          
          // If a specific role was requested, verify the user has this role
          if (requestedRole && user.role !== requestedRole) {
            console.log(`User ${user.email} does not have required role: ${requestedRole}`);
            return null;
          }

          // Check password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password || ''
          );

          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email);
            return null;
          }

          console.log('Successfully authenticated user via Prisma:', credentials.email);
          
          // Return user object
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            // company field might not exist in the user type from Prisma
            ...(user.company !== undefined && { company: user.company as string })
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    signOut: async ({ token }) => {
      console.log('NextAuth signOut event triggered');
      // Clear user from cache on signout
      if (token?.id) {
        userCache.delete(token.id as string);
      }
    },
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        console.log('JWT callback - Adding user data to token:', user.email);
        token.id = user.id;
        token.role = user.role;
        
        // If user has company property, use it
        if (user.company) {
          token.company = user.company;
        } 
        // If user doesn't have company property but is an employer, fetch it from the database
        else if (user.role === 'employer') {
          try {
            // Check cache first
            const cacheKey = `company_${user.id}`;
            if (userCache.has(cacheKey)) {
              const cachedData = userCache.get(cacheKey);
              if (cachedData && cachedData.company_id) {
                token.company = cachedData.company_id;
                console.log(`Using cached company_id for user ${user.email}: ${cachedData.company_id}`);
              }
            } else {
              const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { company_id: true }
              });
              
              if (dbUser?.company_id) {
                console.log(`Setting company_id for user ${user.email}: ${dbUser.company_id}`);
                token.company = dbUser.company_id;
                
                // Cache the result
                userCache.set(cacheKey, dbUser);
                setTimeout(() => userCache.delete(cacheKey), CACHE_TTL);
              }
            }
          } catch (error) {
            console.error('Error fetching company_id:', error);
          }
        }
      } else if (token.id && token.role) {
        // Only check for role changes occasionally to reduce database load
        const shouldCheckRole = Math.random() < 0.2; // 20% chance to check
        
        if (shouldCheckRole) {
          const hasRoleChanged = await checkForRoleChanges(token.id as string, token.role as string);
          
          if (hasRoleChanged) {
            console.log(`Role change detected for user ${token.email}, invalidating token`);
            // Force token to expire by setting expiry to past date
            token.exp = 0;
            // Clear token data to ensure logout
            delete token.id;
            delete token.role;
            delete token.company;
          }
        }
        
        // If the user is an employer and doesn't have a company in the token, fetch it
        if (token.role === 'employer' && !token.company) {
          try {
            // Check cache first
            const cacheKey = `company_${token.id}`;
            if (userCache.has(cacheKey)) {
              const cachedData = userCache.get(cacheKey);
              if (cachedData && cachedData.company_id) {
                token.company = cachedData.company_id;
                console.log(`Using cached company_id for user ${token.email}: ${cachedData.company_id}`);
              }
            } else {
              const dbUser = await prisma.user.findUnique({
                where: { id: token.id as string },
                select: { company_id: true }
              });
              
              if (dbUser?.company_id) {
                console.log(`Setting company_id for user ${token.email}: ${dbUser.company_id}`);
                token.company = dbUser.company_id;
                
                // Cache the result
                userCache.set(cacheKey, dbUser);
                setTimeout(() => userCache.delete(cacheKey), CACHE_TTL);
              }
            }
          } catch (error) {
            console.error('Error fetching company_id:', error);
          }
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        console.log('Session callback - Adding token data to session for user:', token.email);
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        if (token.company) {
          session.user.company = token.company as string;
        }
      }
      return session;
    },
    redirect: ({ url, baseUrl }) => {
      console.log('Redirect callback - URL:', url, 'Base URL:', baseUrl);
      
      // Special handling for super admin registration endpoint
      if (url.includes('/api/admin/super-admin/register') || url.includes('/api/debug')) {
        console.log('API endpoint detected, not redirecting');
        return url;
      }
      
      // Handle API routes specially - redirect to home and avoid processing them
      if (url.includes('/api/')) {
        console.log('API URL detected, redirecting to base URL');
        return baseUrl;
      }
      
      // Prevent redirect loops - if we're already at the signin page and being redirected to it again
      if (url.includes('/auth/signin') || url.includes('/auth/recruiter/signin')) {
        console.log('Preventing redirect loop to signin page');
        return baseUrl;
      }
      
      // If the URL is already a complete URL (contains http/https), use it directly
      if (url.startsWith('http')) {
        return url;
      }
      
      // If role is specified in the URL, use it to determine redirect
      try {
        // First check if there's a ?role parameter in the URL
        const urlObj = new URL(url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
        const role = urlObj.searchParams.get('role');
        
        if (role) {
          switch (role) {
            case 'super_admin':
              console.log('Redirecting to super admin dashboard');
              return `${baseUrl}/admin/super-dashboard`;
            case 'admin':
              return `${baseUrl}/admin/dashboard`;
            case 'recruiter':
              return `${baseUrl}/recruiter/dashboard`;
            case 'employee':
              return `${baseUrl}/recruiter/dashboard`;
            case 'manager':
              return `${baseUrl}/recruiter/dashboard`;
            case 'employer':
              return `${baseUrl}/recruiter/dashboard`;
            case 'applicant':
              return `${baseUrl}/dashboard`;
            default:
              return baseUrl;
          }
        }
      } catch (error) {
        console.error('Error parsing URL:', error);
      }
      
      // Default to a role-detection page that will handle proper routing
      // This will be handled by our new role detection component
      return `${baseUrl}/auth/redirect-handler`;
    }
  },
  // Add default error page
  pages: {
    error: '/auth/error',
    signOut: '/auth/signout',
  },
  secret: SECRET,
};

export default NextAuth(authOptions); 