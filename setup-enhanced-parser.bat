@echo off
echo Installing Enhanced Resume Parser Dependencies...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed! Please install Python 3.8+ and try again.
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "python\venv" (
    echo Creating virtual environment...
    python -m venv python\venv
)

REM Activate the virtual environment
call python\venv\Scripts\activate

REM Install required packages
echo Installing Python dependencies...
pip install --upgrade pip
pip install torch transformers pdfplumber python-docx nltk

REM Download required NLTK data
echo Downloading NLTK data...
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

REM Check if the enhanced parser script exists, copy from template if it doesn't
if not exist "python\enhanced_resume_parser.py" (
    echo Creating enhanced resume parser script...
    copy python\resume_parser_transformer.py python\enhanced_resume_parser.py
)

echo.
echo Enhanced Resume Parser setup complete!
echo.
echo To use the parser, visit: http://localhost:3000/enhanced-resume-parser
echo.

REM Deactivate the virtual environment
deactivate 