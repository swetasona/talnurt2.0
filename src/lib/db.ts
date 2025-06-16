import { mockJobPostings } from '@/data/mockData';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345678',
  port: 5432,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000
});

// Helper function to execute queries
export const executeQuery = async (query: string, params?: any[]) => {
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

// Ensure tables exist
const ensureUserTablesExist = async () => {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50),
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);
    return true;
  } catch (error) {
    console.error('Error ensuring user tables exist:', error);
    return false;
  }
};

// User operations
export const getUsers = async () => {
  try {
    await ensureUserTablesExist();
    
    const users = await executeQuery(`
      SELECT * FROM users ORDER BY created_at DESC
    `);
    
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const getUserById = async (id: string) => {
  try {
    await ensureUserTablesExist();
    
    const users = await executeQuery(`
      SELECT * FROM users WHERE id = $1
    `, [id]);
    
    if (users.length === 0) {
      return null;
    }
    
    const user = users[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

export const createUser = async (userData: any) => {
  try {
    await ensureUserTablesExist();
    
    const id = userData.id || uuidv4();
    const now = new Date();
    
    const result = await executeQuery(`
      INSERT INTO users (id, name, email, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      id,
      userData.name,
      userData.email,
      userData.password || null,
      userData.role || 'user',
      now,
      now
    ]);
    
    const user = result[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: any) => {
  try {
    await ensureUserTablesExist();
    
    const now = new Date();
    
    const result = await executeQuery(`
      UPDATE users
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          password = COALESCE($3, password),
          role = COALESCE($4, role),
          updated_at = $5
      WHERE id = $6
      RETURNING *
    `, [
      userData.name,
      userData.email,
      userData.password,
      userData.role,
      now,
      id
    ]);
    
    if (result.length === 0) {
      throw new Error('User not found');
    }
    
    const user = result[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Job operations
export const getJobs = async () => {
  try {
    // Use the PostgreSQL implementation from db-postgres.ts
    const { getJobs: getJobs_postgres } = require('./db-postgres');
    return await getJobs_postgres();
  } catch (error) {
    console.error('Error getting jobs from database, using mock data:', error);
    return mockJobPostings;
  }
};

export const getJobById = async (id: string) => {
  try {
    // Use the PostgreSQL implementation from db-postgres.ts
    const { getJobById: getJobById_postgres } = require('./db-postgres');
    return await getJobById_postgres(id);
  } catch (error) {
    console.error('Error getting job by ID, using mock data:', error);
    return mockJobPostings.find(job => job.id === id);
  }
};

export const createJob = async (jobData: any) => {
  try {
    // Use the PostgreSQL implementation from db-postgres.ts
    const { createJob: createJob_postgres } = require('./db-postgres');
    return await createJob_postgres(jobData);
  } catch (error) {
    console.error('Error creating job in database, using mock implementation:', error);
    // Create a mock job instead and add it to mockJobPostings
    const newJob = {
      ...jobData,
      id: jobData.id || uuidv4(),
      applications: []
    };
    mockJobPostings.push(newJob);
    return newJob;
  }
};

export const updateJob = async (id: string, jobData: any) => {
  try {
    // Use the PostgreSQL implementation from db-postgres.ts
    const { updateJob: updateJob_postgres } = require('./db-postgres');
    return await updateJob_postgres(id, jobData);
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
    // Use the PostgreSQL implementation from db-postgres.ts
    const { deleteJob: deleteJob_postgres } = require('./db-postgres');
    return await deleteJob_postgres(id);
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
export const getCandidates = async () => {
  try {
    // Use the PostgreSQL implementation from db-postgres.ts
    const { getCandidates: getCandidates_postgres } = require('./db-postgres');
    return await getCandidates_postgres();
  } catch (error) {
    console.error('Error getting candidates:', error);
    return [];
  }
};

export const getCandidateById = async (id: string) => {
  try {
    // Use the PostgreSQL implementation from db-postgres.ts
    const { getCandidateById: getCandidateById_postgres } = require('./db-postgres');
    return await getCandidateById_postgres(id);
  } catch (error) {
    console.error('Error getting candidate by ID:', error);
    return null;
  }
};

export const createCandidate = async (
  candidateData: any,
  experience: any[] = [],
  education: any[] = []
) => {
  try {
    // Use the PostgreSQL implementation from db-postgres.ts
    const { createCandidate: createCandidate_postgres } = require('./db-postgres');
    return await createCandidate_postgres({
      ...candidateData,
      experience,
      education
    });
  } catch (error) {
    console.error('Error creating candidate:', error);
    throw error;
  }
};

export const updateCandidate = async (id: string, candidateData: any) => {
  try {
    // Use the PostgreSQL implementation from db-postgres.ts
    const { updateCandidate: updateCandidate_postgres } = require('./db-postgres');
    return await updateCandidate_postgres(id, candidateData);
  } catch (error) {
    console.error('Error updating candidate:', error);
    throw error;
  }
};

export const deleteCandidate = async (id: string) => {
  try {
    // Use the PostgreSQL implementation from db-postgres.ts
    const { deleteCandidate: deleteCandidate_postgres } = require('./db-postgres');
    
    // Use the PostgreSQL implementation
    const result = await deleteCandidate_postgres(id);
    
    if (!result) {
      throw new Error(`Failed to delete candidate with ID: ${id}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error in deleteCandidate:', error);
    throw error;
  }
};

// Job Application operations
export const createJobApplication = async (applicationData: any) => {
  try {
    const id = applicationData.id || uuidv4();
    const now = new Date();
    
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
        updated_at TIMESTAMP NOT NULL
      )
    `);
    
    const result = await executeQuery(`
      INSERT INTO job_applications 
      (id, job_id, name, email, phone, resume_url, status, applied_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      id,
      applicationData.jobId,
      applicationData.name,
      applicationData.email,
      applicationData.phone || null,
      applicationData.resumeUrl,
      applicationData.status || 'pending',
      applicationData.appliedDate || now,
      now,
      now
    ]);
    
    const application = result[0];
    return {
      id: application.id,
      jobId: application.job_id,
      name: application.name,
      email: application.email,
      phone: application.phone,
      resumeUrl: application.resume_url,
      status: application.status,
      appliedDate: application.applied_date,
      createdAt: application.created_at,
      updatedAt: application.updated_at
    };
  } catch (error) {
    console.error('Error creating job application:', error);
    throw error;
  }
};

export const getApplicationsForJob = async (jobId: string) => {
  try {
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
        updated_at TIMESTAMP NOT NULL
      )
    `);
    
    const applications = await executeQuery(`
      SELECT * FROM job_applications
      WHERE job_id = $1
      ORDER BY created_at DESC
    `, [jobId]);
    
    return applications.map(app => ({
      id: app.id,
      jobId: app.job_id,
      name: app.name,
      email: app.email,
      phone: app.phone,
      resumeUrl: app.resume_url,
      status: app.status,
      appliedDate: app.applied_date,
      createdAt: app.created_at,
      updatedAt: app.updated_at
    }));
  } catch (error) {
    console.error('Error getting job applications:', error);
    return [];
  }
};

export const updateApplicationStatus = async (id: string, status: string) => {
  try {
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
        updated_at TIMESTAMP NOT NULL
      )
    `);
    
    const now = new Date();
    
    const result = await executeQuery(`
      UPDATE job_applications
      SET status = $1, updated_at = $2
      WHERE id = $3
      RETURNING *
    `, [status, now, id]);
    
    if (result.length === 0) {
      throw new Error('Job application not found');
    }
    
    const application = result[0];
    return {
      id: application.id,
      jobId: application.job_id,
      name: application.name,
      email: application.email,
      phone: application.phone,
      resumeUrl: application.resume_url,
      status: application.status,
      appliedDate: application.applied_date,
      createdAt: application.created_at,
      updatedAt: application.updated_at
    };
  } catch (error) {
    console.error('Error updating job application status:', error);
    throw error;
  }
}; 