#!/bin/bash

# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
fi

# Install PostgreSQL if not already installed
if ! command -v psql &> /dev/null; then
  sudo apt install -y postgresql postgresql-contrib
  
  # Start and enable PostgreSQL
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
  
  # Set up PostgreSQL user and password
  sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '12345678';"
fi

# Install Nginx if not already installed
if ! command -v nginx &> /dev/null; then
  sudo apt install -y nginx
  
  # Configure Nginx
  sudo tee /etc/nginx/sites-available/talnurt > /dev/null << 'NGINX_CONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONF

  # Enable the site
  sudo ln -sf /etc/nginx/sites-available/talnurt /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  
  # Test and restart Nginx
  sudo nginx -t && sudo systemctl restart nginx
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# Set up the application
npm install
npm run build

# Start the application
./start.sh

# Set up PM2 to start on system boot
pm2 startup 