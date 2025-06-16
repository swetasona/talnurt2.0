import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { executeQuery } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication using server-side session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the user ID (either from the query or from the session)
    const userId = req.query.userId as string || session.user.id;

    // Make sure user requesting is either checking themselves or is an admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if the user has completed their profile
    // A complete profile requires at least:
    // 1. One education entry
    // 2. One experience entry OR skill
    // 3. A resume

    // Check education
    const educations = await executeQuery(
      'SELECT COUNT(*) as count FROM user_education WHERE user_id = $1',
      [userId]
    );
    const hasEducation = parseInt(educations[0].count, 10) > 0;

    // Check experience
    const experiences = await executeQuery(
      'SELECT COUNT(*) as count FROM user_experience WHERE user_id = $1',
      [userId]
    );
    const hasExperience = parseInt(experiences[0].count, 10) > 0;

    // Check skills
    const skills = await executeQuery(
      'SELECT COUNT(*) as count FROM user_skills WHERE user_id = $1',
      [userId]
    );
    const hasSkills = parseInt(skills[0].count, 10) > 0;

    // Check resume - FIX: Improved resume check query to properly detect resumes
    const resumeCheck = await executeQuery(
      'SELECT resume_url FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    
    // Check if we have a valid resume URL - first check if we have results, then check if the URL is valid
    const hasResume = resumeCheck.length > 0 && 
                     resumeCheck[0].resume_url !== null && 
                     resumeCheck[0].resume_url !== undefined &&
                     resumeCheck[0].resume_url.trim() !== '';

    console.log('Resume check for user', userId, ':', resumeCheck, 'hasResume:', hasResume);

    // A profile is complete if it has education and resume, and either experience or skills
    const isComplete = hasEducation && hasResume && (hasExperience || hasSkills);

    return res.status(200).json({
      isComplete,
      details: {
        hasEducation,
        hasExperience,
        hasSkills,
        hasResume,
      },
    });
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 