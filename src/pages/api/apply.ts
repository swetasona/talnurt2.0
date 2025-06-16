import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '@/lib/db';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication using server-side session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the user is allowed to apply (not a recruiter or admin)
    if (session.user.role === 'recruiter' || session.user.role === 'admin' || session.user.role === 'employer') {
      return res.status(403).json({ error: 'Recruiters, employers, and admins cannot apply for jobs' });
    }

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Check if the job exists and retrieve its status
    const jobs = await executeQuery(
      'SELECT * FROM job_postings WHERE id = $1',
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if the job is closed or in draft status
    const job = jobs[0];
    const jobStatus = job.status?.toLowerCase();
    
    if (jobStatus === 'closed' || jobStatus === 'draft') {
      return res.status(403).json({ 
        error: 'Job not available',
        message: 'This position is no longer accepting applications' 
      });
    }

    // Check if the user has already applied to this job
    const existingApplications = await executeQuery(
      'SELECT * FROM applications WHERE user_id = $1 AND job_id = $2',
      [session.user.id, jobId]
    );

    if (existingApplications.length > 0) {
      return res.status(409).json({ error: 'You have already applied to this job' });
    }

    // Check if the user has completed their profile
    // First, ensure profile tables exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        job_id VARCHAR(36) NOT NULL REFERENCES job_postings(id),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        applied_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Profile check logic similar to is-complete endpoint
    // Check education - use the correct table name user_education
    const educations = await executeQuery(
      'SELECT COUNT(*) as count FROM user_education WHERE user_id = $1',
      [session.user.id]
    );
    const hasEducation = parseInt(educations[0].count, 10) > 0;

    // Check experience - use the correct table name user_experience
    const experiences = await executeQuery(
      'SELECT COUNT(*) as count FROM user_experience WHERE user_id = $1',
      [session.user.id]
    );
    const hasExperience = parseInt(experiences[0].count, 10) > 0;

    // Check skills - use the correct table name user_skills
    const skills = await executeQuery(
      'SELECT COUNT(*) as count FROM user_skills WHERE user_id = $1',
      [session.user.id]
    );
    const hasSkills = parseInt(skills[0].count, 10) > 0;

    // Check resume - get resume from user_profiles
    const resumes = await executeQuery(
      'SELECT resume_url FROM user_profiles WHERE user_id = $1',
      [session.user.id]
    );
    const hasResume = resumes.length > 0 && resumes[0].resume_url !== null;

    // A profile is complete if it has education and resume, and either experience or skills
    const isComplete = hasEducation && hasResume && (hasExperience || hasSkills);

    if (!isComplete) {
      const missing = [];
      if (!hasEducation) missing.push('education details');
      if (!hasResume) missing.push('resume');
      if (!hasExperience && !hasSkills) missing.push('skills or experience');

      return res.status(400).json({
        error: 'Profile incomplete',
        message: `Please complete your profile before applying. Missing: ${missing.join(', ')}`,
        redirectTo: '/profile/complete',
      });
    }

    // Create the application
    const applicationId = uuidv4();
    await executeQuery(`
      INSERT INTO applications (id, user_id, job_id, status, applied_on, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
    `, [applicationId, session.user.id, jobId, 'pending']);

    return res.status(201).json({
      id: applicationId,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
} 