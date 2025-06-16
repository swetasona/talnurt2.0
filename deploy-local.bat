@echo off
echo ===== Starting local deployment =====

:: Install dependencies
echo Installing dependencies...
call npm install

:: Build the application
echo Building the application...
call npm run build

:: Start the application
echo Starting the application...
call npm run start

echo ===== Local deployment complete! =====
echo Your application is running at: http://localhost:3000 