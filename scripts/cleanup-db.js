const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:12345678@localhost:5432/postgres',
  max: 1 // Only need one connection for management
});

async function cleanupDatabaseConnections() {
  console.log('Starting database connection cleanup...');
  
  let client;
  try {
    // Get a client from the pool
    client = await pool.connect();
    console.log('Connected to database for cleanup');
    
    // Get current connection count
    const countResult = await client.query(`
      SELECT count(*) as connection_count
      FROM pg_stat_activity
      WHERE datname = current_database()
      AND pid <> pg_backend_pid();
    `);
    
    const connectionCount = parseInt(countResult.rows[0].connection_count, 10);
    console.log(`Current database connections: ${connectionCount}`);
    
    if (connectionCount > 20) {
      console.log('Too many connections detected. Performing emergency cleanup...');
      
      // Terminate idle connections
      const idleResult = await client.query(`
        SELECT pid, usename, application_name, state, state_change
        FROM pg_stat_activity
        WHERE datname = current_database()
        AND pid <> pg_backend_pid()
        AND state = 'idle';
      `);
      
      console.log(`Found ${idleResult.rows.length} idle connections to terminate`);
      
      for (const conn of idleResult.rows) {
        console.log(`Terminating idle connection with PID ${conn.pid} (user: ${conn.usename})`);
        await client.query(`SELECT pg_terminate_backend(${conn.pid})`);
      }
    } else {
      // If not too many connections, just terminate long-running idle connections
      const idleResult = await client.query(`
        SELECT pid, usename, application_name, state, state_change
        FROM pg_stat_activity
        WHERE datname = current_database()
        AND pid <> pg_backend_pid()
        AND state = 'idle'
        AND (now() - state_change) > interval '5 minutes';
      `);
      
      console.log(`Found ${idleResult.rows.length} long-running idle connections to terminate`);
      
      for (const conn of idleResult.rows) {
        console.log(`Terminating long-running idle connection with PID ${conn.pid} (user: ${conn.usename})`);
        await client.query(`SELECT pg_terminate_backend(${conn.pid})`);
      }
    }
    
    // Get updated connection count
    const updatedCountResult = await client.query(`
      SELECT count(*) as connection_count
      FROM pg_stat_activity
      WHERE datname = current_database()
      AND pid <> pg_backend_pid();
    `);
    
    const updatedConnectionCount = parseInt(updatedCountResult.rows[0].connection_count, 10);
    console.log(`Connection count after cleanup: ${updatedConnectionCount}`);
    
    console.log('Database connection cleanup completed successfully');
  } catch (error) {
    console.error('Error during database connection cleanup:', error);
  } finally {
    if (client) {
      console.log('Releasing cleanup client');
      client.release();
    }
    await pool.end();
  }
}

cleanupDatabaseConnections()
  .then(() => {
    console.log('Cleanup script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Cleanup script failed:', err);
    process.exit(1);
  }); 