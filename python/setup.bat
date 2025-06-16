@echo off
echo Setting up Python environment for Resume Parser...

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH. Please install Python 3.7+ and try again.
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
) else (
    echo Virtual environment already exists.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install required packages
echo Installing required packages...
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers pdfplumber python-docx

REM Install packages from requirements.txt if it exists
if exist requirements.txt (
    echo Installing packages from requirements.txt...
    pip install -r requirements.txt
)

REM Check if package installation was successful
python check_dependencies.py
if %ERRORLEVEL% NEQ 0 (
    echo Some dependencies might be missing. Please check the error messages above.
    echo You may need to run this script as administrator.
) else (
    echo All dependencies are installed correctly.
)

REM Create model cache directory if it doesn't exist
if not exist model_cache (
    echo Creating model cache directory...
    mkdir model_cache
)

echo.
echo Setup completed. You can now use the resume parser.
echo Run test_transformer_parser.bat to test the parser.

pause 