import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '@/lib/db';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the session to verify the user is authenticated and is a recruiter
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (session.user.role !== 'recruiter') {
      return res.status(403).json({ error: 'Not authorized. Only recruiters can access this endpoint.' });
    }

    const recruiterId = session.user.id;
    const applicantId = req.query.id as string;

    if (!applicantId) {
      return res.status(400).json({ error: 'Applicant ID is required' });
    }

    switch (req.method) {
      case 'GET':
        return getApplicant(req, res, recruiterId, applicantId);
      case 'DELETE':
        return deleteApplication(req, res, recruiterId, applicantId);
      case 'POST':
        if (req.query.action === 'save-to-talent') {
          return saveToTalentPool(req, res, recruiterId, applicantId);
        }
        return res.status(400).json({ error: 'Invalid action' });
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in applicant API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get applicant details
 */
async function getApplicant(req: NextApiRequest, res: NextApiResponse, recruiterId: string, applicantId: string) {
  try {
    // First verify this is an application for a job posted by this recruiter
    const application = await prisma.applications.findFirst({
      where: {
        user_id: applicantId,
        job_postings: {
          posted_by: recruiterId,
        },
      },
      include: {
        job_postings: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            description: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            user_profile: {
              select: {
                resume_url: true,
                phone_number: true,
                linkedin_url: true,
                github_url: true,
                city: true,
                state: true,
                country: true,
                preferred_role: true,
                preferred_location: true,
              },
            },
            user_skills: {
              select: {
                name: true,
                level: true,
              }
            },
            user_experience: {
              select: {
                id: true,
                company: true,
                title: true,
                start_date: true,
                end_date: true,
                currently_working: true,
                description: true,
              }
            },
            user_education: {
              select: {
                id: true,
                institution: true,
                degree: true,
                field: true,
                year: true,
              }
            }
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Applicant not found or not authorized' });
    }

    // Check if this applicant is already in the talent pool
    const isInTalentPool = await checkIfInTalentPool(recruiterId, applicantId);

    // Extract skills from user_skills
    const skills = application.users.user_skills.map(skill => skill.name);
    
    // Format location from profile data
    const locationParts = [];
    if (application.users.user_profile?.city) locationParts.push(application.users.user_profile.city);
    if (application.users.user_profile?.state) locationParts.push(application.users.user_profile.state);
    if (application.users.user_profile?.country) locationParts.push(application.users.user_profile.country);
    const location = locationParts.length > 0 ? locationParts.join(', ') : null;

    // Format experience data
    const experience = application.users.user_experience.map(exp => ({
      title: exp.title,
      company: exp.company,
      startDate: exp.start_date,
      endDate: exp.end_date,
      currentlyWorking: exp.currently_working,
      description: exp.description
    }));

    // Format education data
    const education = application.users.user_education.map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      year: edu.year
    }));

    // Format user data
    const applicantData = {
      id: application.users.id,
      name: application.users.name,
      email: application.users.email,
      phone: application.users.user_profile?.phone_number || null,
      skills: skills,
      resumeUrl: application.users.user_profile?.resume_url || null,
      githubUrl: application.users.user_profile?.github_url || null,
      linkedinUrl: application.users.user_profile?.linkedin_url || null,
      bio: application.users.user_profile?.preferred_role || null, // Using preferred_role as bio
      location: location,
      website: null, // Not available in schema
      experience: experience,
      education: education,
      applicationDetails: {
        applicationId: application.id,
        jobId: application.job_id,
        jobTitle: application.job_postings.title,
        jobCompany: application.job_postings.company,
        jobLocation: application.job_postings.location,
        status: application.status,
        appliedDate: application.applied_on,
      },
      isInTalentPool: isInTalentPool,
    };

    return res.status(200).json(applicantData);
  } catch (error) {
    console.error('Error fetching applicant details:', error);
    return res.status(500).json({ error: 'Failed to fetch applicant details' });
  }
}

/**
 * Delete an application
 */
async function deleteApplication(req: NextApiRequest, res: NextApiResponse, recruiterId: string, applicantId: string) {
  try {
    // Verify this is an application for a job posted by this recruiter
    const applicationId = req.query.applicationId as string;
    
    if (!applicationId) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    const application = await prisma.applications.findFirst({
      where: {
        id: applicationId,
        job_postings: {
          posted_by: recruiterId,
        },
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found or not authorized' });
    }

    // Delete the application
    await prisma.applications.delete({
      where: {
        id: applicationId,
      },
    });

    return res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return res.status(500).json({ error: 'Failed to delete application' });
  }
}

/**
 * Save applicant to talent pool
 */
async function saveToTalentPool(req: NextApiRequest, res: NextApiResponse, recruiterId: string, applicantId: string) {
  try {
    // First verify this is an application for a job posted by this recruiter
    const application = await prisma.applications.findFirst({
      where: {
        user_id: applicantId,
        job_postings: {
          posted_by: recruiterId,
        },
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            user_profile: {
              select: {
                resume_url: true,
                phone_number: true,
                linkedin_url: true,
                github_url: true,
              },
            },
            user_skills: {
              select: {
                name: true,
              }
            },
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Applicant not found or not authorized' });
    }

    // Check if the candidate is already in the talent pool
    const isInTalentPool = await checkIfInTalentPool(recruiterId, applicantId);
    
    if (isInTalentPool) {
      return res.status(200).json({ message: 'Candidate already in talent pool' });
    }

    // Extract skills from user_skills
    const skills = application.users.user_skills.map(skill => skill.name);

    // Prepare candidate data
    const skillsJson = JSON.stringify(skills);

    // Insert the candidate
    await executeQuery(`
      INSERT INTO candidates (
        id, name, email, phone, skills, resume_url, github_url, linkedin_url,
        source, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        skills = EXCLUDED.skills,
        resume_url = EXCLUDED.resume_url,
        github_url = EXCLUDED.github_url,
        linkedin_url = EXCLUDED.linkedin_url,
        updated_at = NOW()
    `, [
      applicantId,
      application.users.name,
      application.users.email,
      application.users.user_profile?.phone_number || null,
      skillsJson,
      application.users.user_profile?.resume_url || null,
      application.users.user_profile?.github_url || null,
      application.users.user_profile?.linkedin_url || null,
      'application',
    ]);

    // Associate candidate with recruiter
    const associationId = uuidv4();
    await executeQuery(`
      INSERT INTO recruiter_candidates (
        id, recruiter_id, candidate_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, NOW(), NOW()
      )
      ON CONFLICT (recruiter_id, candidate_id) DO NOTHING
    `, [
      associationId,
      recruiterId,
      applicantId,
    ]);

    return res.status(200).json({ message: 'Candidate added to talent pool successfully' });
  } catch (error) {
    console.error('Error adding candidate to talent pool:', error);
    return res.status(500).json({ error: 'Failed to add candidate to talent pool' });
  }
}

/**
 * Check if an applicant is already in the talent pool
 */
async function checkIfInTalentPool(recruiterId: string, applicantId: string): Promise<boolean> {
  try {
    const result = await executeQuery(`
      SELECT EXISTS (
        SELECT 1 FROM recruiter_candidates
        WHERE recruiter_id = $1 AND candidate_id = $2
      )
    `, [recruiterId, applicantId]);

    return result[0].exists;
  } catch (error) {
    console.error('Error checking if candidate is in talent pool:', error);
    return false;
  }
} 