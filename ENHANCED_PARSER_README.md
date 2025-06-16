# Enhanced AI Resume Parser

The Enhanced AI Resume Parser is a feature that allows you to upload and analyze resumes in PDF or DOCX format. It extracts detailed structured information about candidates using advanced AI models.

## Features

- **Detailed Personal Information**: Extracts name, email, phone, LinkedIn, GitHub, and other contact information.
- **Categorized Skills**: Automatically categorizes skills into technical, soft, languages, and tools.
- **Work Experience Analysis**: Extracts job titles, companies, dates, responsibilities, and achievements.
- **Education Details**: Parses degrees, institutions, dates, and educational descriptions.
- **Career Insights**: Estimates years of experience, highest education level, and career level.
- **Additional Sections**: Identifies projects, certifications, publications, awards, and interests.

## Setup

### Prerequisites

- Node.js (>= 14)
- Python (>= 3.8)
- Windows, macOS, or Linux

### Installation

1. Run the setup script to install dependencies:

   ```bash
   # Windows
   setup-enhanced-parser.bat
   
   # macOS/Linux
   bash setup-enhanced-parser.sh
   ```

2. Start the Next.js development server:

   ```bash
   npm run dev
   ```

3. Access the enhanced resume parser at:

   ```
   http://localhost:3000/enhanced-resume-parser
   ```

## How it Works

The enhanced resume parser uses a combination of AI models:

1. **Document Text Extraction**: Extracts text from PDF and DOCX files.
2. **Transformer-based Parsing**: Uses pre-trained BART models from Hugging Face to extract structured information.
3. **Named Entity Recognition**: Identifies names, organizations, and locations.
4. **Custom Extractors**: Applies regex-based extraction for contact information, dates, and other details.
5. **Skill Categorization**: Categorizes skills using pre-defined dictionaries and natural language processing.

## Technical Implementation

### Components

1. **Python Backend**:
   - `enhanced_resume_parser.py`: Main parser script that extracts detailed information
   - Uses HuggingFace's transformers, NLTK, and custom extraction logic

2. **Next.js API**:
   - `resume-parser.ts`: API endpoint that handles file upload and parsing
   - Communicates with the Python backend to process the resume

3. **React Frontend**:
   - `enhanced-resume-parser.js`: Page component with file upload UI
   - `EnhancedResumeParserResult.jsx`: Result display component with rich UI

### Data Flow

1. User uploads a resume (PDF/DOCX) through the UI
2. File is saved in the `uploads` directory
3. API calls the Python parser script with the file path
4. Python script extracts and structures the information
5. Structured data is returned as JSON to the frontend
6. Frontend displays the parsed information in a user-friendly format

## Extending the Parser

### Adding New Skill Categories

Edit the `parse_skills` function in `enhanced_resume_parser.py`:

```python
# Add new category
cybersecurity_skills = {
    'penetration testing', 'vulnerability assessment', 'security auditing',
    # Add more skills...
}

# Add to found_skills
found_skills = {
    # Existing categories...
    "cybersecurity": set()
}

# Update return value
return {
    # Existing categories...
    "cybersecurity": sorted(list(found_skills["cybersecurity"]))
}
```

### Adding New Section Recognition

Edit the `extract_sections_fallback` function:

```python
section_patterns = {
    # Existing sections...
    'patents': [
        r'patents', r'patent\s+applications', r'inventions'
    ]
}
```

## Troubleshooting

- **Parser Returns Empty Results**: Try with a simpler resume format or check if the PDF contains actual text (not just images).
- **Long Processing Times**: First-time parsing may take longer as AI models need to be downloaded and cached.
- **Missing Information**: Some resumes may not have all sections or information might be in a format the parser can't recognize.

## License

This project is licensed under the MIT License. 