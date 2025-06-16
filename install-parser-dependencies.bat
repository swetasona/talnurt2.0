@echo off
echo ===============================================
echo    Installing DeepSeek Resume Parser Dependencies
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
echo    Setup Complete
echo ===============================================
echo.
echo The DeepSeek Resume Parser dependencies have been installed.
echo Key dependencies installed:
echo - PyPDF2 (PDF parsing)
echo - python-docx (Word document parsing)
echo - pytesseract (OCR capabilities)
echo - pdf2image (PDF to image conversion)
echo.
echo You may need to restart your application for the changes to take effect.
echo.

:end
pause 