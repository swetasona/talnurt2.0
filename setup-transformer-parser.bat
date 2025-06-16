@echo off
echo Setting up Transformer-based Resume Parser...
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8 or higher and try again.
    exit /b 1
)

REM Create Python virtual environment if it doesn't exist
if not exist python\venv (
    echo Creating Python virtual environment...
    cd python
    python -m venv venv
    cd ..
)

REM Activate virtual environment and install dependencies
echo Installing dependencies...
call python\venv\Scripts\activate.bat
cd python
pip install -r requirements.txt
cd ..

REM Set environment variables for the parser
set PARSER_TYPE=transformer
set PARSER_SCRIPT=python\resume_parser_transformer.py

echo.
echo Transformer-based Resume Parser setup complete!
echo.
echo The setup will download two transformer models:
echo 1. BERT-NER model for named entity recognition
echo 2. BART-Resume-Parser for resume section extraction
echo.
echo The first run will take longer as it downloads these models.
echo.
echo To use the parser, restart your application or run: node test-transformer-parser.js
echo. 