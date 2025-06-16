import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { mockJobPostings, mockCandidates } from '@/data/mockData';
import { Candidate, ExperienceEntry, EducationEntry } from '@/types';

// Create a connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345678',
  port: 5432,
  // Add connection timeout settings
  connectionTimeoutMillis: 5000,
  // Add optional query timeout
  statement_timeout: 10000
});

// Test database connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    client.release();
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database:', err);
  }
})();

// Wrap query execution in a helper function
const executeQuery = async (query: string, params?: any[]) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Job operations
export const getJobs = async () => {
  try {
    // First check if the table exists
    const tableChecks = await executeQuery(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_postings') as job_postings_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_applications') as job_applications_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') as applications_exists
    `);
    
    // If job_postings table doesn't exist yet, return mock data
    if (!tableChecks[0].job_postings_exists) {
      console.log('job_postings table does not exist yet, returning mock data');
      return mockJobPostings;
    }
    
    // Check if the applications tables exist
    const jobApplicationsExists = tableChecks[0].job_applications_exists;
    const applicationsExists = tableChecks[0].applications_exists;
    
    console.log('Table existence check:', {
      job_postings: tableChecks[0].job_postings_exists,
      job_applications: jobApplicationsExists,
      applications: applicationsExists
    });
    
    // Use a simple query to get all jobs first
    const jobs = await executeQuery(`
      SELECT * FROM job_postings ORDER BY created_at DESC
    `);
    
    // Process each job to add applications and parse requirements
    const processedJobs = await Promise.all(jobs.map(async (job: any) => {
      let applications: any[] = [];
      
      // Get applications from job_applications table if it exists
      if (jobApplicationsExists) {
        const jobApps = await executeQuery(
        'SELECT * FROM job_applications WHERE job_id = $1',
        [job.id]
      );
        applications = applications.concat(jobApps);
      }
      
      // Get applications from the applications table if it exists
      if (applicationsExists) {
        const apps = await executeQuery(
          `SELECT 
            a.id, a.job_id, u.name, u.email, 
            up.phone_number as phone, 
            a.status, a.applied_on as applied_date
          FROM applications a
          JOIN users u ON a.user_id = u.id
          LEFT JOIN user_profiles up ON u.id = up.user_id
          WHERE a.job_id = $1
          ORDER BY a.applied_on DESC`,
          [job.id]
        );
        applications = applications.concat(apps);
      }
      
      console.log(`Found ${applications.length} applications for job ${job.id} (${job.title})`);
      
      // Parse requirements if it's stored as JSON string
      let requirements = [];
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
        } catch (err) {
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
      
      // Parse skills if it's stored as JSON string
      let skills = [];
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
        } catch (err) {
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
      
      // Format dates for display
      const postedDate = job.posted_date 
        ? new Date(job.posted_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
        
      const deadline = job.deadline
        ? new Date(job.deadline).toISOString().split('T')[0]
        : '';
        
      // Return formatted job
      return {
        id: job.id,
        title: job.title,
        company: job.company || '',
        department: job.department || '',
        location: job.location,
        jobType: job.job_type || 'full-time',
        workMode: job.work_mode || 'on-site',
        experience: job.experience || '',
        industry: job.industry || '',
        description: job.description,
        summary: job.summary || '',
        responsibilities: job.responsibilities || '',
        requirements: requirements,
        skills: skills,
        salary: job.salary || '',
        currency: job.currency || 'USD',
        benefits: job.benefits || '',
        postedDate: postedDate,
        deadline: deadline,
        applicationEmail: job.application_email || '',
        applicationUrl: job.application_url || '',
        contactPerson: job.contact_person || '',
        status: job.status || 'open',
        isInternalOnly: job.is_internal_only || false,
        isFeatured: job.is_featured || false,
        postedBy: job.posted_by,
        applications: applications || []
      };
    }));
    
    console.log('Retrieved jobs from database:', processedJobs);
    return processedJobs;
  } catch (error) {
    console.error('Error getting jobs from database, using mock data:', error);
    return mockJobPostings;
  }
};

export const getJobById = async (id: string) => {
  try {
    await ensureTablesExist();
    
    // Check which tables exist
    const tableChecks = await executeQuery(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_applications') as job_applications_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') as applications_exists
    `);
    
    const jobApplicationsExists = tableChecks[0].job_applications_exists;
    const applicationsExists = tableChecks[0].applications_exists;
    
    // Simply get the job by ID
    const query = `SELECT * FROM job_postings WHERE id = $1`;
    const jobs = await executeQuery(query, [id]);
    
    if (jobs.length === 0) {
      console.log(`No job found with id: ${id}`);
      return null;
    }
    
    const job = jobs[0];
    console.log('Found job in database:', job);
    
    // Get applications from both tables
    let applications: any[] = [];
    
    // Get applications from job_applications table if it exists
    if (jobApplicationsExists) {
      const jobApps = await executeQuery(
      'SELECT * FROM job_applications WHERE job_id = $1',
      [job.id]
    );
      applications = applications.concat(jobApps);
    }
    
    // Get applications from the applications table if it exists
    if (applicationsExists) {
      const apps = await executeQuery(
        `SELECT 
          a.id, a.job_id, u.name, u.email, 
          up.phone_number as phone, 
          a.status, a.applied_on as applied_date
        FROM applications a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE a.job_id = $1`,
        [job.id]
      );
      applications = applications.concat(apps);
    }
    
    console.log(`Found ${applications.length} applications for job ${job.id} (${job.title})`);
    
    // Parse requirements if it's stored as JSON string
    let requirements = [];
    if (job.requirements) {
    if (typeof job.requirements === 'string') {
      try {
        requirements = JSON.parse(job.requirements);
      } catch (err) {
        console.error('Error parsing requirements:', err);
      }
    } else if (Array.isArray(job.requirements)) {
      requirements = job.requirements;
    }
    }
    
    // Parse skills if it's stored as JSON string
    let skills = [];
    if (job.skills) {
    if (typeof job.skills === 'string') {
      try {
        skills = JSON.parse(job.skills);
      } catch (err) {
        console.error('Error parsing skills:', err);
      }
    } else if (Array.isArray(job.skills)) {
      skills = job.skills;
    }
    }
    
    // Format dates for display
    const postedDate = job.posted_date 
      ? new Date(job.posted_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
      
    const deadline = job.deadline
      ? new Date(job.deadline).toISOString().split('T')[0]
      : '';
      
    // Return formatted job with all fields
    const formattedJob = {
      id: job.id,
      title: job.title,
      company: job.company || '',
      department: job.department || '',
      location: job.location,
      jobType: job.job_type || 'full-time',
      workMode: job.work_mode || 'on-site',
      experience: job.experience || '',
      industry: job.industry || '',
      description: job.description,
      summary: job.summary || '',
      responsibilities: job.responsibilities || '',
      requirements: requirements,
      skills: skills,
      salary: job.salary || '',
      currency: job.currency || 'USD',
      benefits: job.benefits || '',
      postedDate: postedDate,
      deadline: deadline,
      applicationEmail: job.application_email || '',
      applicationUrl: job.application_url || '',
      contactPerson: job.contact_person || '',
      status: job.status || 'open',
      isInternalOnly: job.is_internal_only || false,
      isFeatured: job.is_featured || false,
      postedBy: job.posted_by,
      applications: applications || []
    };
    
    console.log('Formatted job:', formattedJob);
    return formattedJob;
  } catch (error) {
    console.error('Error getting job by ID, using mock data:', error);
    return mockJobPostings.find(job => job.id === id);
  }
};

