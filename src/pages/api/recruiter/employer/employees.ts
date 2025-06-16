import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has employer access
    if (session.user.role !== 'employer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('=== EMPLOYEES API DEBUG ===');
    console.log('Session user:', { id: session.user.id, role: session.user.role });

    // Get the current user's company information
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        company_id: true,
        company: true 
      }
    });

    console.log('Current user data:', currentUser);

    // Count total users with employee/manager roles to see if any exist
    const totalPotentialEmployees = await prisma.user.count({
      where: {
        role: {
          in: ['manager', 'employee', 'recruiter', 'unassigned']
        },
        is_active: true
      }
    });
    
    console.log('Total potential employees in database:', totalPotentialEmployees);

    // Build the where clause for employee filtering
    let employeeWhereClause: any = {
      role: {
        in: ['manager', 'employee', 'recruiter', 'unassigned']
      },
      // Exclude the current user
      NOT: {
        id: session.user.id
      },
      is_active: true  // Only show active employees
    };

    // Add company_id filtering
    if (currentUser?.company_id) {
      employeeWhereClause.company_id = currentUser.company_id;
      console.log('Filtering employees by company_id:', currentUser.company_id);
    } else {
      console.log('No company_id found, returning all active employees');
    }

    console.log('Employee where clause:', JSON.stringify(employeeWhereClause, null, 2));

    // Get employees and managers that can be allocated profiles
    const employees = await prisma.user.findMany({
      where: employeeWhereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
        created_at: true,
        company_id: true,
        is_active: true,
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log('Raw employees from database:', employees.length);
    if (employees.length > 0) {
      console.log('First few employees:', employees.slice(0, 3).map(e => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        is_active: e.is_active,
        company_id: e.company_id
      })));
    } else {
      console.log('NO EMPLOYEES FOUND WITH THE CURRENT FILTERS');
      
      // Debug query to find all users with these roles
      const allUsers = await prisma.user.findMany({
        where: {
          role: {
            in: ['manager', 'employee', 'recruiter', 'unassigned']
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_active: true,
          company_id: true
        }
      });
      
      console.log('All potential users (ignoring filters):', allUsers.length);
      console.log('Sample users:', allUsers.slice(0, 5));
    }

    // Format employee data
    const formattedEmployees = employees.map((employee: any) => ({
      id: employee.id,
      name: employee.name || employee.email?.split('@')[0] || 'Unknown',
      email: employee.email,
      role: employee.role,
      department: employee.department || 'No Department',
      avatar: employee.avatar,
      team: employee.team,
      company_id: employee.company_id,
      is_active: employee.is_active
    }));

    console.log('Formatted employees:', formattedEmployees.length);
    console.log('=== END EMPLOYEES API DEBUG ===');

    res.status(200).json({
      employees: formattedEmployees,
      total: formattedEmployees.length
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 