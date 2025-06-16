@echo off
echo Setting up DeepSeek Resume Parser...

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if pip is installed
pip --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo pip is not installed or not in PATH
    echo Please ensure pip is installed with Python
    pause
    exit /b 1
)

echo Creating Python virtual environment...
python -m venv python\venv

echo Activating virtual environment...
call python\venv\Scripts\activate.bat

echo Installing dependencies...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -r python\requirements.txt
pip install transformers accelerate bitsandbytes sentencepiece

echo Installation complete.
echo To use the DeepSeek-based parser, run:
echo python python\deepseek_resume_parser.py [path_to_resume_file]

pause 