export const createJob = async (jobData: any) => {
  try {
    // Make sure tables exist
    await ensureTablesExist();
    
    const id = jobData.id || uuidv4();
    const query = `
      INSERT INTO job_postings (
        id, title, description, requirements, location, salary, 
        company, department, job_type, work_mode, experience,
        industry, currency, benefits, summary, responsibilities,
        skills, deadline, application_email, application_url,
        contact_person, status, is_internal_only, is_featured,
        posted_date, posted_by, posted_by_role, created_at, updated_at
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, NOW(), NOW()
      ) 
      RETURNING *
    `;
    
    // Ensure requirements is an array and then stringify for JSON storage
    const requirements = Array.isArray(jobData.requirements) 
      ? jobData.requirements 
      : [];
    
    // Ensure skills is an array and then stringify for JSON storage
    const skills = Array.isArray(jobData.skills) 
      ? jobData.skills 
      : [];
    
    // Format the posted date
    const postedDate = jobData.postedDate
      ? new Date(jobData.postedDate)
      : new Date();
    
    // Format the deadline date if present
    const deadline = jobData.deadline 
      ? new Date(jobData.deadline) 
      : null;
    
    const params = [
      id,
      jobData.title,
      jobData.description,
      JSON.stringify(requirements),
      jobData.location,
      jobData.salary || null,
      jobData.company || null,
      jobData.department || null,
      jobData.jobType || 'full-time',
      jobData.workMode || 'on-site',
      jobData.experience || null,
      jobData.industry || null,
      jobData.currency || 'USD',
      jobData.benefits || null,
      jobData.summary || null,
      jobData.responsibilities || null,
      JSON.stringify(skills),
      deadline,
      jobData.applicationEmail || null,
      jobData.applicationUrl || null,
      jobData.contactPerson || null,
      jobData.status || 'open',
      jobData.isInternalOnly === true,
      jobData.isFeatured === true,
      postedDate,
      jobData.postedBy,
      jobData.postedByRole || 'super_admin', // Default to super_admin if not specified
    ];
    
    console.log('Inserting job with params:', params);
    const result = await executeQuery(query, params);
    
    if (!result || result.length === 0) {
      throw new Error('Failed to insert job');
    }
    
    const insertedJob = result[0];
    
    // Format the job to match the expected structure
    const formattedJob = {
      id: insertedJob.id,
      title: insertedJob.title,
      company: insertedJob.company || '',
      department: insertedJob.department || '',
      location: insertedJob.location,
      jobType: insertedJob.job_type || 'full-time',
      workMode: insertedJob.work_mode || 'on-site',
      experience: insertedJob.experience || '',
      industry: insertedJob.industry || '',
      description: insertedJob.description,
      summary: insertedJob.summary || '',
      responsibilities: insertedJob.responsibilities || '',
      requirements: requirements,
      skills: skills,
      salary: insertedJob.salary || '',
      currency: insertedJob.currency || 'USD',
      benefits: insertedJob.benefits || '',
      postedDate: postedDate.toISOString().split('T')[0],
      deadline: deadline ? deadline.toISOString().split('T')[0] : '',
      applicationEmail: insertedJob.application_email || '',
      applicationUrl: insertedJob.application_url || '',
      contactPerson: insertedJob.contact_person || '',
      status: insertedJob.status || 'open',
      isInternalOnly: insertedJob.is_internal_only || false,
      isFeatured: insertedJob.is_featured || false,
      postedBy: insertedJob.posted_by,
      postedByRole: insertedJob.posted_by_role || 'super_admin',
      applications: []
    };
    
    console.log('Successfully created job:', formattedJob);
    return formattedJob;
  } catch (error) {
    console.error('Error creating job in database, using mock implementation:', error);
    // Create a mock job instead and add it to mockJobPostings
    const newJob = {
      ...jobData,
      id: jobData.id || uuidv4(),
      postedDate: jobData.postedDate || new Date().toISOString().split('T')[0],
      postedByRole: jobData.postedByRole || 'super_admin',
      applications: []
    };
    mockJobPostings.push(newJob);
    console.log('Added job to mock data:', newJob);
    return newJob;
  }
};

