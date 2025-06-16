#!/bin/bash

echo "===== Talnurt Recruitment Portal Monitoring ====="

# Check if PM2 is running the application
echo "Checking PM2 status..."
pm2 status

# Display system resources
echo -e "\n===== System Resources ====="
echo "Memory Usage:"
free -h

echo -e "\nDisk Usage:"
df -h

echo -e "\nCPU Usage:"
top -bn1 | head -20

# Check PostgreSQL status
echo -e "\n===== Database Status ====="
sudo systemctl status postgresql | grep Active

# Check if the application is accessible
echo -e "\n===== Application Accessibility ====="
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP:3000)
echo "HTTP Status Code: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  echo "Application is accessible"
else
  echo "Application is NOT accessible"
  echo "Checking logs..."
  pm2 logs recruitment-portal --lines 20
fi

echo -e "\n===== Recent Errors ====="
pm2 logs recruitment-portal --lines 10 --err

echo -e "\n===== Monitoring Complete =====" 