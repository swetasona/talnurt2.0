#!/bin/bash

echo "===== Setting up Nginx as reverse proxy ====="

# Install Nginx if not already installed
echo "Installing Nginx..."
sudo apt update
sudo apt install -y nginx

# Create Nginx configuration file
echo "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/recruitment-portal << EOL
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
EOL

# Enable the site
echo "Enabling the site..."
sudo ln -sf /etc/nginx/sites-available/recruitment-portal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Display completion message
echo "===== Nginx setup complete! ====="
echo "Your application should now be accessible at:"
echo "http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "To install SSL certificate, run:"
echo "sudo apt install -y certbot python3-certbot-nginx"
echo "sudo certbot --nginx" 