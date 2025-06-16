# Python Resume Parser

This is a Python-based resume parser that extracts structured data from PDF and DOCX resume files. It's designed to work with the TalNurt recruitment portal application.

## Features

- Extracts personal information (name, email, phone)
- Identifies skills and technical competencies
- Parses education history
- Extracts work experience details
- Supports PDF and DOCX file formats
- Returns structured JSON data

## Requirements

- Python 3.6+
- PyPDF2 (for PDF parsing)
- python-docx (for DOCX parsing)

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Or on Windows, run the provided installation script:

```
install_dependencies.bat
```

## Usage

### Command Line

You can use the parser directly from the command line:

```bash
python resume_parser.py path/to/resume.pdf
```

The script will output JSON-formatted data containing the extracted information.

### Integration with Next.js

The parser is integrated with the Next.js application through the `/api/python-parse-resume` endpoint. The endpoint handles file uploads, calls the Python parser, and returns the structured data.

## Testing

A sample resume text file is included for testing purposes:

```bash
python resume_parser.py sample_resume.txt
```

## Customization

You can customize the parser by modifying the extraction functions in `resume_parser.py`:

- `extract_name()`: Modify name extraction logic
- `extract_skills()`: Adjust skill identification patterns
- `extract_education()`: Customize education parsing
- `extract_experience()`: Refine experience extraction

## Troubleshooting

If you encounter issues:

1. Ensure Python 3.6+ is installed and in your PATH
2. Verify all dependencies are installed correctly
3. Check file permissions (the parser needs read access to the resume files)
4. For PDF parsing issues, ensure the PDF is not encrypted or password-protected

## Resume Parser - Transformer Models

This directory contains the Python scripts used for parsing resumes using transformer models from Hugging Face.

## Fixing Slow Resume Parsing

If the resume parsing is taking a long time, here are some solutions:

### First-Time Loading

The first time you parse a resume, the system needs to download the transformer models from Hugging Face, which can take a few minutes. These models are large (several GB) and require a good internet connection. 

**Solution**: The models are now cached locally after the first use, so subsequent parses will be much faster.

### Model Loading Speed

The parsing uses two transformer models:
- `dslim/bert-base-NER` - For named entity recognition (names, email, phone)
- `ml6team/bart-large-resume-parser` - For document structure parsing

**Solutions**:
1. Run the `setup.bat` script to preload and cache the models
2. Make sure your system has adequate RAM (at least 8GB recommended)
3. If you have a CUDA-compatible GPU, it will be used automatically to speed up processing

### Dependencies

Ensure all dependencies are properly installed.

**Solution**: Run `setup.bat` or manually install the required packages:
```
pip install -r requirements.txt
```

## Troubleshooting

1. **"Parser execution timed out"**: This occurs if parsing takes longer than 2 minutes. This could be due to:
   - Very complex resume formatting
   - Initial model download taking too long
   - System resource limitations

2. **"No module named X"**: This means a Python dependency is missing.
   - Run `setup.bat` to install all dependencies

3. **"Failed to load model"**: This could be due to network issues or Hugging Face API limitations.
   - Check your internet connection
   - Try again later (there may be rate limits on Hugging Face's servers)

## Checking System Compatibility

Run the diagnostic script to check if your system is properly configured:
```
python check_dependencies.py
```

This will:
- Check all required Python modules
- Verify model loading capability
- Set up the model cache directory

## Performance Improvements

The latest version includes:
- Model caching to reduce load times after first use
- Fallback to simpler extraction methods if models fail to load
- Better error handling and timeouts to prevent hanging
- UI improvements to show processing status and time

If you consistently face slow parsing, consider using a simpler resume format or a machine with better specs. 