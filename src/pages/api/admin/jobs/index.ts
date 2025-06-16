import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { canViewAllJobs } from '@/utils/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First check for admin JWT token
    const adminToken = req.cookies['admin-token'];
    let userId = '';
    let userRole = '';
    let isAuthenticated = false;
    
    if (adminToken) {
      try {
        // Verify the admin token
        const decoded = jwt.verify(adminToken, JWT_SECRET);
        if (decoded && typeof decoded === 'object') {
          isAuthenticated = true;
          userId = decoded.id;
          userRole = decoded.role;
        }
      } catch (error) {
        console.error('Invalid admin token:', error);
      }
    }
    
    // If not authenticated via JWT, check NextAuth session
    if (!isAuthenticated) {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      userId = session.user.id;
      userRole = session.user.role;
      isAuthenticated = true;
    }

    // Check if user can view all jobs or only their own
    let whereClause = {};
    
    if (canViewAllJobs(userRole)) {
      // Admin can see all jobs
      whereClause = {};
    } else {
      // Non-admin can only see their own jobs
      whereClause = { posted_by: userId };
    }

    // Fetch jobs from database
    const jobs = await prisma.job_postings.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Format jobs for frontend
    const formattedJobs = jobs.map((job: any) => {
      // Safe JSON parsing with fallback
      let requirements = [];
      let skills = [];
      
      // Parse requirements
      if (job.requirements) {
        if (typeof job.requirements === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(job.requirements);
            if (Array.isArray(parsed)) {
              requirements = parsed;
            } else {
              // If it's a parsed object but not array, convert to array
              requirements = [parsed];
            }
          } catch (error) {
            // If JSON parsing fails, treat as plain text and split
            requirements = job.requirements
              .split(/[,\n\r]+/)
              .map((req: string) => req.trim())
              .filter((req: string) => req.length > 0);
          }
        } else if (Array.isArray(job.requirements)) {
          requirements = job.requirements;
        }
      }
      
      // Parse skills
      if (job.skills) {
        if (typeof job.skills === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(job.skills);
            if (Array.isArray(parsed)) {
              skills = parsed;
            } else {
              // If it's a parsed object but not array, convert to array
              skills = [parsed];
            }
          } catch (error) {
            // If JSON parsing fails, treat as plain text and split
            skills = job.skills
              .split(/[,\n\r]+/)
              .map((skill: string) => skill.trim())
              .filter((skill: string) => skill.length > 0);
          }
        } else if (Array.isArray(job.skills)) {
          skills = job.skills;
        }
      }

      return {
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: requirements,
        location: job.location,
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
        skills: skills,
        deadline: job.deadline,
        applicationEmail: job.application_email,
        applicationUrl: job.application_url,
        contactPerson: job.contact_person,
        status: job.status || 'open',
        isInternalOnly: job.is_internal_only || false,
        isFeatured: job.is_featured || false,
        postedDate: job.posted_date,
        postedBy: job.posted_by,
        postedByRole: job.posted_by_role || 'admin',
        postedByUser: job.user,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      };
    });

    return res.status(200).json(formattedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 