export const updateJob = async (id: string, jobData: any) => {
  try {
    const query = `
      UPDATE job_postings 
      SET 
        title = $1, 
        description = $2, 
        requirements = $3, 
        location = $4, 
        salary = $5, 
        company = $6,
        department = $7,
        job_type = $8,
        work_mode = $9,
        experience = $10,
        industry = $11,
        currency = $12,
        benefits = $13,
        summary = $14,
        responsibilities = $15,
        skills = $16,
        deadline = $17,
        application_email = $18,
        application_url = $19,
        contact_person = $20,
        status = $21,
        is_internal_only = $22,
        is_featured = $23,
        updated_at = NOW() 
      WHERE id = $24 
      RETURNING *
    `;
    
    // Format arrays to JSON strings
    const requirementsJson = Array.isArray(jobData.requirements) 
      ? JSON.stringify(jobData.requirements) 
      : JSON.stringify([]);
      
    const skillsJson = Array.isArray(jobData.skills) 
      ? JSON.stringify(jobData.skills) 
      : JSON.stringify([]);
    
    const params = [
      jobData.title,
      jobData.description,
      requirementsJson,
      jobData.location,
      jobData.salary || null,
      jobData.company || null,
      jobData.department || null,
      jobData.jobType || 'full-time',
      jobData.workMode || 'on-site',
      jobData.experience || null,
      jobData.industry || null,
      jobData.currency || 'USD',
      jobData.benefits || null,
      jobData.summary || null,
      jobData.responsibilities || null,
      skillsJson,
      jobData.deadline ? new Date(jobData.deadline) : null,
      jobData.applicationEmail || null,
      jobData.applicationUrl || null,
      jobData.contactPerson || null,
      jobData.status || 'open',
      jobData.isInternalOnly === true,
      jobData.isFeatured === true,
      id
    ];
    
    console.log('Updating job with params:', params);
    const result = await executeQuery(query, params);
    
    if (result.length === 0) {
      throw new Error('Job not found');
    }
    
    // Format the job response to match the expected structure
    const job = result[0];
    
    // Parse requirements from JSON if needed
    let requirements = [];
    if (typeof job.requirements === 'string') {
      try {
        requirements = JSON.parse(job.requirements);
      } catch (err) {
        console.error('Error parsing requirements:', err);
      }
    } else if (Array.isArray(job.requirements)) {
      requirements = job.requirements;
    }
    
    // Parse skills from JSON if needed
    let skills = [];
    if (typeof job.skills === 'string') {
      try {
        skills = JSON.parse(job.skills);
      } catch (err) {
        console.error('Error parsing skills:', err);
      }
    } else if (Array.isArray(job.skills)) {
      skills = job.skills;
    }
    
    return {
      id: job.id,
      title: job.title,
      company: job.company || '',
      department: job.department || '',
      location: job.location,
      description: job.description,
      requirements: requirements,
      skills: skills,
      salary: job.salary || '',
      currency: job.currency || 'USD',
      jobType: job.job_type || 'full-time',
      workMode: job.work_mode || 'on-site',
      experience: job.experience || '',
      industry: job.industry || '',
      summary: job.summary || '',
      responsibilities: job.responsibilities || '',
      benefits: job.benefits || '',
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
      applicationEmail: job.application_email || '',
      applicationUrl: job.application_url || '',
      contactPerson: job.contact_person || '',
      status: job.status || 'open',
      isInternalOnly: job.is_internal_only || false,
      isFeatured: job.is_featured || false,
      postedDate: job.posted_date ? new Date(job.posted_date).toISOString().split('T')[0] : '',
      applications: jobData.applications || []
    };
  } catch (error) {
    console.error('Error updating job in database, using mock implementation:', error);
    // Update the job in mockJobPostings
    const jobIndex = mockJobPostings.findIndex(job => job.id === id);
    if (jobIndex !== -1) {
      mockJobPostings[jobIndex] = { ...mockJobPostings[jobIndex], ...jobData };
      return mockJobPostings[jobIndex];
    }
    throw new Error('Job not found in mock data');
  }
};

export const deleteJob = async (id: string) => {
  try {
    // First, delete any job applications for this job
    await executeQuery('DELETE FROM job_applications WHERE job_id = $1', [id]);
    
    // Then delete the job itself
    const query = 'DELETE FROM job_postings WHERE id = $1 RETURNING *';
    const result = await executeQuery(query, [id]);
    
    if (result.length === 0) {
      throw new Error('Job not found');
    }
    
    return result[0];
  } catch (error) {
    console.error('Error deleting job from database, using mock implementation:', error);
    // Delete the job from mockJobPostings
    const jobIndex = mockJobPostings.findIndex(job => job.id === id);
    if (jobIndex !== -1) {
      const deletedJob = mockJobPostings[jobIndex];
      mockJobPostings.splice(jobIndex, 1);
      return deletedJob;
    }
    throw new Error('Job not found in mock data');
  }
};

