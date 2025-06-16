import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

// Since the new schema may not be fully available yet, we'll work with existing fields
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the session to verify the user is authenticated and has employer access
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user has employer access
    if (session.user.role !== 'employer') {
      return res.status(403).json({ error: 'Employer access required.' });
    }

    // Get employer's company - using the correct field name 'company'
    const employer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        company: true,  // Changed from company_id to company
        name: true,
        email: true 
      }
    });

    if (!employer || !employer.company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get company info - using the company string as ID
    const company = await prisma.companies.findFirst({
      where: {
        OR: [
          { id: employer.company },     // If company field stores company ID
          { name: employer.company }    // If company field stores company name
        ]
      },
      select: { 
        id: true,
        name: true
      }
    });

    // Look for approved deletion requests to identify past employees
    // These would be reports that have been marked as 'Read' (approved)
    const reports = await prisma.report.findMany({
      where: {
        authorId: session.user.id,
        title: { startsWith: 'Deletion Request for' },
        status: 'Read' // Approved requests
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Transform the reports into past employee format
    const pastEmployees = reports.map(report => {
      try {
        const content = JSON.parse(report.content);
        return {
          id: content.employee_id || report.id,
          name: content.employee_name || 'Unknown Employee',
          email: content.employee_email || 'unknown@example.com',
          role: content.employee_role || 'unknown',
          deactivated_at: report.updatedAt.toISOString(),
          team: content.team || null
        };
      } catch (e) {
        // If parsing fails, return a simplified version
        return {
          id: report.id,
          name: 'Unknown Employee',
          email: 'unknown@example.com',
          role: 'unknown',
          deactivated_at: report.updatedAt.toISOString(),
          team: null
        };
      }
    });

    return res.status(200).json({ 
      employees: pastEmployees,
      company: company || { id: employer.company, name: 'Your Company' }
    });
  } catch (error) {
    console.error('Error fetching past employees:', error);
    return res.status(500).json({ error: 'Failed to fetch past employees' });
  } finally {
    await prisma.$disconnect();
  }
} 