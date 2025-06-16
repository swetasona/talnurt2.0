const { exec } = require('child_process');

console.log('Attempting to restart the server...');

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

// Kill all Node.js processes and restart the server
async function restartServer() {
  try {
    // For Windows, use taskkill to kill Node.js processes
    if (process.platform === 'win32') {
      console.log('Detected Windows platform');
      
      try {
        // Kill all Node.js processes
        console.log('Killing all Node.js processes...');
        await executeCommand('taskkill /F /IM node.exe');
      } catch (error) {
        console.log('No Node.js processes to kill or error occurred');
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start the server in a new process
      console.log('Starting the server...');
      const child = exec('cd .. && npm run dev', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error starting server: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Server stderr: ${stderr}`);
        }
        console.log(`Server stdout: ${stdout}`);
      });
      
      // Detach the child process
      child.unref();
      
      console.log('Server has been restarted');
    } else {
      // For Linux/Mac, use pkill
      console.log('Detected Unix-like platform');
      
      try {
        // Kill all Node.js processes
        console.log('Killing all Node.js processes...');
        await executeCommand('pkill -f node');
      } catch (error) {
        console.log('No Node.js processes to kill or error occurred');
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start the server in a new process
      console.log('Starting the server...');
      const child = exec('cd .. && npm run dev', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error starting server: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Server stderr: ${stderr}`);
        }
        console.log(`Server stdout: ${stdout}`);
      });
      
      // Detach the child process
      child.unref();
      
      console.log('Server has been restarted');
    }
    
    console.log('Server restart completed successfully');
  } catch (error) {
    console.error('Failed to restart server:', error);
  }
}

restartServer()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 