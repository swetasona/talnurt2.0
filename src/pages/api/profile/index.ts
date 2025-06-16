import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// Define interfaces for type safety
interface EducationData {
  institution: string;
  degree: string;
  year?: string;
}

interface ExperienceData {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  currentlyWorking?: boolean;
}

interface SkillData {
  name: string;
  level?: string;
}

interface ContactInfoData {
  phoneNumber?: string;
  // Remove fields that don't exist in the schema
  city?: string;
  state?: string;
  country?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

interface PreferencesData {
  // Remove fields that don't exist in the schema
  preferredLocation?: string;
  preferredRole?: string;
  preferredType?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the session to verify authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const userId = session.user.id;

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getProfile(req, res, userId);
    case 'POST':
      return saveProfile(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get user profile data
async function getProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Fetch user data with all related information
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_profile: true,
        user_education: true,
        user_experience: true,
        user_skills: true
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format the data to match the UI expectations
    const formattedData = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.user_profile?.phone_number || null,
      location: userData.user_profile?.location || null,
      headline: userData.user_profile?.headline || null,
      summary: userData.user_profile?.summary || null,
      availability: userData.user_profile?.availability || null,
      jobTypePreference: userData.user_profile?.job_type_preference || null,
      salaryExpectation: userData.user_profile?.salary_expectation || null,
      willingToRelocate: userData.user_profile?.willing_to_relocate || false,
      yearsOfExperience: userData.user_profile?.years_of_experience || null,
      avatarUrl: userData.user_profile?.avatar_url || null,
      resumeUrl: userData.user_profile?.resume_url || null,
      linkedin: userData.user_profile?.linkedin || null,
      github: userData.user_profile?.github || null,
      twitter: userData.user_profile?.twitter || null,
      website: userData.user_profile?.website || null,
      portfolio: userData.user_profile?.portfolio || null,
    };

    // Format the data to match the UI expectations
    const responseData = {
      education: userData.user_education.map(edu => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        year: edu.year
      })),
      experience: userData.user_experience.map(exp => ({
        id: exp.id,
        title: exp.title,
        company: exp.company,
        startDate: exp.start_date,
        endDate: exp.end_date,
        currentlyWorking: exp.currently_working
      })),
      skills: userData.user_skills.map(skill => ({
        id: skill.id,
        name: skill.name,
        level: skill.level
      })),
      contactInfo: userData.user_profile ? {
        phoneNumber: userData.user_profile.phone_number,
        // Map existing fields from the schema
        location: userData.user_profile.location,
        github: userData.user_profile.github,
        linkedin: userData.user_profile.linkedin
      } : {},
      preferences: userData.user_profile ? {
        // Map to existing fields or use empty strings
        jobTypePreference: userData.user_profile.job_type_preference,
        location: userData.user_profile.location,
        willingToRelocate: userData.user_profile.willing_to_relocate
      } : {},
      resume: userData.user_profile?.resume_url || null
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile data' });
  }
}

// Save user profile data
async function saveProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { 
      education, 
      experience, 
      skills, 
      preferences, 
      contactInfo, 
      resumeUrl 
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Use a transaction to ensure all data is saved consistently
    await prisma.$transaction(async (tx) => {
      // Update or create profile
      await tx.user_profiles.upsert({
        where: { user_id: userId },
        update: {
          phone_number: contactInfo?.phoneNumber,
          // Use existing fields in the schema
          location: contactInfo?.city ? 
            `${contactInfo.city}${contactInfo.state ? ', ' + contactInfo.state : ''}${contactInfo.country ? ', ' + contactInfo.country : ''}` : 
            undefined,
          github: contactInfo?.githubUrl,
          linkedin: contactInfo?.linkedinUrl,
          job_type_preference: preferences?.preferredType,
          willing_to_relocate: preferences?.preferredLocation ? false : true,
          resume_url: resumeUrl || undefined,
          updated_at: new Date()
        },
        create: {
          user_id: userId,
          phone_number: contactInfo?.phoneNumber,
          // Use existing fields in the schema
          location: contactInfo?.city ? 
            `${contactInfo.city}${contactInfo.state ? ', ' + contactInfo.state : ''}${contactInfo.country ? ', ' + contactInfo.country : ''}` : 
            undefined,
          github: contactInfo?.githubUrl,
          linkedin: contactInfo?.linkedinUrl,
          job_type_preference: preferences?.preferredType,
          willing_to_relocate: preferences?.preferredLocation ? false : true,
          resume_url: resumeUrl
        }
      });

      // Delete existing education records and create new ones
      if (education && education.length > 0) {
        await tx.user_education.deleteMany({
          where: { user_id: userId }
        });

        await tx.user_education.createMany({
          data: education.map((edu: EducationData) => ({
            user_id: userId,
            institution: edu.institution,
            degree: edu.degree,
            year: edu.year
          }))
        });
      }

      // Delete existing experience records and create new ones
      if (experience && experience.length > 0) {
        await tx.user_experience.deleteMany({
          where: { user_id: userId }
        });

        await tx.user_experience.createMany({
          data: experience.map((exp: ExperienceData) => ({
            user_id: userId,
            title: exp.title,
            company: exp.company,
            start_date: exp.startDate,
            end_date: exp.endDate,
            currently_working: exp.currentlyWorking || false
          }))
        });
      }

      // Delete existing skills and create new ones
      if (skills && skills.length > 0) {
        await tx.user_skills.deleteMany({
          where: { user_id: userId }
        });

        await tx.user_skills.createMany({
          data: skills.map((skill: SkillData) => ({
            user_id: userId,
            name: skill.name,
            level: skill.level
          }))
        });
      }
    });

    return res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({ error: 'Failed to save profile data' });
  }
} 