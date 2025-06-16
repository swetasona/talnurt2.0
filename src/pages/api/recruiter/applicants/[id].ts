import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// Check if an applicant is already in the talent pool
async function checkIfInTalentPool(recruiterId: string, applicantId: string): Promise<boolean> {
  const savedCandidate = await prisma.saved_candidates.findFirst({
    where: {
      recruiter_id: recruiterId,
      user_id: applicantId
    }
  });
  
  return !!savedCandidate;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the session to verify the user is authenticated
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  // Check if user is a recruiter
  if (session.user.role !== 'recruiter' && session.user.role !== 'employer') {
    return res.status(403).json({ error: 'Access denied. Only recruiters can access this resource.' });
  }

  const recruiterId = session.user.id;
  const applicantId = req.query.id as string;

  if (!applicantId) {
    return res.status(400).json({ error: 'Applicant ID is required' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getApplicant(req, res, recruiterId, applicantId);
    case 'DELETE':
      return deleteApplication(req, res, recruiterId, applicantId);
    case 'POST':
      return saveToTalentPool(req, res, recruiterId, applicantId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Get applicant details
 */
async function getApplicant(req: NextApiRequest, res: NextApiResponse, recruiterId: string, applicantId: string) {
  try {
    // Verify this is an application for a job posted by this recruiter
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
                linkedin: true, // Updated field name
                github: true,   // Updated field name
                location: true, // Use location field instead of city/state/country
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
        job_postings: true, // Include job posting details
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Applicant not found or not authorized' });
    }

    // Check if this applicant is already in the talent pool
    const isInTalentPool = await checkIfInTalentPool(recruiterId, applicantId);

    // Extract skills from user_skills
    const skills = application.users.user_skills.map(skill => skill.name);
    
    // Use location directly from the profile
    const location = application.users.user_profile?.location || null;

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
      githubUrl: application.users.user_profile?.github || null, // Updated field name
      linkedinUrl: application.users.user_profile?.linkedin || null, // Updated field name
      bio: null, // No direct equivalent in schema
      location: location,
      website: application.users.user_profile?.website || null, // Use website field
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
                linkedin: true, // Updated field name
                github: true,   // Updated field name
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

    // Check if already saved
    const existingSave = await prisma.saved_candidates.findFirst({
      where: {
        recruiter_id: recruiterId,
        user_id: applicantId,
      },
    });

    if (existingSave) {
      return res.status(409).json({ error: 'Applicant already saved to talent pool' });
    }

    // Save to talent pool
    await prisma.saved_candidates.create({
      data: {
        id: applicantId,
        recruiter_id: recruiterId,
        user_id: applicantId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return res.status(200).json({ message: 'Applicant saved to talent pool' });
  } catch (error) {
    console.error('Error saving to talent pool:', error);
    return res.status(500).json({ error: 'Failed to save applicant to talent pool' });
  }
} 