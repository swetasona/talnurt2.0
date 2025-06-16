# Transformer-based Resume Parser

This module uses state-of-the-art transformer models to extract structured information from resumes with high accuracy.

## Features

- Uses **BERT-NER** for entity extraction (name, phone, email)
- Uses **BART Resume Parser** for document segmentation and section extraction
- Supports PDF and DOCX files
- Provides structured data output in JSON format
- Handles multiple education and experience entries

## Models Used

1. **dslim/bert-base-NER**
   - Specialized in Named Entity Recognition
   - Used to extract personal information like names and contact details

2. **ml6team/bart-large-resume-parser**
   - Fine-tuned BART model for resume parsing
   - Extracts structured sections (education, experience, skills)

## Prerequisites

1. Python 3.8+ installed
2. Required packages:
   - transformers
   - torch
   - pdfplumber
   - python-docx

## Setup

1. Install required Python packages:
   ```
   pip install -r requirements.txt
   ```

2. First run will download the model files (approximately 1.5GB total)

## Usage

### Command Line

```
python resume_parser_transformer.py path/to/resume.pdf
```

The parser will output JSON data with the extracted information.

### Batch Script

For Windows users, use the provided batch script:

```
test_transformer_parser.bat path/to/resume.pdf
```

### JavaScript Integration

For Node.js integration, use the provided JavaScript wrapper:

```javascript
const { parseResume } = require('./test-transformer-parser');

async function processResume(filePath) {
  const result = await parseResume(filePath);
  console.log(result);
}
```

## Data Structure

The parser outputs JSON with the following structure:

```json
{
  "name": "John Doe",
  "phone": "+1-234-567-8901",
  "email": "john.doe@example.com",
  "skills": ["JavaScript", "Python", "React", "Node.js"],
  "education": [
    {
      "date": "2015-2019",
      "description": "Bachelor of Science in Computer Science",
      "institution": "Stanford University"
    }
  ],
  "experience": [
    {
      "date": "2019-Present",
      "position": "Software Engineer",
      "company": "Google",
      "description": "Developing web applications using React and Node.js"
    }
  ],
  "success": true
}
```

## Implementation Details

### Text Extraction

- PDFs are processed using `pdfplumber` for better text extraction with layout
- DOCX files are processed using `python-docx`

### Entity Recognition

The BERT-NER model identifies:
- Person names (PER entity type)
- Email addresses
- Phone numbers

### Section Extraction

The BART model structures the resume into sections:
- Education history
- Work experience
- Skills

### Fallback Mechanisms

- Regex-based extraction as fallback when model results are incomplete
- Special case handling for common resume patterns
- Auto-detection of multiple entries in education and experience sections 