#!/bin/bash

echo "===== Starting deployment fixes ====="

# Navigate to the project directory
cd ~/talnurt2.0

# 1. Fix react-quill dependency
echo "Fixing react-quill dependency..."
npm install --save react-quill@2.0.0 quill@1.3.7

# 2. Update environment variables for production
echo "Updating environment variables..."
cat > .env.local << EOL
DATABASE_URL=postgresql://talnurt_user:Y8F-qf%f*VuTpkh@localhost:5432/talnurt_db?schema=public
NEXTAUTH_SECRET=talnurt-secure-nextauth-secret-key
NEXTAUTH_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000
JWT_SECRET=talnurt-secure-jwt-secret-key
NODE_ENV=production
EOL

# 3. Kill any existing Node.js processes
echo "Killing any existing Node.js processes..."
pkill -f node || true

# 4. Build the application
echo "Building the application..."
npm run build

# 5. Install PM2 globally if not already installed
echo "Setting up PM2..."
npm install -g pm2

# 6. Start the application with PM2
echo "Starting the application with PM2..."
pm2 delete recruitment-portal || true
pm2 start npm --name "recruitment-portal" -- start

# 7. Set up PM2 to start on boot
echo "Setting up PM2 startup..."
pm2 save
pm2 startup | tail -n 1 > ~/pm2-startup-command.txt
echo "Run the command in ~/pm2-startup-command.txt to enable PM2 on startup"

# 8. Display application URL
echo "===== Deployment complete! ====="
echo "Your application should now be running at:"
echo "http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo ""
echo "To monitor your application, use: pm2 status"
echo "To view logs, use: pm2 logs recruitment-portal" 