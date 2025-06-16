const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345678',
  port: 5432
});

async function createTestApplicant() {
  try {
    console.log('🎯 Creating test website applicant...\n');
    
    // First, check if the user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', ['john.doe@example.com']);
    
    let userId;
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log('📌 User already exists, updating role to applicant...');
      await pool.query('UPDATE users SET role = $1, updated_at = NOW() WHERE email = $2', ['applicant', 'john.doe@example.com']);
    } else {
      userId = uuidv4();
      console.log('➕ Creating new user...');
      await pool.query(`
        INSERT INTO users (id, name, email, role, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [userId, 'John Doe', 'john.doe@example.com', 'applicant']);
    }
    
    const profileId = uuidv4();
    
    // Check if user_profiles table exists
    const profilesTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
      )
    `);
    
    if (profilesTableExists.rows[0].exists) {
      // Check if profile already exists
      const existingProfile = await pool.query('SELECT id FROM user_profiles WHERE user_id = $1', [userId]);
      
      if (existingProfile.rows.length > 0) {
        console.log('📝 Updating existing user profile...');
        await pool.query(`
          UPDATE user_profiles SET
            phone_number = $1,
            github_url = $2,
            linkedin_url = $3,
            updated_at = NOW()
          WHERE user_id = $4
        `, ['+1234567890', 'https://github.com/johndoe', 'https://linkedin.com/in/johndoe', userId]);
      } else {
        console.log('➕ Creating new user profile...');
        await pool.query(`
          INSERT INTO user_profiles (id, user_id, phone_number, github_url, linkedin_url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [profileId, userId, '+1234567890', 'https://github.com/johndoe', 'https://linkedin.com/in/johndoe']);
      }
    }
    
    // Check if user_skills table exists
    const skillsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_skills'
      )
    `);
    
    if (skillsTableExists.rows[0].exists) {
      console.log('🎯 Adding user skills...');
      // Delete existing skills first, then add new ones
      await pool.query('DELETE FROM user_skills WHERE user_id = $1', [userId]);
      
      // Add some skills with IDs
      await pool.query(`
        INSERT INTO user_skills (id, user_id, name, created_at)
        VALUES 
          ($1, $2, 'JavaScript', NOW()),
          ($3, $2, 'React', NOW()),
          ($4, $2, 'Node.js', NOW())
      `, [uuidv4(), userId, uuidv4(), uuidv4()]);
    }
    
    console.log('\n✅ Test applicant created successfully!');
    console.log('📋 Details:');
    console.log('   Name: John Doe');
    console.log('   Email: john.doe@example.com');
    console.log('   Role: applicant');
    console.log('   Phone: +1234567890');
    console.log('   Skills: JavaScript, React, Node.js');
    console.log('\n🌐 This user will now appear in the Global Talent page!');
    
    // Show updated user count
    const allUsers = await pool.query('SELECT id, name, email, role FROM users ORDER BY created_at DESC');
    console.log('\n👥 All users in database:');
    console.table(allUsers.rows);
    
  } catch (error) {
    console.error('❌ Error creating test applicant:', error);
  } finally {
    pool.end();
  }
}

createTestApplicant(); 