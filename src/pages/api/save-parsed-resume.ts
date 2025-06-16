import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

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

// Create tables if they don't exist
const ensureTablesExist = async () => {
  try {
    // Create parsed_resumes table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS parsed_resumes (
        id VARCHAR(36) PRIMARY KEY,
        candidate_id VARCHAR(36),
        original_filename VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        skills JSONB,
        raw_resume_text TEXT,
        parsed_data JSONB,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);
    
    // Ensure candidates table exists
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        skills JSONB,
        technical_skills JSONB,
        soft_skills JSONB,
        tool_skills JSONB,
        language_skills JSONB,
        resume_url VARCHAR(255),
        relevancy_score INTEGER,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);
    
    // Ensure education and experience tables exist
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
    
    return true;
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    return false;
  }
};

// Helper function to extract the skill categories from parsed data
const extractSkillCategories = (parsedData: any) => {
  // Initialize skill arrays
  const technicalSkills: string[] = [];
  const softSkills: string[] = [];
  const toolSkills: string[] = [];
  const languageSkills: string[] = [];
  
  // Check if skills are in the 'skill' object (deepseek format)
  if (parsedData.skill && typeof parsedData.skill === 'object') {
    // Technical skills
    if (Array.isArray(parsedData.skill.technical_skills)) {
      technicalSkills.push(...parsedData.skill.technical_skills.map((skill: any) => 
        typeof skill === 'string' ? skill : JSON.stringify(skill)
      ));
    }
    
    // Soft skills
    if (Array.isArray(parsedData.skill.soft_skills)) {
      softSkills.push(...parsedData.skill.soft_skills.map((skill: any) => 
        typeof skill === 'string' ? skill : JSON.stringify(skill)
      ));
    }
    
    // Tools
    if (Array.isArray(parsedData.skill.tools)) {
      toolSkills.push(...parsedData.skill.tools.map((skill: any) => 
        typeof skill === 'string' ? skill : JSON.stringify(skill)
      ));
    }
  }
  
  // Check for top-level arrays
  if (Array.isArray(parsedData.technical_skills)) {
    technicalSkills.push(...parsedData.technical_skills.map((skill: any) => 
      typeof skill === 'string' ? skill : JSON.stringify(skill)
    ));
  }
  
  if (Array.isArray(parsedData.soft_skills)) {
    softSkills.push(...parsedData.soft_skills.map((skill: any) => 
      typeof skill === 'string' ? skill : JSON.stringify(skill)
    ));
  }
  
  if (Array.isArray(parsedData.tools)) {
    toolSkills.push(...parsedData.tools.map((skill: any) => 
      typeof skill === 'string' ? skill : JSON.stringify(skill)
    ));
  }
  
  if (Array.isArray(parsedData.language_skills)) {
    languageSkills.push(...parsedData.language_skills.map((skill: any) => 
      typeof skill === 'string' ? skill : JSON.stringify(skill)
    ));
  }
  
  // Remove duplicates
  return {
    technicalSkills: Array.from(new Set(technicalSkills)),
    softSkills: Array.from(new Set(softSkills)),
    toolSkills: Array.from(new Set(toolSkills)),
    languageSkills: Array.from(new Set(languageSkills))
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure tables exist
    await ensureTablesExist();
    
    const { 
      originalFilename, 
      name, 
      email, 
      phone, 
      skills, 
      rawResumeText, 
      parsedData 
    } = req.body;

    // Validate required fields
    if (!originalFilename || !name || !email || !skills || !rawResumeText || !parsedData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Extract skill categories
    const { technicalSkills, softSkills, toolSkills, languageSkills } = extractSkillCategories(parsedData);

    // Generate IDs
    const resumeId = uuidv4();
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if a candidate with this email already exists
      const candidateQuery = `SELECT id FROM candidates WHERE email = $1 LIMIT 1`;
      const candidateResult = await client.query(candidateQuery, [email]);
      const existingCandidate = candidateResult.rows[0];
      
      let candidateId = existingCandidate?.id;
      
      // If no existing candidate, create a new one with categorized skills
      if (!existingCandidate) {
        const newCandidateId = uuidv4();
        const insertCandidateQuery = `
          INSERT INTO candidates (
            id, name, email, phone, skills, technical_skills, 
            soft_skills, tool_skills, language_skills, created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING id
        `;
        
        const candidateParams = [
          newCandidateId,
          name,
          email,
          phone || null,
          JSON.stringify(skills),
          JSON.stringify(technicalSkills),
          JSON.stringify(softSkills),
          JSON.stringify(toolSkills),
          JSON.stringify(languageSkills)
        ];
        
        const newCandidateResult = await client.query(insertCandidateQuery, candidateParams);
        candidateId = newCandidateResult.rows[0].id;
        
        // Create education entries if available
        if (parsedData.education && Array.isArray(parsedData.education)) {
          for (const edu of parsedData.education) {
            const eduId = uuidv4();
            const eduQuery = `
              INSERT INTO education (
                id, candidate_id, institution, degree, field, 
                start_date, end_date, created_at, updated_at
              ) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `;
            
            const eduParams = [
              eduId,
              candidateId,
              edu.institution || 'Unknown Institution',
              edu.degree || edu.description || 'Unknown Degree',
              edu.field || (edu.description?.split(' in ')?.[1] || ''),
              new Date(), // Default to current date since we don't have start date in parsed data
              edu.year ? new Date(edu.year) : null
            ];
            
            await client.query(eduQuery, eduParams);
          }
        }
        
        // Create experience entries if available
        if (parsedData.experience && Array.isArray(parsedData.experience)) {
          for (const exp of parsedData.experience) {
            const expId = uuidv4();
            const expQuery = `
              INSERT INTO experience (
                id, candidate_id, company, title, description, 
                start_date, end_date, created_at, updated_at
              ) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `;
            
            const expParams = [
              expId,
              candidateId,
              exp.company || 'Unknown Company',
              exp.title || exp.position || 'Unknown Position',
              exp.description || '',
              new Date(), // Default to current date since we don't have start date in parsed data
              null // We don't have end date in parsed data
            ];
            
            await client.query(expQuery, expParams);
          }
        }
      } else {
        // Update existing candidate with categorized skills
        const updateCandidateQuery = `
          UPDATE candidates 
          SET technical_skills = $1, soft_skills = $2, tool_skills = $3, 
              language_skills = $4, updated_at = NOW()
          WHERE id = $5
        `;
        
        await client.query(updateCandidateQuery, [
          JSON.stringify(technicalSkills),
          JSON.stringify(softSkills),
          JSON.stringify(toolSkills),
          JSON.stringify(languageSkills),
          candidateId
        ]);
      }
      
      // Save the parsed resume to the database
      const saveResumeQuery = `
        INSERT INTO parsed_resumes (
          id, candidate_id, original_filename, name, email, phone, 
          skills, raw_resume_text, parsed_data, created_at, updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id
      `;
      
      const resumeParams = [
        resumeId,
        candidateId,
        originalFilename,
        name,
        email,
        phone || null,
        JSON.stringify(skills),
        rawResumeText,
        JSON.stringify(parsedData)
      ];
      
      const savedResumeResult = await client.query(saveResumeQuery, resumeParams);
      
      await client.query('COMMIT');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Resume data saved successfully',
        resumeId: savedResumeResult.rows[0].id,
        candidateId,
        skillBreakdown: {
          technicalSkills,
          softSkills,
          toolSkills,
          languageSkills
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving parsed resume:', error);
    return res.status(500).json({ error: 'Failed to save resume data' });
  }
} 