import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

// Helper function to verify admin authentication
async function verifyAdminAuth(req: NextApiRequest): Promise<{ authenticated: false; error: string } | { authenticated: true; user: { id: string; email: string; role: string; name: string } }> {
  try {
    console.log('Headers received:', req.headers);
    console.log('Cookies received:', req.cookies);
    
    // Check for token in cookies first, then in Authorization header
    const token = req.cookies['admin-token'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.error('No token found in cookies or Authorization header');
      return { authenticated: false, error: 'No token found' };
    }

    console.log('Token found, verifying...');
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('Token decoded successfully:', { 
        userId: decoded.userId, 
        email: decoded.email, 
        role: decoded.role 
      });
      
      // Only allow superadmin, super_admin and admin to perform employer deletion
      if (decoded.role !== 'superadmin' && decoded.role !== 'admin' && decoded.role !== 'super_admin') {
        console.error(`User role ${decoded.role} is not authorized. Required: superadmin, super_admin or admin`);
        return { authenticated: false, error: 'Insufficient permissions' };
      }

      console.log('Authentication successful');
      return { 
        authenticated: true, 
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name || 'Admin User'
        }
      };
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return { authenticated: false, error: 'Invalid token' };
    }
  } catch (error) {
    console.error('JWT verification error:', error);
    return { authenticated: false, error: 'Invalid token' };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`API request: ${req.method} ${req.url}`);
  
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    
    if (!authResult.authenticated) {
      console.error('Authentication failed:', authResult.error);
      return res.status(401).json({ error: authResult.error });
    }

    // Only allow POST method for deletion
    if (req.method !== 'POST') {
      console.error(`Method ${req.method} not allowed`);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { employerId } = req.body;
    
    // Validate ID
    if (!employerId || typeof employerId !== 'string') {
      console.error('Invalid employer ID provided:', employerId);
      return res.status(400).json({ error: 'Invalid employer ID' });
    }

    console.log(`Processing request for employer ID: ${employerId}`);
    
    // Check if the employer exists and is actually an employer
    const employer = await prisma.user.findUnique({
      where: { 
        id: employerId,
        role: 'employer'
      },
      include: {
        companyRelation: true
      }
    });

    if (!employer) {
      console.error(`Employer with ID ${employerId} not found or not an employer`);
      return res.status(404).json({ error: 'Employer not found or not an employer' });
    }

    console.log(`Found employer: ${employer.name} (${employer.email})`);
    
    // Check if employer has a company, if not just delete the user
    if (!employer.company_id || !employer.companyRelation) {
      console.log(`Employer ${employer.name} has no associated company, deleting just the user and associated data`);
      
      // Perform the deletion in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Delete all job postings by this employer
        const deletedJobs = await tx.job_postings.deleteMany({
          where: { posted_by: employerId }
        });
        
        console.log(`Deleted ${deletedJobs.count} job postings`);
        
        // 2. Delete any employer applications for this employer
        const deletedEmployerApplications = await tx.employer_applications.deleteMany({
          where: { recruiter_id: employerId }
        });
        
        console.log(`Deleted ${deletedEmployerApplications.count} employer applications`);
        
        // 3. Delete all saved candidates by this employer
        const deletedSavedCandidates = await tx.saved_candidates.deleteMany({
          where: { recruiter_id: employerId }
        });
        
        console.log(`Deleted ${deletedSavedCandidates.count} saved candidates`);
        
        // 4. Delete all reports created by or sent to this employer
        const deletedReports = await tx.report.deleteMany({
          where: {
            OR: [
              { authorId: employerId },
              { recipientId: employerId }
            ]
          }
        });
        
        console.log(`Deleted ${deletedReports.count} reports`);
        
        // 5. Finally, delete the employer user
        await tx.user.delete({
          where: { id: employerId }
        });
        
        console.log(`Deleted employer user ${employer.name} (${employerId})`);
        
        return {
          employerId,
          employerName: employer.name,
          stats: {
            users: 1,
            jobs: deletedJobs.count,
            teams: 0,
            creationRequests: 0,
            deletionRequests: 0,
            savedCandidates: deletedSavedCandidates.count,
            reports: deletedReports.count,
            employerApplications: deletedEmployerApplications.count
          }
        };
      });
      
      console.log('Deletion completed successfully:', result);
      return res.status(200).json({ 
        success: true,
        message: 'Employer deleted successfully (no associated company)',
        data: result
      });
    }

    const companyId = employer.company_id;
    console.log(`Associated company: ${employer.companyRelation.name} (${companyId})`);

    // Perform the cascading deletion in a transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log(`Starting cascading deletion for employer ${employer.name} (${employerId}) and company ${employer.companyRelation!.name} (${companyId})`);
      
      // 1. Get all users associated with this company
      const companyUsers = await tx.user.findMany({
        where: { company_id: companyId },
        include: {
          managedTeams: true
        }
      });
      
      console.log(`Found ${companyUsers.length} users associated with the company`);

      // 2. Delete all job postings by any company user
      const userIds = companyUsers.map(user => user.id);
      const deletedJobs = await tx.job_postings.deleteMany({
        where: { posted_by: { in: userIds } }
      });
      
      console.log(`Deleted ${deletedJobs.count} job postings`);
      
      // 3. Delete all user creation requests for this company
      const deletedCreationRequests = await tx.user_creation_requests.deleteMany({
        where: { company_id: companyId }
      });
      
      console.log(`Deleted ${deletedCreationRequests.count} user creation requests`);
      
      // 4. Delete all employee deletion requests for this company
      const deletedDeletionRequests = await tx.employeeDeletionRequests.deleteMany({
        where: { company_id: companyId }
      });
      
      console.log(`Deleted ${deletedDeletionRequests.count} employee deletion requests`);
      
      // 5. Delete all teams from this company
      // First collect all team IDs
      const teamIds = companyUsers.flatMap(user => 
        user.managedTeams ? user.managedTeams.map(team => team.id) : []
      );
      
      // Delete all teams in the company
      const deletedTeams = await tx.teams.deleteMany({
        where: { company_id: companyId }
      });
      
      console.log(`Deleted ${deletedTeams.count} teams`);
      
      // 6. Delete any employer applications for this employer
      const deletedEmployerApplications = await tx.employer_applications.deleteMany({
        where: { recruiter_id: employerId }
      });
      
      console.log(`Deleted ${deletedEmployerApplications.count} employer applications`);
      
      // 7. Delete all saved candidates by company users
      const deletedSavedCandidates = await tx.saved_candidates.deleteMany({
        where: { recruiter_id: { in: userIds } }
      });
      
      console.log(`Deleted ${deletedSavedCandidates.count} saved candidates`);
      
      // 8. Delete all reports created by or sent to company users
      const deletedReports = await tx.report.deleteMany({
        where: {
          OR: [
            { authorId: { in: userIds } },
            { recipientId: { in: userIds } }
          ]
        }
      });
      
      console.log(`Deleted ${deletedReports.count} reports`);
      
      // 9. Delete all users in the company (this will cascade to user profiles, education, experience, etc.)
      // First delete all managed employees to avoid foreign key constraints
      await tx.user.updateMany({
        where: { 
          manager_id: { in: userIds },
          id: { notIn: userIds } // Don't update users we're about to delete
        },
        data: { manager_id: null }
      });
      
      // Then delete all users in the company
      const deletedUsers = await tx.user.deleteMany({
        where: { id: { in: userIds } }
      });
      
      console.log(`Deleted ${deletedUsers.count} users`);
      
      // 10. Finally, delete the company
      await tx.companies.delete({
        where: { id: companyId }
      });
      
      console.log(`Deleted company ${employer.companyRelation!.name} (${companyId})`);
      
      return {
        employerId,
        employerName: employer.name,
        companyId,
        companyName: employer.companyRelation!.name,
        stats: {
          users: deletedUsers.count,
          jobs: deletedJobs.count,
          teams: deletedTeams.count,
          creationRequests: deletedCreationRequests.count,
          deletionRequests: deletedDeletionRequests.count,
          savedCandidates: deletedSavedCandidates.count,
          reports: deletedReports.count,
          employerApplications: deletedEmployerApplications.count
        }
      };
    });

    console.log('Cascading deletion completed successfully:', result);
    return res.status(200).json({ 
      success: true,
      message: 'Employer and all associated data deleted successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error in cascading deletion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ 
      error: 'Failed to delete employer and associated data', 
      details: errorMessage 
    });
  } finally {
    await prisma.$disconnect();
  }
} 