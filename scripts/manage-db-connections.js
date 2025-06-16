// This script helps manage database connections
// It can be run periodically to check for and clean up zombie connections

const { Pool } = require('pg');

// Create a new connection pool for database management
// This should use a different connection than the main application
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:12345678@localhost:5432/postgres',
  max: 1 // Only need one connection for management
});

async function checkAndCleanConnections() {
  console.log('Checking database connections...');
  
  try {
    // Get a client from the pool
    const client = await pool.connect();
    
    try {
      // Query active connections
      const result = await client.query(`
        SELECT pid, usename, application_name, client_addr, 
               backend_start, state, query_start, state_change
        FROM pg_stat_activity 
        WHERE datname = current_database()
        AND pid <> pg_backend_pid()
        ORDER BY backend_start DESC;
      `);
      
      console.log(`Found ${result.rows.length} active connections:`);
      
      // Log connection details
      result.rows.forEach((conn, index) => {
        console.log(`Connection ${index + 1}:`);
        console.log(`  PID: ${conn.pid}`);
        console.log(`  User: ${conn.usename}`);
        console.log(`  App: ${conn.application_name || 'N/A'}`);
        console.log(`  Started: ${conn.backend_start}`);
        console.log(`  State: ${conn.state}`);
        console.log(`  Query started: ${conn.query_start || 'N/A'}`);
        console.log(`  Last state change: ${conn.state_change || 'N/A'}`);
        console.log('---');
      });
      
      // Identify idle connections that have been open for too long
      const idleConnections = result.rows.filter(conn => {
        // Find connections that are idle and have been idle for more than 10 minutes
        if (conn.state === 'idle' && conn.state_change) {
          const idleTime = new Date() - new Date(conn.state_change);
          const idleMinutes = idleTime / (1000 * 60);
          return idleMinutes > 10; // Idle for more than 10 minutes
        }
        return false;
      });
      
      console.log(`Found ${idleConnections.length} idle connections to terminate.`);
      
      // Terminate idle connections
      for (const conn of idleConnections) {
        console.log(`Terminating connection with PID ${conn.pid}...`);
        await client.query(`SELECT pg_terminate_backend(${conn.pid})`);
      }
      
      // Force terminate all connections if there are too many
      if (result.rows.length > 50) {
        console.log('Too many connections detected. Performing emergency cleanup...');
        
        // Terminate all idle connections
        const allIdleConnections = result.rows.filter(conn => conn.state === 'idle');
        console.log(`Terminating ${allIdleConnections.length} idle connections...`);
        
        for (const conn of allIdleConnections) {
          console.log(`Terminating connection with PID ${conn.pid}...`);
          await client.query(`SELECT pg_terminate_backend(${conn.pid})`);
        }
      }
      
      console.log('Connection cleanup complete.');
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error checking connections:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
checkAndCleanConnections()
  .then(() => console.log('Done.'))
  .catch(e => console.error(e)); 