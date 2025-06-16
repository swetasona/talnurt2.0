const { exec } = require('child_process');

console.log('Attempting to restart PostgreSQL server...');

// Function to execute a command and return a promise
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Restart the PostgreSQL server
async function restartPostgres() {
  try {
    // For Windows, we'll use the PostgreSQL service
    if (process.platform === 'win32') {
      console.log('Detected Windows platform');
      
      // Stop the PostgreSQL service
      console.log('Stopping PostgreSQL service...');
      await executeCommand('net stop postgresql');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Start the PostgreSQL service
      console.log('Starting PostgreSQL service...');
      await executeCommand('net start postgresql');
      
      console.log('PostgreSQL service has been restarted');
    } else {
      // For Linux/Mac, we'll use pg_ctl
      console.log('Detected Unix-like platform');
      
      // Get PostgreSQL data directory
      const pgDataDir = process.env.PGDATA || '/var/lib/postgresql/data';
      
      // Stop PostgreSQL
      console.log('Stopping PostgreSQL...');
      await executeCommand(`pg_ctl -D "${pgDataDir}" stop -m fast`);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start PostgreSQL
      console.log('Starting PostgreSQL...');
      await executeCommand(`pg_ctl -D "${pgDataDir}" start`);
      
      console.log('PostgreSQL has been restarted');
    }
    
    console.log('PostgreSQL restart completed successfully');
  } catch (error) {
    console.error('Failed to restart PostgreSQL:', error);
  }
}

restartPostgres()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 