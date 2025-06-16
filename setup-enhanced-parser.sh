#!/bin/bash

echo "Installing Enhanced Resume Parser Dependencies..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python is not installed! Please install Python 3.8+ and try again."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "python/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv python/venv
fi

# Activate the virtual environment
source python/venv/bin/activate

# Install required packages
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install torch transformers pdfplumber python-docx nltk

# Download required NLTK data
echo "Downloading NLTK data..."
python3 -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

# Check if the enhanced parser script exists, copy from template if it doesn't
if [ ! -f "python/enhanced_resume_parser.py" ]; then
    echo "Creating enhanced resume parser script..."
    cp python/resume_parser_transformer.py python/enhanced_resume_parser.py
fi

echo
echo "Enhanced Resume Parser setup complete!"
echo
echo "To use the parser, visit: http://localhost:3000/enhanced-resume-parser"
echo

# Deactivate the virtual environment
deactivate

# Make the script executable
chmod +x setup-enhanced-parser.sh 