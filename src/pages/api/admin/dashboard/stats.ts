import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin token
    const decoded = verifyAdminToken(req);
    if (!decoded) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        totalRecruiters: 0,
        totalJobs: 0,
        totalApplications: 0,
        totalCompanies: 0
      });
    }

    // Fetch all statistics in parallel for better performance
    const [
      totalRecruiters,
      activeJobs,
      totalApplications,
      totalJobApplications,
      totalCompanies
    ] = await Promise.all([
      // Count users with recruiter, admin, or superadmin roles
      prisma.user.count({
        where: {
          role: {
            in: ['recruiter', 'admin', 'superadmin']
          }
        }
      }),
      
      // Count active job postings
      prisma.job_postings.count({
        where: {
          status: 'open'
        }
      }),
      
      // Count applications from applications table
      prisma.applications.count(),
      
      // Count applications from job_applications table
      prisma.job_applications.count(),
      
      // Count total companies
      prisma.companies.count(),

      // User role counts
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true,
        },
        where: {
          role: {
            in: ['recruiter', 'admin', 'employee', 'employer', 'applicant', 'unassigned']
          }
        }
      })
    ]);

    // Calculate total applications (combining both tables)
    const totalApplicationsCount = totalApplications + totalJobApplications;

    const stats = {
      totalRecruiters,
      totalJobs: activeJobs,
      totalApplications: totalApplicationsCount,
      totalCompanies,
      roleCounts: totalRecruiters
    };

    console.log('Dashboard stats fetched:', stats);
    res.status(200).json(stats);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      totalRecruiters: 0,
      totalJobs: 0,
      totalApplications: 0,
      totalCompanies: 0
    });
  }
} 