const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Load environment variables
  require('dotenv').config();

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected to database');

    try {
      // Read the migration file
      const migrationPath = path.join(__dirname, 'migrations', 'add_candidate_relationships.sql');
      const sql = fs.readFileSync(migrationPath, 'utf8');

      console.log('Running migration...');
      await client.query(sql);
      console.log('Migration completed successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await pool.end();
  }
}

runMigration(); 