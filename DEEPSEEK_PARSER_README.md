# DeepSeek Resume Parser with OpenRouter API Integration

This module provides an AI-powered resume parsing capability using DeepSeek's models via the OpenRouter API. It extracts detailed structured information from resumes in various formats (PDF, DOCX, TXT).

## Free API Access via OpenRouter

The parser now uses OpenRouter's API to access DeepSeek models:
- Uses the free tier of DeepSeek V3 through OpenRouter
- No credits required for basic usage
- Eliminates the need for powerful GPU hardware
- Reduces dependency issues
- Speeds up processing time
- Provides reliable access to state-of-the-art AI models

## Features

- **Advanced AI Analysis**: Uses DeepSeek's powerful V3 model via the OpenRouter API
- **Robust Text Extraction**: Multiple fallback mechanisms for extracting text from PDFs and other documents
- **Comprehensive Profile Information**: Extracts personal details, work experience, education, skills, and more
- **Structured Output**: Returns data in a consistent JSON format for easy integration

## Required Setup

### 1. Get an OpenRouter API Token
1. Create an OpenRouter account at https://openrouter.ai
2. Generate an API token at https://openrouter.ai/keys

### 2. Set Up Your Environment
#### Using the Batch File (Recommended)
1. Run `set-openrouter-token.bat` in the project root directory
2. Enter your OpenRouter API token when prompted
3. The script will set both a temporary session variable and a permanent environment variable

#### System-wide Environment Variable (Alternative Method)
1. Search for "Environment Variables" in Windows
2. Click "Edit the system environment variables"
3. In the System Properties window, click "Environment Variables"
4. Under "User variables" or "System variables", click "New"
5. Variable name: `OPENROUTER_API_TOKEN`
6. Variable value: Your API token from OpenRouter
7. Click "OK" to close all dialogs

## Dependencies

The following dependencies are still required for the text extraction portion:
- Python 3.8 or higher
- PyPDF2, python-docx
- Requests (for API calls)

Optional for OCR functionality:
- pdf2image
- pytesseract
- Tesseract OCR (external program)
- Poppler utilities (external program)

## Usage

### Command Line

```bash
python python/deepseek_resume_parser.py path/to/resume.pdf
```

This will output the parsed resume data in JSON format to the console.

### API Integration

The resume parser is integrated into the application via the `/api/deepseek-resume-parser` endpoint.

Example POST request:
```
POST /api/deepseek-resume-parser
Content-Type: multipart/form-data

Form data:
  - resume: [resume file upload]
```

## Response Format

The parser returns a JSON response with structured information including:
- Personal details (name, email, phone, links)
- Work experience with responsibilities and achievements 
- Education history
- Skills (categorized into technical, soft, languages, tools)
- Career highlights and insights
- Additional sections (certifications, projects, publications, etc.)

## Troubleshooting

If you encounter an error about missing the OpenRouter API token, make sure:
1. You have obtained a valid API token from OpenRouter
2. The token is properly set in your environment
3. You have internet connectivity to reach the OpenRouter API

If you see an "Insufficient Balance" or rate limiting error:
1. Your OpenRouter API token might be hitting usage limits
2. Try again later as the free tier has rate limitations
3. Consider upgrading your OpenRouter account if you need higher usage limits

For OCR functionality issues, ensure Tesseract OCR and Poppler are correctly installed and on your system PATH.

## License

This module uses the DeepSeek model which is subject to its own license terms. Please refer to DeepSeek's documentation for usage restrictions. 