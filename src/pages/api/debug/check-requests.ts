import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the type for user creation requests
interface UserCreationRequest {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  company_id: string;
  requested_by: string;
  manager_id: string | null;
  metadata: string | null;
  company: {
    id: string;
    name: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  manager: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Debug API: Checking user creation requests');
    
    // Get count of user creation requests
    const count = await prisma.user_creation_requests.count();
    console.log('Total user creation requests:', count);
    
    // Get sample requests if any exist
    let requests: UserCreationRequest[] = [];
    if (count > 0) {
      requests = await prisma.user_creation_requests.findMany({
        take: 5,
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          requester: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    }
    
    // Get count of companies
    const companyCount = await prisma.companies.count();
    
    // Get count of users with employer role
    const employerCount = await prisma.user.count({
      where: {
        role: 'employer'
      }
    });
    
    return res.status(200).json({
      userCreationRequests: {
        count,
        samples: requests
      },
      companies: {
        count: companyCount
      },
      employers: {
        count: employerCount
      }
    });
  } catch (error) {
    console.error('Debug API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error });
  } finally {
    await prisma.$disconnect();
  }
} 