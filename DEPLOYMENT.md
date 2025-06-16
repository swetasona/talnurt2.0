# Deployment Guide for Talnurt Recruitment Portal

This guide provides instructions for deploying the Talnurt Recruitment Portal in both local and AWS EC2 environments.

## Local Deployment

### Prerequisites
- Node.js 14.x or higher
- npm or yarn
- PostgreSQL database

### Steps

1. **Clone the repository**:
   ```
   git clone https://github.com/your-username/recruitment-portal.git
   cd recruitment-portal
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file with the following content:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/talnurt_db?schema=public
   NEXTAUTH_SECRET=your-secure-random-string
   NEXTAUTH_URL=http://localhost:3000
   JWT_SECRET=your-secure-jwt-secret
   NODE_ENV=development
   ```

4. **Set up the database**:
   - Create a PostgreSQL database
   - Run the schema.sql file to set up tables:
     ```
     psql -U username -d talnurt_db -f schema.sql
     ```

5. **Generate Prisma client**:
   ```
   npx prisma generate
   ```

6. **Build and start the application**:
   ```
   npm run build
   npm run start
   ```
   
   For development mode:
   ```
   npm run dev
   ```

7. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## AWS EC2 Deployment

### Prerequisites
- AWS account with EC2 access
- t2.micro instance (free tier eligible)
- Ubuntu Server 22.04 LTS

### Steps

1. **Launch an EC2 instance**:
   - Choose Amazon Linux 2023 or Ubuntu Server 22.04
   - Configure security groups to allow:
     - SSH (port 22)
     - HTTP (port 80)
     - HTTPS (port 443)
     - Custom TCP (port 3000)

2. **Connect to your EC2 instance**:
   ```
   ssh -i your-key.pem ubuntu@your-ec2-public-dns
   ```

3. **Install dependencies**:
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Install essential tools
   sudo apt install -y build-essential git curl wget
   
   # Install Node.js and npm
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib
   
   # Install Nginx
   sudo apt install -y nginx
   ```

4. **Configure PostgreSQL**:
   ```bash
   # Start PostgreSQL service
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   
   # Switch to postgres user
   sudo -i -u postgres
   
   # Create database and user
   psql
   CREATE DATABASE talnurt_db;
   CREATE USER talnurt_user WITH ENCRYPTED PASSWORD 'your_strong_password';
   GRANT ALL PRIVILEGES ON DATABASE talnurt_db TO talnurt_user;
   ALTER USER talnurt_user WITH SUPERUSER;
   \q
   exit
   ```

5. **Clone and configure the application**:
   ```bash
   # Clone repository
   cd ~
   git clone https://github.com/your-username/recruitment-portal.git
   cd recruitment-portal
   
   # Install dependencies
   npm install
   
   # Create .env.local file
   cat > .env.local << EOL
   DATABASE_URL=postgresql://talnurt_user:your_strong_password@localhost:5432/talnurt_db?schema=public
   NEXTAUTH_SECRET=your-secure-random-string
   NEXTAUTH_URL=http://your-ec2-public-ip:3000
   JWT_SECRET=your-secure-jwt-secret
   NODE_ENV=production
   EOL
   ```

6. **Set up the database schema**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Apply database schema
   psql -U talnurt_user -d talnurt_db -f schema.sql
   ```

7. **Build and start the application**:
   ```bash
   # Build the application
   npm run build
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Start the application with PM2
   pm2 start npm --name "recruitment-portal" -- start
   
   # Set PM2 to start on boot
   pm2 startup
   # Follow the instructions from the output
   pm2 save
   ```

8. **Configure Nginx as a reverse proxy**:
   ```bash
   # Create Nginx configuration file
   sudo nano /etc/nginx/sites-available/recruitment-portal
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name _;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   
       # Enable compression
       gzip on;
       gzip_comp_level 5;
       gzip_min_length 256;
       gzip_proxied any;
       gzip_types application/javascript application/json text/css text/plain text/xml;
   
       # Add basic caching
       location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
           expires 7d;
           add_header Cache-Control "public, max-age=604800";
       }
   
       # Increase client body size for file uploads
       client_max_body_size 10M;
   }
   ```
   
   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/recruitment-portal /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Set up SSL with Certbot (Optional)**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx
   ```

10. **Access your application**:
    Your application should now be accessible at:
    - http://your-ec2-public-ip (via Nginx)
    - http://your-ec2-public-ip:3000 (direct access)

## Deployment Scripts

For convenience, this repository includes several deployment scripts:

- `fix-deployment.sh`: Fixes common deployment issues on EC2
- `monitor-app.sh`: Monitors the application status on EC2
- `nginx-config.sh`: Sets up Nginx as a reverse proxy
- `deploy-local.bat`: Deploys the application locally on Windows

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check database credentials in `.env.local`
   - Ensure the database and user exist

2. **Application not starting**:
   - Check logs with `pm2 logs recruitment-portal`
   - Verify Node.js version with `node -v`
   - Check for port conflicts: `sudo lsof -i :3000`

3. **Cannot access the application**:
   - Verify security group settings in AWS console
   - Check Nginx configuration: `sudo nginx -t`
   - Ensure the application is running: `pm2 status`

### Monitoring

To monitor your application on EC2:
```bash
pm2 status
pm2 logs recruitment-portal
```

### Updating the Application

To update the application after code changes:
```bash
git pull
npm install
npm run build
pm2 restart recruitment-portal
``` 