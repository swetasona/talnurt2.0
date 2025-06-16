#!/bin/bash

# Load environment variables from .env.production
if [ -f .env.production ]; then
  export $(grep -v '^#' .env.production | xargs)
fi

# Start the application with PM2
pm2 stop talnurt 2>/dev/null || true
pm2 delete talnurt 2>/dev/null || true
pm2 start npm --name "talnurt" -- start
pm2 save 