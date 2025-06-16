@echo off
echo ===============================================
echo    Installing DeepSeek Resume Parser
echo ===============================================
echo.
echo This script will install the necessary Python dependencies
echo for the DeepSeek Resume Parser.
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Error: Python is not installed or not in PATH.
  echo Please install Python 3.8 or higher and try again.
  goto :end
)

echo Installing dependencies...
python -m pip install --upgrade pip
python -m pip install -r python/requirements.txt

echo.
echo ===============================================
echo    Setup OpenRouter API Token
echo ===============================================
echo.
echo You need an OpenRouter API token to use the DeepSeek Resume Parser.
echo You can get a free token from https://openrouter.ai/keys
echo.
echo Would you like to set up your OpenRouter API token now? (Y/N)
set /p SETUP_TOKEN="> "

if /i "%SETUP_TOKEN%"=="Y" (
  call set-openrouter-token.bat
) else (
  echo.
  echo You can set up your API token later by running set-openrouter-token.bat
  echo.
)

echo.
echo Installation complete!
echo.
echo The DeepSeek Resume Parser should now be ready to use.
echo.

:end
pause 