// Candidate operations
export const getCandidates = async (source?: string, exclude?: string) => {
  try {
    // Ensure the candidate tables exist
    await ensureCandidateTablesExist();
    
    // Check if the candidates table exists in the database
    const tableExists = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'candidates'
      )
    `);
    
    // Initialize candidates array
    let candidates = [];
    
    if (tableExists[0].exists) {
    // Get candidates from the database
      candidates = await executeQuery(`
      SELECT * FROM candidates ORDER BY created_at DESC
    `);
    } else {
      console.log('Candidates table does not exist in the database');
    }
    
    // Check if users table exists and get user data
    const usersTableExists = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    let registeredUsers = [];
    
    if (usersTableExists[0].exists) {
      // Get only applicant users (candidates who registered through website)
      // Exclude admin, superadmin, and recruiter roles
      registeredUsers = await executeQuery(`
        SELECT u.id, u.name, u.email, p.phone_number as phone,
               p.github_url, p.linkedin_url, u.created_at
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.role = 'applicant' OR u.role IS NULL OR u.role = ''
        ORDER BY u.created_at DESC
      `);
      
      console.log(`Found ${registeredUsers.length} website applicants to include as candidates`);
    }
    
    // Combine candidates from candidates table with registered website applicants
    let allCandidates = [...candidates];
    
    // Add registered website applicants who aren't already in the candidates list
    for (const user of registeredUsers) {
      // Check if user already exists in candidates list (by email)
      const existingCandidate = allCandidates.find(
        (candidate: any) => candidate.email === user.email
      );
      
      // If user is not already in candidates list, add them
      if (!existingCandidate) {
        allCandidates.push({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          github_url: user.github_url || null,
          linkedin_url: user.linkedin_url || null,
          skills: [],
          resume_url: null,
          relevancy_score: null,
          source: 'website',  // Changed from 'frontend' to 'website' for clarity
          created_at: user.created_at,
          updated_at: new Date()
        });
      }
    }

    // Apply source filtering if requested
    if (source) {
      if (source === 'admin') {
        // For admin sources, include manual, excel-import, and resume-parsing
        allCandidates = allCandidates.filter((candidate: any) => {
          return ['manual', 'excel-import', 'resume-parsing'].includes(candidate.source) || 
                 (candidate.source === 'excel') || 
                 (candidate.source === 'resume');
        });
      } else if (source === 'frontend') {
        // For frontend source, include website applicants only
        console.log('Filtering for website-registered candidates only');
        allCandidates = allCandidates.filter((candidate: any) => {
          const isFromWebsite = candidate.source === 'website' || candidate.source === 'frontend';
          const isWebsiteApplicant = registeredUsers.some((u: any) => u.id === candidate.id || u.email === candidate.email);
          
          // Log for debugging
          if (isFromWebsite || isWebsiteApplicant) {
            console.log(`Including website candidate ${candidate.name} (${candidate.email}) - source: ${candidate.source}`);
          }
          
          return isFromWebsite || isWebsiteApplicant;
        });
      } else {
        // For specific sources, just match the source field
        allCandidates = allCandidates.filter((candidate: any) => {
          // Handle legacy source values
          if (source === 'excel-import' && candidate.source === 'excel') return true;
          if (source === 'resume-parsing' && candidate.source === 'resume') return true;
          return candidate.source === source;
        });
      }
    }
    
    // Apply exclusion filtering if requested
    if (exclude) {
      // Filter to exclude candidates from the specified source
      allCandidates = allCandidates.filter((candidate: any) => {
        if (exclude === 'frontend') {
          // Exclude website registered users
          return candidate.source !== 'website' && candidate.source !== 'frontend' && 
                 !registeredUsers.some((u: any) => u.id === candidate.id);
        } else if (exclude === 'admin') {
          // Exclude admin sources (manual, excel-import, resume-parsing)
          return !['manual', 'excel-import', 'resume-parsing', 'excel', 'resume'].includes(candidate.source);
        } else {
          // Exclude specific source
          // Handle legacy source values
          if (exclude === 'excel-import' && candidate.source === 'excel') return false;
          if (exclude === 'resume-parsing' && candidate.source === 'resume') return false;
          return candidate.source !== exclude;
        }
      });
    }
    
    // Helper function to safely format date strings
    const safeFormatDate = (dateValue: any): string => {
      if (!dateValue) return '';
      
      try {
        // Attempt to create a Date object and get its ISO string
        const date = new Date(dateValue);
        // Check if the date is valid before calling toISOString()
        if (isNaN(date.getTime())) {
          return '';
        }
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formatting date:', dateValue, error);
        return '';
      }
    };
    
    // Process each candidate to get their relationships
    const processedCandidates = await Promise.all(allCandidates.map(async (candidate: any) => {
      // Get experience for this candidate
      const experience = await executeQuery(
        'SELECT * FROM experience WHERE candidate_id = $1 ORDER BY start_date DESC',
        [candidate.id]
      ).catch(() => []);
      
      // Get education for this candidate
      const education = await executeQuery(
        'SELECT * FROM education WHERE candidate_id = $1 ORDER BY start_date DESC',
        [candidate.id]
      ).catch(() => []);
      
      // For registered users, try to get skills from user_skills table
      let skills = candidate.skills || [];
      
      // Check if this is a registered user without skills
      if (skills.length === 0 && registeredUsers.some((u: any) => u.id === candidate.id)) {
        try {
          const userSkills = await executeQuery(
            'SELECT name FROM user_skills WHERE user_id = $1',
        [candidate.id]
      );
          
          if (userSkills.length > 0) {
            skills = userSkills.map((s: any) => s.name);
          }
        } catch (error) {
          console.error('Error fetching user skills:', error);
        }
      }
      
      // Format the data
      return {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || '',
        githubUrl: candidate.github_url || null,
        linkedinUrl: candidate.linkedin_url || null,
        skills: typeof skills === 'string' 
          ? JSON.parse(skills || '[]')
          : (skills || []),
        resumeUrl: candidate.resume_url,
        relevancyScore: candidate.relevancy_score,
        source: candidate.source || (registeredUsers.some((u: any) => u.id === candidate.id) ? 'frontend' : 'manual'),
        experience: experience.map((exp: any) => ({
          id: exp.id,
          company: exp.company,
          title: exp.title,
          startDate: safeFormatDate(exp.start_date),
          endDate: safeFormatDate(exp.end_date),
          description: exp.description || ''
        })),
        education: education.map((edu: any) => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field || '',
          startDate: safeFormatDate(edu.start_date),
          endDate: safeFormatDate(edu.end_date)
        }))
      };
    }));
    
    console.log(`Retrieved ${processedCandidates.length} candidates from database (including registered users)`);
    return processedCandidates;
  } catch (error) {
    console.error('Error getting candidates from database:', error);
    // Return an empty array instead of mock data to prevent deleted data from reappearing
    return [];
  }
};

// Helper function to parse dates
const parseDateString = (dateStr: string | undefined, isPresent: boolean = false): Date | null => {
  if (!dateStr || (isPresent && dateStr.toLowerCase() === 'present')) {
    return null;
  }
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try to parse year only
    if (/^\d{4}$/.test(dateStr)) {
      return new Date(`${dateStr}-01-01`);
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing date:', e);
    return null;
  }
};

export const createCandidate = async (candidateData: Candidate) => {
  try {
    // Ensure tables exist
    await ensureCandidateTablesExist();
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate ID if not provided
      const id = candidateData.id || uuidv4();
      
      // Process skills to ensure they are properly formatted
      let skillsArray = [];
      
      // Debug log original skills format
      console.log(`Processing skills for candidate ${candidateData.name}:`, 
        typeof candidateData.skills, 
        Array.isArray(candidateData.skills) ? 'array' : candidateData.skills);
      
      if (candidateData.skills) {
        if (Array.isArray(candidateData.skills)) {
          // Already an array
          skillsArray = candidateData.skills;
          console.log('Skills already in array format:', skillsArray);
        } else if (typeof candidateData.skills === 'string') {
          // Special handling for Excel imports and other string formats
          const skillsStr = candidateData.skills as string;
          
          // Completely avoid JSON.parse for non-JSON looking strings
          if (skillsStr.trim().startsWith('[') && skillsStr.trim().endsWith(']')) {
            // Only try JSON parse if it actually looks like a JSON array
            try {
              skillsArray = JSON.parse(skillsStr.trim());
              console.log('Successfully parsed JSON array from string:', skillsArray);
            } catch (error) {
              console.log('Failed to parse as JSON despite brackets, treating as plain text');
              // If it fails despite looking like JSON, treat as a single string
              skillsArray = [skillsStr.trim()];
            }
          } else if (skillsStr.includes(',')) {
            // Handle comma-separated values
            skillsArray = skillsStr
              .split(',')
              .map(skill => skill.trim())
              .filter(Boolean);
            console.log('Processed comma-separated skills:', skillsArray);
          } else {
            // Single skill as a string
            skillsArray = [skillsStr.trim()].filter(Boolean);
            console.log('Processed single skill:', skillsArray);
          }
        } else {
          // Unknown format - log for debugging
          console.log('Unknown skills format:', typeof candidateData.skills, candidateData.skills);
          skillsArray = [];
        }
      } else {
        console.log('No skills provided for candidate');
      }
      
      // Ensure skillsArray is a valid array before stringifying
      if (!Array.isArray(skillsArray)) {
        console.log('Skills are not an array after processing, defaulting to empty array');
        skillsArray = [];
      }
      
      // Determine the source based on the provided data or context
      let source = candidateData.source || 'manual';
      
      // Validate and normalize source value
      const validSources = ['manual', 'excel-import', 'resume-parsing', 'frontend'];
      if (!validSources.includes(source)) {
        // Map legacy source values to new ones
        if (source === 'excel') source = 'excel-import';
        if (source === 'resume') source = 'resume-parsing';
        // Default to manual if not recognized
        if (!validSources.includes(source)) source = 'manual';
      }
      
      // Insert the candidate
      const insertCandidateQuery = `
        INSERT INTO candidates (
          id, name, email, phone, skills, resume_url, 
          relevancy_score, github_url, linkedin_url, source, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `;
      
      const candidateResult = await client.query(insertCandidateQuery, [
        id,
        candidateData.name,
        candidateData.email,
        candidateData.phone || null,
        Array.isArray(skillsArray) ? JSON.stringify(skillsArray) : '[]',
        candidateData.resumeUrl || null,
        candidateData.relevancyScore || null,
        candidateData.githubUrl || null,
        candidateData.linkedinUrl || null,
        source
      ]);
      
      const candidate = candidateResult.rows[0];
      
      // Insert experience entries
      if (candidateData.experience && candidateData.experience.length > 0) {
        for (const exp of candidateData.experience) {
          if (!exp.company && !exp.title) continue; // Skip empty entries
          
          const expQuery = `
            INSERT INTO experience (
              id, candidate_id, company, title, start_date, 
              end_date, description, created_at, updated_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `;
          
          // Parse dates using helper function
          const startDate = parseDateString(exp.startDate);
          const endDate = parseDateString(exp.endDate, true);
          
          const expParams = [
            uuidv4(),
            id,
            exp.company,
            exp.title,
            startDate,
            endDate,
            exp.description || ''
          ];
          
          await client.query(expQuery, expParams);
        }
      }
      
      // Insert education entries
      if (candidateData.education && candidateData.education.length > 0) {
        for (const edu of candidateData.education) {
          if (!edu.institution && !edu.degree) continue; // Skip empty entries
          
          const eduQuery = `
            INSERT INTO education (
              id, candidate_id, institution, degree, field, 
              start_date, end_date, created_at, updated_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `;
          
          // Parse dates using helper function
          const startDate = parseDateString(edu.startDate);
          const endDate = parseDateString(edu.endDate);
          
          const eduParams = [
            uuidv4(),
            id,
            edu.institution,
            edu.degree,
            edu.field || '',
            startDate,
            endDate
          ];
          
          await client.query(eduQuery, eduParams);
        }
      }
      
      await client.query('COMMIT');
      
      // Return the created candidate with its relationships
      return {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        githubUrl: candidate.github_url,
        linkedinUrl: candidate.linkedin_url,
        skills: JSON.parse(candidate.skills || '[]'),
        experience: candidateData.experience || [],
        education: candidateData.education || [],
        resumeUrl: candidate.resume_url,
        relevancyScore: candidate.relevancy_score,
        source: candidate.source
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating candidate in database, using mock implementation:', error);
    
    // Create a mock candidate instead
    const newCandidate = {
      ...candidateData,
      id: candidateData.id || uuidv4()
    };
    
    mockCandidates.push(newCandidate);
    return newCandidate;
  }
};

// Ensure candidate tables exist
export const ensureCandidateTablesExist = async () => {
  try {
    console.log('Initializing candidate tables...');
    
    // Create candidates table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        skills JSONB,
        resume_url VARCHAR(255),
        relevancy_score INTEGER,
        github_url VARCHAR(255),
        linkedin_url VARCHAR(255),
        source VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Check if source column exists, add it if not
    const columnExists = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'candidates' 
        AND column_name = 'source'
      )
    `);
    
    if (!columnExists[0].exists) {
      console.log('Adding source column to candidates table');
      await executeQuery(`
        ALTER TABLE candidates ADD COLUMN source VARCHAR(50)
      `);
    }
    
    // Create experience table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS experience (
        id VARCHAR(36) PRIMARY KEY,
        candidate_id VARCHAR(36) NOT NULL,
        company VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        description TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);
    
    // Create education table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS education (
        id VARCHAR(36) PRIMARY KEY,
        candidate_id VARCHAR(36) NOT NULL,
        institution VARCHAR(255) NOT NULL,
        degree VARCHAR(255) NOT NULL,
        field VARCHAR(255),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Candidate tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing candidate tables:', error);
    return false;
  }
};

