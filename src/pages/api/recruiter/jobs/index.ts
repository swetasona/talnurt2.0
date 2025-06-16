import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const companyId = session.user.company || null; // Use company from session

    // Check if the user has permission to access jobs
    const allowedRoles = ['admin', 'superadmin', 'super_admin', 'recruiter', 'employer', 'manager', 'employee'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Not authorized to access jobs.' });
    }

    let jobs;

    // Different queries based on user role
    if (isAdmin(userRole)) {
      // Admins can see all jobs
      jobs = await prisma.job_postings.findMany({
        include: {
          applications: {
            select: {
              id: true,
              user_id: true,
              status: true,
            },
          },
          user: {
            select: {
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } else if (userRole === 'employer') {
      // Employers can see jobs from all users in their company
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID not found for employer user' });
      }
      
      jobs = await prisma.job_postings.findMany({
        where: {
          company: companyId, // Use 'company' instead of 'company_id'
        },
        include: {
          applications: {
            select: {
              id: true,
              user_id: true,
              status: true,
            },
          },
          user: {
            select: {
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } else if (userRole === 'manager') {
      // Managers can see their own jobs and jobs posted by their team members
      // This is a simplified version - in a real app, you'd query the teams table 
      // For this example, we'll assume direct queries aren't available
      
      // Simplified approach - in a real implementation, you would use proper team queries
      // For now, we'll just retrieve jobs by the manager
      jobs = await prisma.job_postings.findMany({
        where: {
          posted_by: userId,
          // In a real app, you would add team member IDs here
        },
        include: {
          applications: {
            select: {
              id: true,
              user_id: true,
              status: true,
            },
          },
          user: {
            select: {
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });
      
      // Note: In a production app, you would implement team-based queries
      // This would require proper database schema with teams and team_members tables
    } else {
      // Employees and recruiters can only see their own jobs
      jobs = await prisma.job_postings.findMany({
        where: {
          posted_by: userId,
        },
        include: {
          applications: {
            select: {
              id: true,
              user_id: true,
              status: true,
            },
          },
          user: {
            select: {
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    }

    // Format jobs for frontend
    const formattedJobs = jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      description: job.description || '',
      requirements: job.requirements ? JSON.parse(job.requirements) : [],
      location: job.location || '',
      salary: job.salary,
      company: job.company,
      department: job.department,
      jobType: job.job_type || 'full-time',
      workMode: job.work_mode || 'on-site',
      experience: job.experience,
      industry: job.industry,
      currency: job.currency || 'USD',
      benefits: job.benefits,
      summary: job.summary,
      responsibilities: job.responsibilities,
      skills: job.skills ? JSON.parse(job.skills) : [],
      deadline: job.deadline,
      applicationEmail: job.application_email,
      applicationUrl: job.application_url,
      contactPerson: job.contact_person,
      status: job.status || 'open',
      isInternalOnly: job.is_internal_only || false,
      isFeatured: job.is_featured || false,
      postedDate: job.posted_date,
      postedBy: job.posted_by,
      postedByRole: job.user?.role || job.posted_by_role || 'unknown',
      postedByName: job.user?.name || 'Unknown',
      companyId: job.company, // Use company instead of company_id
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      applications: job.applications || [],
      applicationsCount: job.applications ? job.applications.length : 0,
    }));

    return res.status(200).json(formattedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
} 