require('dotenv').config();
const { Pool } = require('pg');

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Current time from database:', result.rows[0].current_time);
    
    // Check if users table exists
    try {
      const usersResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      console.log('Users table exists:', usersResult.rows[0].exists);
      
      if (usersResult.rows[0].exists) {
        // Count users
        const countResult = await client.query('SELECT COUNT(*) FROM "users"');
        console.log('Number of users:', countResult.rows[0].count);
        
        // Get recruiter users
        const recruitersResult = await client.query(`
          SELECT id, email, name, role FROM "users" 
          WHERE role IN ('recruiter', 'unassigned', 'employee', 'employer', 'manager')
        `);
        console.log('Recruiters:', recruitersResult.rows);
      }
    } catch (err) {
      console.error('Error checking users table:', err);
    }
    
    client.release();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } finally {
    await pool.end();
  }
}

testConnection(); 