// Set up SQL tables
export const initializeTables = async () => {
  try {
    console.log('Initializing database tables...');
    // Create job_postings table if it doesn't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS job_postings (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        requirements JSONB NOT NULL,
        location VARCHAR(255) NOT NULL,
        salary VARCHAR(255),
        company VARCHAR(255),
        department VARCHAR(255),
        job_type VARCHAR(50) DEFAULT 'full-time',
        work_mode VARCHAR(50) DEFAULT 'on-site',
        experience VARCHAR(255),
        industry VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'USD',
        benefits TEXT,
        summary TEXT,
        responsibilities TEXT,
        skills JSONB,
        deadline TIMESTAMP,
        application_email VARCHAR(255),
        application_url VARCHAR(255),
        contact_person VARCHAR(255),
        status VARCHAR(50) DEFAULT 'open',
        is_internal_only BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        posted_date TIMESTAMP NOT NULL,
        posted_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);
    
    // Create job_applications table if it doesn't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id VARCHAR(36) PRIMARY KEY,
        job_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        resume_url VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        applied_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        FOREIGN KEY (job_id) REFERENCES job_postings(id)
      )
    `);

    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database tables:', error);
    return false;
  }
};

// Variable to track initialization status
let tablesInitialized = false;
let candidateTablesInitialized = false;

// Function to ensure tables are initialized before operations
const ensureTablesExist = async () => {
  if (!tablesInitialized) {
    tablesInitialized = await initializeTables();
  }
  return tablesInitialized;
};

// Initialize tables when this module is first imported
(async () => {
  try {
    await ensureTablesExist();
    await ensureCandidateTablesExist();
  } catch (error) {
    console.error('Failed to initialize tables on module import:', error);
  }
})();

export const getCandidateById = async (id: string) => {
  try {
    // Ensure candidate tables exist
    await ensureCandidateTablesExist();
    
    // Check if candidates table exists
    const tableCheck = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'candidates'
      )
    `);
    
    let candidate = null;
    
    // First try to find the candidate in the candidates table
    if (tableCheck[0].exists) {
    // Get candidate from database
    const query = `
      SELECT c.* FROM candidates c WHERE c.id = $1
    `;
    const candidateResult = await executeQuery(query, [id]);
    
      if (candidateResult.length > 0) {
        candidate = candidateResult[0];
      }
    }
    
    // If no candidate found in candidates table, check the users table
    if (!candidate) {
      // Check if users table exists
      const usersTableCheck = await executeQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `);
      
      if (usersTableCheck[0].exists) {
        // Try to find the user in the users table
        const userQuery = `
          SELECT u.id, u.name, u.email, p.phone_number as phone, 
                 p.github_url, p.linkedin_url
          FROM users u
          LEFT JOIN user_profiles p ON u.id = p.user_id
          WHERE u.id = $1
        `;
        const userResult = await executeQuery(userQuery, [id]);
        
        if (userResult.length > 0) {
          console.log('Found candidate in users table:', userResult[0]);
          
          // Create a candidate object from the user data
          candidate = {
            id: userResult[0].id,
            name: userResult[0].name,
            email: userResult[0].email,
            phone: userResult[0].phone || '',
            github_url: userResult[0].github_url || null,
            linkedin_url: userResult[0].linkedin_url || null,
            skills: [] as string[],
            resume_url: null,
            relevancy_score: null,
            created_at: new Date(),
            updated_at: new Date(),
            experience_data: [] as any[],  // Add explicit type
            education_data: [] as any[]    // Add explicit type
          };
          
          // Try to get skills from user_skills table
          try {
            const userSkills = await executeQuery(
              'SELECT name FROM user_skills WHERE user_id = $1',
              [id]
            );
            
            if (userSkills.length > 0) {
              candidate.skills = userSkills.map((s: any) => s.name);
            }
          } catch (error) {
            console.error('Error fetching user skills:', error);
          }
          
          // Try to get experience from user_experience table
          try {
            const userExperience = await executeQuery(
              'SELECT * FROM user_experience WHERE user_id = $1 ORDER BY id DESC',
              [id]
            );
            
            // If there's experience data, store it for later processing
            if (userExperience.length > 0) {
              candidate.experience_data = userExperience;
            }
          } catch (error) {
            console.error('Error fetching user experience:', error);
            // Initialize as empty array to avoid undefined errors
            candidate.experience_data = [];
          }
          
          // Try to get education from user_education table
          try {
            const userEducation = await executeQuery(
              'SELECT * FROM user_education WHERE user_id = $1 ORDER BY id DESC',
              [id]
            );
            
            // If there's education data, store it for later processing
            if (userEducation.length > 0) {
              candidate.education_data = userEducation;
            }
          } catch (error) {
            console.error('Error fetching user education:', error);
            // Initialize as empty array to avoid undefined errors
            candidate.education_data = [];
          }
          
          // Try to get resume from user_profile table
          try {
            const userProfile = await executeQuery(
              'SELECT resume_url FROM user_profiles WHERE user_id = $1',
              [id]
            );
            
            if (userProfile.length > 0 && userProfile[0].resume_url) {
              candidate.resume_url = userProfile[0].resume_url;
            }
          } catch (error) {
            console.error('Error fetching user resume:', error);
          }
        }
      }
    }
    
    // If no candidate found in either table, return null
    if (!candidate) {
      return null;
    }
    
    // Get experience for this candidate
    let experience = [];
    
    // If this is a user with experience data already fetched
    if (candidate.experience_data) {
      experience = candidate.experience_data;
    } else {
      // Otherwise get experience from experience table
    const experienceQuery = `
      SELECT * FROM experience 
      WHERE candidate_id = $1
      ORDER BY start_date DESC
    `;
      experience = await executeQuery(experienceQuery, [id]);
    }
    
    // Get education for this candidate
    let education = [];
    
    // If this is a user with education data already fetched
    if (candidate.education_data) {
      education = candidate.education_data;
    } else {
      // Otherwise get education from education table
    const educationQuery = `
      SELECT * FROM education 
      WHERE candidate_id = $1
      ORDER BY start_date DESC
    `;
      education = await executeQuery(educationQuery, [id]);
    }
    
    // Handle skills - safely parse JSON or handle comma-separated strings
    let skillsArray: string[] = [];
    if (candidate.skills) {
      if (Array.isArray(candidate.skills)) {
        // Already an array
        skillsArray = candidate.skills;
      } else if (typeof candidate.skills === 'string') {
        try {
          // Try to parse as JSON
          skillsArray = JSON.parse(candidate.skills);
        } catch (error) {
          // If not valid JSON, try to handle as comma-separated string
          skillsArray = candidate.skills
            .split(',')
            .map((skill: string) => skill.trim())
            .filter(Boolean);
        }
      }
    }
    
    // Clean up temporary data fields
    const finalCandidate = {...candidate};
    delete finalCandidate.experience_data;
    delete finalCandidate.education_data;
    
    // Helper function to safely format date strings
    const safeFormatDate = (dateValue: any): string => {
      if (!dateValue) return '';
      
      try {
        // Attempt to create a Date object and get its ISO string
        const date = new Date(dateValue);
        // Check if the date is valid before calling toISOString()
        if (isNaN(date.getTime())) {
          return '';
        }
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formatting date:', dateValue, error);
        return '';
      }
    };
    
    // Format and return the candidate
    return {
      id: finalCandidate.id,
      name: finalCandidate.name,
      email: finalCandidate.email,
      phone: finalCandidate.phone,
      githubUrl: finalCandidate.github_url,
      linkedinUrl: finalCandidate.linkedin_url,
      skills: skillsArray,
      experience: experience.map((exp: any) => ({
        company: exp.company,
        title: exp.title,
        startDate: safeFormatDate(exp.start_date),
        endDate: safeFormatDate(exp.end_date),
        description: exp.description
      })),
      education: education.map((edu: any) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        startDate: safeFormatDate(edu.start_date),
        endDate: safeFormatDate(edu.end_date)
      })),
      resumeUrl: candidate.resume_url,
      relevancyScore: candidate.relevancy_score
    };
  } catch (error) {
    console.error('Error getting candidate by ID:', error);
    // Return null instead of mock data
    return null;
  }
};

export const updateCandidate = async (id: string, candidateData: Candidate) => {
  try {
    // Ensure tables exist
    await ensureCandidateTablesExist();
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update candidate
      const candidateQuery = `
        UPDATE candidates SET
          name = $1,
          email = $2,
          phone = $3,
          skills = $4,
          resume_url = $5,
          github_url = $6,
          linkedin_url = $7,
          relevancy_score = $8,
          updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `;
      
      const candidateParams = [
        candidateData.name,
        candidateData.email,
        candidateData.phone || null,
        JSON.stringify(candidateData.skills || []),
        candidateData.resumeUrl || null,
        candidateData.githubUrl || null,
        candidateData.linkedinUrl || null,
        candidateData.relevancyScore || null,
        id
      ];
      
      const candidateResult = await client.query(candidateQuery, candidateParams);
      
      if (candidateResult.rows.length === 0) {
        throw new Error('Candidate not found');
      }
      
      const candidate = candidateResult.rows[0];
      
      // Delete existing experience entries
      await client.query('DELETE FROM experience WHERE candidate_id = $1', [id]);
      
      // Insert new experience entries
      if (candidateData.experience && candidateData.experience.length > 0) {
        for (const exp of candidateData.experience) {
          if (!exp.company && !exp.title) continue; // Skip empty entries
          
          const expQuery = `
            INSERT INTO experience (
              id, candidate_id, company, title, start_date, 
              end_date, description, created_at, updated_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `;
          
          // Parse dates using helper function
          const startDate = parseDateString(exp.startDate);
          const endDate = parseDateString(exp.endDate, true);
          
          const expParams = [
            uuidv4(),
            id,
            exp.company,
            exp.title,
            startDate,
            endDate,
            exp.description || ''
          ];
          
          await client.query(expQuery, expParams);
        }
      }
      
      // Delete existing education entries
      await client.query('DELETE FROM education WHERE candidate_id = $1', [id]);
      
      // Insert new education entries
      if (candidateData.education && candidateData.education.length > 0) {
        for (const edu of candidateData.education) {
          if (!edu.institution && !edu.degree) continue; // Skip empty entries
          
          const eduQuery = `
            INSERT INTO education (
              id, candidate_id, institution, degree, field, 
              start_date, end_date, created_at, updated_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `;
          
          // Parse dates using helper function
          const startDate = parseDateString(edu.startDate);
          const endDate = parseDateString(edu.endDate);
          
          const eduParams = [
            uuidv4(),
            id,
            edu.institution,
            edu.degree,
            edu.field || '',
            startDate,
            endDate
          ];
          
          await client.query(eduQuery, eduParams);
        }
      }
      
      await client.query('COMMIT');
      
      // Return the updated candidate with its relationships
      return await getCandidateById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating candidate in database, using mock implementation:', error);
    
    // Update the candidate in mockCandidates
    const candidateIndex = mockCandidates.findIndex(candidate => candidate.id === id);
    if (candidateIndex !== -1) {
      mockCandidates[candidateIndex] = { ...mockCandidates[candidateIndex], ...candidateData };
      return mockCandidates[candidateIndex];
    }
    throw new Error('Candidate not found in mock data');
  }
};

export const deleteCandidate = async (id: string) => {
  console.log(`Starting deletion process for candidate ID: ${id}`);
    
  if (!id) {
    console.error('Invalid ID provided for deletion');
    throw new Error('Invalid candidate ID');
  }
  
  // Get a client from the pool
  let client;
  
  try {
    // Ensure the candidate tables exist first
    await ensureCandidateTablesExist();
    
    try {
      // Connect to the database with timeout handling
      client = await Promise.race([
        pool.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 5000)
        )
      ]) as any;
      
      console.log(`Connected to database for deleting candidate ${id}`);
    } catch (connErr: any) {
      console.error(`Failed to connect to database: ${connErr}`);
      throw new Error(`Database connection failed: ${connErr.message}`);
    }
    
    // Start transaction
      await client.query('BEGIN');
    console.log('Transaction started');
      
    // First check if the candidate exists in candidates table
    const checkQuery = 'SELECT id, name FROM candidates WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);
    
    // If candidate not found in candidates table, check the users table
      if (checkResult.rowCount === 0) {
      console.log(`Candidate not found in candidates table, checking users table...`);
      
      // Check if the candidate exists in the users table
      const userQuery = `
        SELECT u.id, u.name, u.email 
        FROM users u 
        WHERE u.id = $1 AND u.role != 'admin'
      `;
      
      const userResult = await client.query(userQuery, [id]);
      
      if (userResult.rowCount === 0) {
        console.log(`No candidate found with ID: ${id} in either table`);
        throw new Error(`Candidate with ID ${id} not found`);
      }
      
      // We found the user in the users table
      const userData = userResult.rows[0];
      console.log(`Found user to delete: ${userData.name} (${id}) from users table`);
      
      // Actually delete the user from the users table
      console.log('Deleting user from users table...');
      
      // First delete related records due to foreign key constraints
      console.log('Deleting user_education records...');
      await client.query('DELETE FROM user_education WHERE user_id = $1', [id]);
      
      console.log('Deleting user_experience records...');
      await client.query('DELETE FROM user_experience WHERE user_id = $1', [id]);
      
      console.log('Deleting user_skills records...');
      await client.query('DELETE FROM user_skills WHERE user_id = $1', [id]);
      
      console.log('Deleting user_profiles records...');
      await client.query('DELETE FROM user_profiles WHERE user_id = $1', [id]);
      
      console.log('Deleting applications records...');
      await client.query('DELETE FROM applications WHERE user_id = $1', [id]);
      
      // Finally delete the user
      const deleteUserResult = await client.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      
      if (deleteUserResult.rowCount === 0) {
        throw new Error(`Failed to delete user ${id}: No rows affected`);
      }
      
      const deletedUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        source: 'frontend',
        deleted_from: 'users_table'
      };
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log(`Successfully deleted user ${userData.name} from users table`);
      
      return deletedUser;
    }
    
    const candidateName = checkResult.rows[0].name;
    console.log(`Found candidate to delete: ${candidateName} (${id})`);
    
    try {
      // First delete related records due to foreign key constraints
      console.log('Deleting education records...');
      const eduResult = await client.query('DELETE FROM education WHERE candidate_id = $1', [id]);
      console.log(`Deleted ${eduResult.rowCount} education records`);
      
      console.log('Deleting experience records...');
      const expResult = await client.query('DELETE FROM experience WHERE candidate_id = $1', [id]);
      console.log(`Deleted ${expResult.rowCount} experience records`);
      
      // Now delete the candidate
      console.log('Deleting the candidate record...');
      const deleteQuery = 'DELETE FROM candidates WHERE id = $1 RETURNING *';
      const deleteResult = await client.query(deleteQuery, [id]);
      
      // Verify deletion was successful
      if (deleteResult.rowCount === 0) {
        throw new Error(`Failed to delete candidate ${id}: No rows affected`);
      }
      
      const deletedCandidate = deleteResult.rows[0];
      console.log(`Successfully deleted candidate: ${deletedCandidate.name}`);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Transaction committed');
      
      return deletedCandidate;
    } catch (queryError: any) {
      // Rollback in case of query errors
      await client.query('ROLLBACK');
      console.log(`Transaction rolled back due to query error: ${queryError.message}`);
      throw queryError;
    }
    } catch (error) {
      // Rollback the transaction in case of error
    if (client) {
      try {
      await client.query('ROLLBACK');
      console.log('Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    
    console.error(`Error deleting candidate ${id}:`, error);
      throw error;
    } finally {
    // Make sure to release the client back to the pool
    if (client) {
      try {
      client.release();
      console.log('Database client released');
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
    }
    }
  }
};

// Delete all candidates
export const deleteAllCandidates = async () => {
  try {
    // Ensure tables exist
    await ensureCandidateTablesExist();
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // First check if the tables exist
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'candidates'
        )
      `);
      
      // If table doesn't exist, return success (nothing to delete)
      if (!tableCheck.rows[0].exists) {
        return true;
      }
      
      // Delete all education records (due to foreign key constraints)
      await client.query('DELETE FROM education');
      
      // Delete all experience records (due to foreign key constraints)
      await client.query('DELETE FROM experience');
      
      // Delete all candidates
      await client.query('DELETE FROM candidates');
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log('All candidates deleted successfully');
      return true;
    } catch (error) {
      // Rollback the transaction in case of error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error deleting all candidates:', error);
    
    // Clear mock data as fallback
    mockCandidates.length = 0;
    
    return true;
  }
};

export const deleteAllJobs = async () => {
  try {
    await ensureTablesExist();
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // First, delete all job applications
      await client.query('DELETE FROM job_applications');
      
      // Then delete all jobs
      const result = await client.query('DELETE FROM job_postings RETURNING *');
      
      await client.query('COMMIT');
      
      console.log(`Successfully deleted ${result.rowCount} jobs from database`);
      return {
        success: true,
        count: result.rowCount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting all jobs from database:', error);
    // Clear mock data as fallback
    const count = mockJobPostings.length;
    mockJobPostings.length = 0;
    
    return {
      success: true,
      count: count,
      mock: true
    };
  }
};