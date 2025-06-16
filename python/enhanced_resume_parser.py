#!/usr/bin/env python3
import os
import sys
import json
import re
import traceback
import time
import string
import unicodedata
from typing import Dict, List, Any, Tuple, Optional, Set
from datetime import datetime

# Global variables to cache models
NER_PIPELINE = None
RESUME_MODEL = None
RESUME_TOKENIZER = None
MODEL_LOAD_TIMEOUT = 60  # seconds

# Import necessary libraries
try:
    import torch
    import pdfplumber
    import docx
    from transformers import AutoTokenizer, AutoModelForTokenClassification, AutoModelForSeq2SeqLM, pipeline
    import nltk
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords
except ImportError:
    print("Installing required packages...", file=sys.stderr)
    os.system("pip install torch transformers pdfplumber python-docx nltk")
    import torch
    import pdfplumber
    import docx
    from transformers import AutoTokenizer, AutoModelForTokenClassification, AutoModelForSeq2SeqLM, pipeline
    import nltk
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

# Define models
NER_MODEL_NAME = "dslim/bert-base-NER"
RESUME_PARSER_MODEL_NAME = "ml6team/bart-large-resume-parser"

# Check if there's a local cache of the models
LOCAL_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_cache")
os.makedirs(LOCAL_MODEL_DIR, exist_ok=True)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file using pdfplumber."""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text() or ""
                text += extracted
                text += "\n\n"
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}", file=sys.stderr)
        raise
    return text

def extract_text_from_docx(docx_path: str) -> str:
    """Extract text from a DOCX file."""
    text = ""
    try:
        doc = docx.Document(docx_path)
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
    except Exception as e:
        print(f"Error extracting text from DOCX: {str(e)}", file=sys.stderr)
        raise
    return text

def load_ner_model():
    """Load the NER model for entity extraction with timeout."""
    global NER_PIPELINE
    if NER_PIPELINE is not None:
        return NER_PIPELINE
    
    try:
        start_time = time.time()
        # Try to load from local cache if exists
        local_ner_path = os.path.join(LOCAL_MODEL_DIR, "ner_model")
        if os.path.exists(local_ner_path):
            print(f"Loading NER model from local cache: {local_ner_path}", file=sys.stderr)
            tokenizer = AutoTokenizer.from_pretrained(local_ner_path)
            model = AutoModelForTokenClassification.from_pretrained(local_ner_path)
        else:
            print(f"Loading NER model from HuggingFace: {NER_MODEL_NAME}", file=sys.stderr)
            tokenizer = AutoTokenizer.from_pretrained(NER_MODEL_NAME)
            model = AutoModelForTokenClassification.from_pretrained(NER_MODEL_NAME)
            # Save to local cache
            tokenizer.save_pretrained(local_ner_path)
            model.save_pretrained(local_ner_path)
        
        # Check for timeout
        if time.time() - start_time > MODEL_LOAD_TIMEOUT:
            raise TimeoutError(f"Loading NER model timed out after {MODEL_LOAD_TIMEOUT} seconds")
        
        NER_PIPELINE = pipeline("ner", model=model, tokenizer=tokenizer, aggregation_strategy="simple")
        return NER_PIPELINE
    except Exception as e:
        print(f"Error loading NER model: {str(e)}", file=sys.stderr)
        # If model loading fails, use a simpler approach
        print("Falling back to regex-based extraction without NER model", file=sys.stderr)
        NER_PIPELINE = None
        return None

def load_resume_parser_model():
    """Load the BART resume parser model with timeout."""
    global RESUME_MODEL, RESUME_TOKENIZER
    if RESUME_MODEL is not None and RESUME_TOKENIZER is not None:
        return RESUME_MODEL, RESUME_TOKENIZER
    
    try:
        start_time = time.time()
        # Try to load from local cache if exists
        local_bart_path = os.path.join(LOCAL_MODEL_DIR, "bart_model")
        if os.path.exists(local_bart_path):
            print(f"Loading BART model from local cache: {local_bart_path}", file=sys.stderr)
            tokenizer = AutoTokenizer.from_pretrained(local_bart_path)
            model = AutoModelForSeq2SeqLM.from_pretrained(local_bart_path)
        else:
            print(f"Loading BART model from HuggingFace: {RESUME_PARSER_MODEL_NAME}", file=sys.stderr)
            tokenizer = AutoTokenizer.from_pretrained(RESUME_PARSER_MODEL_NAME)
            model = AutoModelForSeq2SeqLM.from_pretrained(RESUME_PARSER_MODEL_NAME)
            # Save to local cache
            tokenizer.save_pretrained(local_bart_path)
            model.save_pretrained(local_bart_path)
        
        # Check for timeout
        if time.time() - start_time > MODEL_LOAD_TIMEOUT:
            raise TimeoutError(f"Loading BART model timed out after {MODEL_LOAD_TIMEOUT} seconds")
        
        RESUME_MODEL = model
        RESUME_TOKENIZER = tokenizer
        return model, tokenizer
    except Exception as e:
        print(f"Error loading BART model: {str(e)}", file=sys.stderr)
        # If model loading fails, return None to trigger fallback
        print("Falling back to regex-based extraction without BART model", file=sys.stderr)
        RESUME_MODEL, RESUME_TOKENIZER = None, None
        return None, None

def extract_entities(text: str, ner_pipeline) -> Dict[str, Any]:
    """Extract named entities from text."""
    # If NER pipeline is not available, use regex-based extraction
    if ner_pipeline is None:
        return extract_entities_with_regex(text)
    
    try:
        results = ner_pipeline(text)
        
        # Extract person names (assuming the first PER entity is the person's name)
        names = [entity["word"] for entity in results if entity["entity_group"] == "PER"]
        
        # Detect organization names for companies and universities
        orgs = [entity["word"] for entity in results if entity["entity_group"] == "ORG"]
        
        # Detect locations
        locations = [entity["word"] for entity in results if entity["entity_group"] == "LOC"]
        
        # If NER model didn't find any names, try regex fallback
        if not names:
            # Try to extract name from the beginning of the resume
            lines = text.split('\n')
            for i in range(min(10, len(lines))):
                line = lines[i].strip()
                if line and len(line) < 50 and not '@' in line and not 'resume' in line.lower() and \
                   not line[0].isdigit() and not line.startswith('http'):
                    names = [line]
                    break
        
        name = names[0] if names else ""
        
        # Extract emails, phones, and more using regex
        regex_results = extract_entities_with_regex(text)
        
        return {
            "name": name,
            "email": regex_results.get("email", ""),
            "phone": regex_results.get("phone", ""),
            "linkedin": regex_results.get("linkedin", ""),
            "github": regex_results.get("github", ""),
            "website": regex_results.get("website", ""),
            "organizations": orgs[:10],  # Limit to top 10
            "locations": locations[:5]   # Limit to top 5
        }
    
    except Exception as e:
        print(f"Error in NER processing: {str(e)}", file=sys.stderr)
        # Fallback to regex if NER processing fails
        return extract_entities_with_regex(text)

def extract_entities_with_regex(text: str) -> Dict[str, str]:
    """Extract entities using regex patterns."""
    # Extract emails
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    email = emails[0] if emails else ""
    
    # Extract phone numbers
    phone_pattern = r'(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})'
    phones = re.findall(phone_pattern, text)
    phone = ''.join(phones[0]) if phones and isinstance(phones[0], tuple) else ""
    
    # Clean up phone number
    if phone:
        # Remove non-digit characters except + for international prefix
        phone = re.sub(r'[^\d+]', '', phone)
    
    # Try to extract name (usually at the beginning of resume)
    name = ""
    lines = text.split('\n')
    for i in range(min(10, len(lines))):
        line = lines[i].strip()
        # Look for a line that's likely to be a name (short, no special chars)
        if line and len(line) < 50 and not '@' in line and not 'resume' in line.lower() and \
            not line[0].isdigit() and not line.startswith('http'):
            name = line
            break
    
    # Extract LinkedIn profile
    linkedin_patterns = [
        r'linkedin\.com/in/([a-zA-Z0-9_-]+)',
        r'linkedin\.com/profile/([a-zA-Z0-9_-]+)'
    ]
    linkedin = ""
    for pattern in linkedin_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            linkedin = f"linkedin.com/in/{matches[0]}"
            break
    
    # Extract GitHub profile
    github_pattern = r'github\.com/([a-zA-Z0-9_-]+)'
    github_matches = re.findall(github_pattern, text, re.IGNORECASE)
    github = f"github.com/{github_matches[0]}" if github_matches else ""
    
    # Extract website/portfolio
    website_patterns = [
        r'https?://(?!linkedin\.com|github\.com)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?)',
        r'(?<!@)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?)'
    ]
    website = ""
    for pattern in website_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            potential_site = matches[0]
            # Filter out common email domains
            if not any(email_domain in potential_site for email_domain in ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']):
                website = potential_site if not potential_site.startswith('http') else potential_site
                break
    
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "github": github,
        "website": website
    }

def clean_date(date_str: str) -> str:
    """Clean and standardize date format."""
    if not date_str:
        return ""
    
    # Remove any unwanted characters
    date_str = re.sub(r'[^\w\s\-\/\.]', '', date_str)
    
    # Common date patterns
    patterns = [
        # Match "Month Year" format
        (r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.,]+(\d{4})', r'\1 \2'),
        # Match "Month Year - Month Year" format
        (r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.,]+(\d{4})[\s\-]+to[\s\-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.,]+(\d{4})', 
         r'\1 \2 - \3 \4'),
        # Match "Month Year - Present" format
        (r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.,]+(\d{4})[\s\-]+to[\s\-]+(Present|Current|Now)', 
         r'\1 \2 - Present'),
        # Match year ranges
        (r'(\d{4})[\s\-]+to[\s\-]+(\d{4})', r'\1 - \2'),
        # Match year to present
        (r'(\d{4})[\s\-]+to[\s\-]+(Present|Current|Now)', r'\1 - Present'),
    ]
    
    for pattern, replacement in patterns:
        if re.search(pattern, date_str, re.IGNORECASE):
            return re.sub(pattern, replacement, date_str, flags=re.IGNORECASE)
    
    return date_str

def parse_education(education_text: str) -> List[Dict[str, str]]:
    """Parse education section into structured data."""
    if not education_text:
        return []
    
    # Split into education entries - look for common degree keywords
    degree_keywords = [
        r'bachelor', r'master', r'phd', r'ph\.d', r'doctorate', r'associate', 
        r'b\.s\.', r'm\.s\.', r'b\.a\.', r'm\.a\.', r'mba', r'm\.b\.a', 
        r'certificate', r'certification', r'diploma'
    ]
    degree_pattern = '|'.join(degree_keywords)
    
    # Split text into paragraphs
    paragraphs = [p.strip() for p in education_text.split('\n\n') if p.strip()]
    if not paragraphs:
        paragraphs = [p.strip() for p in education_text.split('\n') if p.strip()]
    
    education_entries = []
    current_entry = {}
    
    for paragraph in paragraphs:
        # Check if this paragraph contains education information
        if re.search(degree_pattern, paragraph, re.IGNORECASE) or re.search(r'university|college|school|institute', paragraph, re.IGNORECASE):
            if current_entry and 'description' in current_entry:
                education_entries.append(current_entry)
                current_entry = {}
            
            # Extract degree/qualification
            degree_match = re.search(rf'({degree_pattern})[^\n\.]*', paragraph, re.IGNORECASE)
            degree = degree_match.group(0) if degree_match else ""
            
            # Extract institution
            institution_match = re.search(r'(university|college|school|institute)[^\n\.]*', paragraph, re.IGNORECASE)
            institution = institution_match.group(0) if institution_match else ""
            
            # Extract dates
            date_pattern = r'((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.,]+\d{4}|20\d{2}|19\d{2})[\s\-]+(to|[-])[\s\-]+((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.,]+\d{4}|20\d{2}|19\d{2}|Present|Current|Now)'
            date_match = re.search(date_pattern, paragraph, re.IGNORECASE)
            date = date_match.group(0) if date_match else ""
            
            # If we couldn't find specific fields, use the entire paragraph as description
            description = paragraph.strip()
            
            current_entry = {
                "degree": degree.strip(),
                "institution": institution.strip(),
                "date": clean_date(date),
                "description": description
            }
            education_entries.append(current_entry)
            current_entry = {}
        elif current_entry:
            # Append to existing entry description
            if 'description' in current_entry:
                current_entry['description'] += '\n' + paragraph
            else:
                current_entry['description'] = paragraph
    
    # Add the last entry if not added
    if current_entry and 'description' in current_entry:
        education_entries.append(current_entry)
    
    # If we still have no entries, try a simpler approach
    if not education_entries:
        lines = [l.strip() for l in education_text.split('\n') if l.strip()]
        for i, line in enumerate(lines):
            # Look for lines that might be education entries
            if re.search(degree_pattern, line, re.IGNORECASE) or re.search(r'university|college|school|institute', line, re.IGNORECASE):
                # Try to find a date in this line or the next
                date = ""
                date_match = re.search(r'(19|20)\d{2}[^\d]*(19|20)\d{2}|(19|20)\d{2}[^\d]*present', line, re.IGNORECASE)
                if date_match:
                    date = date_match.group(0)
                elif i + 1 < len(lines) and re.search(r'(19|20)\d{2}[^\d]*(19|20)\d{2}|(19|20)\d{2}[^\d]*present', lines[i+1], re.IGNORECASE):
                    date = re.search(r'(19|20)\d{2}[^\d]*(19|20)\d{2}|(19|20)\d{2}[^\d]*present', lines[i+1], re.IGNORECASE).group(0)
                
                education_entries.append({
                    "description": line,
                    "date": clean_date(date),
                    "institution": "",
                    "degree": ""
                })
    
    return education_entries

def parse_experience(experience_text: str) -> List[Dict[str, str]]:
    """Parse experience section into structured data with improved detection."""
    if not experience_text:
        return []
    
    # Split into experience entries
    # Split text into paragraphs
    paragraphs = [p.strip() for p in experience_text.split('\n\n') if p.strip()]
    if not paragraphs:
        paragraphs = [p.strip() for p in experience_text.split('\n') if p.strip()]
    
    experience_entries = []
    current_entry = {}
    
    for paragraph in paragraphs:
        # Check if this paragraph is likely to be a job title or company
        if (
            re.search(r'(19|20)\d{2}[^\d]*(19|20)\d{2}|(19|20)\d{2}[^\d]*present', paragraph, re.IGNORECASE) or
            any(title in paragraph.lower() for title in ['engineer', 'developer', 'manager', 'director', 'analyst', 'specialist', 'consultant', 'lead', 'head', 'chief', 'officer', 'ceo', 'cto', 'cfo', 'vp', 'president', 'founder', 'co-founder', 'intern'])
        ):
            if current_entry and 'description' in current_entry:
                experience_entries.append(current_entry)
                current_entry = {}
            
            # Extract job title - look for common job titles
            title_pattern = r'(engineer|developer|manager|director|analyst|specialist|consultant|lead|head|chief|officer|ceo|cto|cfo|vp|president|founder|co-founder|intern)[^\n\.]*'
            job_title_match = re.search(title_pattern, paragraph, re.IGNORECASE)
            position = job_title_match.group(0) if job_title_match else ""
            
            # Extract company name - this is difficult to generalize, so we'll use a simple approach
            lines = paragraph.split('\n')
            company = ""
            for line in lines:
                if "company" in line.lower() or "inc" in line.lower() or "corp" in line.lower() or "ltd" in line.lower():
                    company = line
                    break
            
            # If we didn't find a company, look for capitalized words that might be a company name
            if not company:
                words = paragraph.split()
                for i, word in enumerate(words):
                    if word[0].isupper() and len(word) > 1 and i + 1 < len(words) and words[i+1][0].isupper():
                        company = f"{word} {words[i+1]}"
                        if i + 2 < len(words) and words[i+2][0].isupper():
                            company += f" {words[i+2]}"
                        break
            
            # Extract dates
            date_pattern = r'((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.,]+\d{4}|20\d{2}|19\d{2})[\s\-]+(to|[-])[\s\-]+((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.,]+\d{4}|20\d{2}|19\d{2}|Present|Current|Now)'
            date_match = re.search(date_pattern, paragraph, re.IGNORECASE)
            
            # Also look for year-only date ranges
            if not date_match:
                year_pattern = r'(19|20)\d{2}[^\d]*(19|20)\d{2}|(19|20)\d{2}[^\d]*present'
                date_match = re.search(year_pattern, paragraph, re.IGNORECASE)
            
            date = date_match.group(0) if date_match else ""
            
            # If we couldn't find specific fields, use the entire paragraph as description
            description = paragraph.strip()
            
            current_entry = {
                "position": position.strip(),
                "company": company.strip(),
                "date": clean_date(date),
                "description": description,
                "responsibilities": [],  # Will fill this later
                "achievements": []      # Will fill this later
            }
        elif current_entry:
            # This paragraph is likely part of the job description
            # Look for bullet points that indicate responsibilities or achievements
            if '•' in paragraph or '*' in paragraph or '-' in paragraph or paragraph.strip().startswith('- '):
                # This is likely a list of responsibilities or achievements
                bullet_points = re.split(r'[\n\r]\s*[•\*\-]\s*', paragraph)
                clean_points = [p.strip() for p in bullet_points if p.strip()]
                
                for point in clean_points:
                    if any(kw in point.lower() for kw in ['achieve', 'accomplish', 'improve', 'increase', 'decrease', 'reduce', 'save', 'win', 'award', 'success', 'recognition']):
                        current_entry['achievements'].append(point)
                    else:
                        current_entry['responsibilities'].append(point)
            else:
                # Append to existing entry description
                if 'description' in current_entry:
                    current_entry['description'] += '\n' + paragraph
                else:
                    current_entry['description'] = paragraph
    
    # Add the last entry if not added
    if current_entry and 'description' in current_entry:
        experience_entries.append(current_entry)
    
    # If we still have no entries, try a simpler approach
    if not experience_entries:
        lines = [l.strip() for l in experience_text.split('\n') if l.strip()]
        for i, line in enumerate(lines):
            # Look for lines that might be job entries
            if re.search(r'(19|20)\d{2}[^\d]*(19|20)\d{2}|(19|20)\d{2}[^\d]*present)', line, re.IGNORECASE):
                date = line
                company = lines[i-1] if i > 0 else ""
                position = lines[i-2] if i > 1 else ""
                
                experience_entries.append({
                    "position": position,
                    "company": company,
                    "date": clean_date(date),
                    "description": line,
                    "responsibilities": [],
                    "achievements": []
                })
    
    return experience_entries

def parse_skills(skills_text: str) -> Dict[str, List[str]]:
    """Parse skills section with categorization."""
    if not skills_text:
        return {
            "technical": [],
            "soft": [],
            "languages": [],
            "tools": [],
            "uncategorized": []
        }
    
    # Convert to lowercase for easier matching
    skills_text_lower = skills_text.lower()
    
    # Remove punctuation and tokenize
    translator = str.maketrans('', '', string.punctuation)
    text_no_punct = skills_text_lower.translate(translator)
    words = word_tokenize(text_no_punct)
    stop_words = set(stopwords.words('english'))
    words = [w for w in words if w not in stop_words]
    
    # Skill category definitions
    technical_skills = {
        # Programming languages
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'scala', 'perl',
        # Web technologies
        'html', 'css', 'react', 'angular', 'vue', 'node.js', 'django', 'flask', 'spring', 'express', 'jquery', 'bootstrap',
        # Data technologies
        'sql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'sqlite', 'nosql', 'hadoop', 'spark', 'kafka', 'redis',
        # Machine learning
        'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'nlp', 'computer vision',
        # Cloud and DevOps
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'terraform', 'ansible', 'devops',
        # General tech skills
        'algorithms', 'data structures', 'oop', 'api', 'rest', 'soap', 'graphql', 'microservices', 'serverless'
    }
    
    soft_skills = {
        'communication', 'teamwork', 'problem solving', 'leadership', 'adaptability', 'creativity', 'critical thinking',
        'time management', 'collaboration', 'interpersonal', 'presentation', 'negotiation', 'persuasion', 'conflict resolution',
        'flexibility', 'empathy', 'emotional intelligence', 'decision making', 'organizational', 'planning', 'multitasking',
        'attention to detail', 'self-motivated', 'proactive', 'customer service', 'project management', 'mentoring'
    }
    
    languages = {
        'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'russian', 'chinese', 'japanese', 'korean',
        'hindi', 'arabic', 'dutch', 'swedish', 'norwegian', 'finnish', 'danish', 'polish', 'turkish', 'greek'
    }
    
    tools = {
        'word', 'excel', 'powerpoint', 'outlook', 'office', 'photoshop', 'illustrator', 'indesign', 'figma', 'sketch',
        'jira', 'confluence', 'trello', 'asana', 'monday', 'slack', 'teams', 'zoom', 'git', 'github', 'gitlab', 'bitbucket',
        'visual studio', 'intellij', 'eclipse', 'xcode', 'android studio', 'jupyter', 'tableau', 'power bi', 'sap', 'salesforce'
    }
    
    # Extract skills from text by analyzing n-grams
    max_ngram_size = 3
    found_skills = {
        "technical": set(),
        "soft": set(),
        "languages": set(),
        "tools": set(),
        "uncategorized": set()
    }
    
    # Check for bullet-pointed lists
    bullet_pattern = r'[•\*\-]\s*([^•\*\-\n]+)'
    bullet_skills = re.findall(bullet_pattern, skills_text)
    
    if bullet_skills:
        # Process each bullet point as a potential skill
        for skill in bullet_skills:
            skill = skill.strip().lower()
            if skill in technical_skills:
                found_skills["technical"].add(skill)
            elif skill in soft_skills:
                found_skills["soft"].add(skill)
            elif skill in languages:
                found_skills["languages"].add(skill)
            elif skill in tools:
                found_skills["tools"].add(skill)
            else:
                # Check if it contains any known skill as a substring
                categorized = False
                for tech_skill in technical_skills:
                    if tech_skill in skill:
                        found_skills["technical"].add(skill)
                        categorized = True
                        break
                
                if not categorized:
                    for soft_skill in soft_skills:
                        if soft_skill in skill:
                            found_skills["soft"].add(skill)
                            categorized = True
                            break
                
                if not categorized:
                    found_skills["uncategorized"].add(skill)
    else:
        # Extract skills using n-grams
        sentences = sent_tokenize(skills_text_lower)
        for sentence in sentences:
            words = word_tokenize(sentence)
            words = [w for w in words if w not in stop_words]
            
            # Generate n-grams
            for n in range(1, min(max_ngram_size + 1, len(words) + 1)):
                for i in range(len(words) - n + 1):
                    ngram = ' '.join(words[i:i+n])
                    
                    # Check if this ngram is a known skill
                    if ngram in technical_skills:
                        found_skills["technical"].add(ngram)
                    elif ngram in soft_skills:
                        found_skills["soft"].add(ngram)
                    elif ngram in languages:
                        found_skills["languages"].add(ngram)
                    elif ngram in tools:
                        found_skills["tools"].add(ngram)
    
    # Combine comma-separated skills
    comma_separated_skills = re.findall(r'([^,]+)', skills_text)
    for skill in comma_separated_skills:
        skill = skill.strip().lower()
        if skill:
            # Skip very short terms or terms with special characters
            if len(skill) < 2 or any(c in skill for c in ['{', '}', '[', ']', '(', ')', '"', "'"]):
                continue
                
            if skill in technical_skills:
                found_skills["technical"].add(skill)
            elif skill in soft_skills:
                found_skills["soft"].add(skill)
            elif skill in languages:
                found_skills["languages"].add(skill)
            elif skill in tools:
                found_skills["tools"].add(skill)
            else:
                # Check if it contains any known skill as a substring
                categorized = False
                for tech_skill in technical_skills:
                    if tech_skill in skill:
                        found_skills["technical"].add(skill)
                        categorized = True
                        break
                
                if not categorized:
                    for soft_skill in soft_skills:
                        if soft_skill in skill:
                            found_skills["soft"].add(skill)
                            categorized = True
                            break
                
                if not categorized and len(skill.split()) <= 3:  # Only add reasonably sized phrases
                    found_skills["uncategorized"].add(skill)
    
    # Convert sets to sorted lists
    return {
        "technical": sorted(list(found_skills["technical"])),
        "soft": sorted(list(found_skills["soft"])),
        "languages": sorted(list(found_skills["languages"])),
        "tools": sorted(list(found_skills["tools"])),
        "uncategorized": sorted(list(found_skills["uncategorized"]))
    } 

def extract_resume_sections(text: str, model, tokenizer) -> Dict[str, Any]:
    """Extract sections from resume text using transformer model."""
    if not model or not tokenizer:
        print("No model available for section extraction, using fallback", file=sys.stderr)
        return extract_sections_fallback(text)
    
    try:
        # Replace multiple newlines with a single one to avoid truncation issues
        normalized_text = re.sub(r'\n+', '\n', text)
        
        # Transformer models have a token limit, so we need to split the text
        # BART typically has 1024 token limit, but we'll use 900 to be safe
        tokenized = tokenizer.encode(normalized_text, return_tensors="pt", truncation=True, max_length=900)
        
        # Generate summary/extraction
        output = model.generate(
            tokenized,
            max_length=300,
            num_beams=4,
            early_stopping=True
        )
        
        # Decode the output
        decoded_output = tokenizer.decode(output[0], skip_special_tokens=True)
        
        # Parse the structured output - should be in format like:
        # EXPERIENCE: ... EDUCATION: ... SKILLS: ... etc.
        sections = {}
        section_matches = re.finditer(r'([A-Z]+):\s*((?:(?!(?:[A-Z]+):).)*)', decoded_output, re.DOTALL)
        
        for match in section_matches:
            section_name = match.group(1).lower()
            section_content = match.group(2).strip()
            sections[section_name] = section_content
        
        # Check if we got meaningful sections
        if not sections or not any(sections.values()):
            print("Transformer model output seems invalid, falling back to regex", file=sys.stderr)
            return extract_sections_fallback(text)
        
        return sections
    except Exception as e:
        print(f"Error in transformer model processing: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return extract_sections_fallback(text)

def extract_sections_fallback(text: str) -> Dict[str, Any]:
    """Extract sections from resume text using regex patterns."""
    # Define section headers to look for
    section_patterns = {
        'experience': [
            r'(?:professional|work)\s+experience', r'employment\s+history', 
            r'work\s+history', r'^experience$', r'^employment$',
            r'career\s+history', r'positions\s+held'
        ],
        'education': [
            r'education(?:\s+and\s+training)?', r'academic\s+background', 
            r'educational\s+qualifications', r'^education$',
            r'academic\s+history', r'degrees'
        ],
        'skills': [
            r'(?:technical|professional|key)?\s*skills', r'areas\s+of\s+expertise', 
            r'proficiencies', r'competencies', r'skill\s+set',
            r'technical\s+proficiencies', r'technologies'
        ],
        'summary': [
            r'(?:professional\s+)?summary', r'profile', r'objective', 
            r'career\s+objective', r'professional\s+profile',
            r'career\s+summary', r'about\s+me'
        ],
        'projects': [
            r'projects', r'key\s+projects', r'project\s+experience',
            r'selected\s+projects', r'project\s+work',
            r'personal\s+projects'
        ],
        'certifications': [
            r'certifications', r'certificates', r'professional\s+certifications',
            r'certified', r'qualifications', r'professional\s+qualifications'
        ],
        'awards': [
            r'awards', r'honors', r'achievements', r'recognitions',
            r'accomplishments', r'accolades'
        ],
        'publications': [
            r'publications', r'papers', r'articles', r'research\s+papers',
            r'published\s+work', r'published\s+papers'
        ],
        'languages': [
            r'languages', r'language\s+proficiency', r'language\s+skills',
            r'foreign\s+languages', r'spoken\s+languages'
        ],
        'interests': [
            r'interests', r'hobbies', r'activities', r'personal\s+interests',
            r'extracurricular\s+activities'
        ]
    }
    
    # Compile all patterns
    section_regexes = {}
    for section, patterns in section_patterns.items():
        combined_pattern = '|'.join([f"(?:{p})" for p in patterns])
        section_regexes[section] = re.compile(combined_pattern, re.IGNORECASE)
    
    # Split text by lines to find section headers
    lines = text.split('\n')
    sections = {}
    current_section = 'summary'  # Default section if no headers are found
    content = []
    
    # Add buffer for summary before any headers are found
    initial_buffer = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # Check if this line is a section header
        is_header = False
        for section, regex in section_regexes.items():
            if regex.fullmatch(line.strip(':.')) or (len(line) < 30 and regex.search(line)):
                # Found a new section, save the current one
                if current_section and content:
                    sections[current_section] = '\n'.join(content)
                
                # Start new section
                current_section = section
                content = []
                is_header = True
                break
        
        if not is_header:
            # If no headers have been found yet, add to initial buffer
            if not sections and current_section == 'summary':
                initial_buffer.append(line)
            else:
                content.append(line)
    
    # Add the last section
    if current_section and content:
        sections[current_section] = '\n'.join(content)
    
    # If we have content in the initial buffer but no designated summary section,
    # add it as the summary
    if initial_buffer and 'summary' not in sections:
        # Only take the first few lines as summary
        summary_lines = initial_buffer[:min(5, len(initial_buffer))]
        sections['summary'] = '\n'.join(summary_lines)
    
    # If we still don't have key sections, try to find them using keywords
    if 'experience' not in sections:
        experience_keywords = ['work', 'job', 'position', 'employer', 'company', 'employment']
        for section, content in list(sections.items()):
            if any(keyword in content.lower() for keyword in experience_keywords):
                sections['experience'] = content
                break
    
    if 'education' not in sections:
        education_keywords = ['degree', 'university', 'college', 'school', 'bachelor', 'master', 'phd', 'diploma']
        for section, content in list(sections.items()):
            if any(keyword in content.lower() for keyword in education_keywords):
                sections['education'] = content
                break
    
    if 'skills' not in sections:
        skills_keywords = ['proficient', 'knowledge', 'familiar', 'experience with', 'skilled', 'expertise']
        for section, content in list(sections.items()):
            if any(keyword in content.lower() for keyword in skills_keywords):
                sections['skills'] = content
                break
    
    return sections

def extract_summary_highlights(text: str) -> Dict[str, Any]:
    """Extract key highlights from the resume text."""
    # Initialize with empty values
    highlights = {
        "years_experience": 0,
        "highest_education": "",
        "top_skills": [],
        "summary": "",
        "career_level": "",
        "leadership_experience": False,
        "industries": [],
        "relevant_keywords": []
    }
    
    # Try to extract years of experience
    experience_patterns = [
        r'(\d+)\+?\s*(?:years|yrs)(?:\s+of)?\s+experience',
        r'experience\s*(?:of|for)?\s*(\d+)\+?\s*(?:years|yrs)',
        r'(\d+)\+?\s*(?:years|yrs)(?:\s+in\s+|\s+as\s+)',
    ]
    
    for pattern in experience_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                highlights["years_experience"] = int(match.group(1))
                break
            except (ValueError, IndexError):
                pass
    
    # Detect education level
    education_levels = {
        "phd": ["phd", "ph.d", "doctorate", "doctoral"],
        "master": ["master", "m.s.", "m.a.", "m.b.a", "mba", "graduate degree"],
        "bachelor": ["bachelor", "b.s.", "b.a.", "undergraduate degree", "b.tech", "b.e."],
        "associate": ["associate", "a.s.", "a.a."],
        "high school": ["high school", "diploma", "secondary education"]
    }
    
    # Find highest education level mentioned
    for level, keywords in education_levels.items():
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', text, re.IGNORECASE):
                if level == "phd" or (level == "master" and highlights["highest_education"] not in ["phd"]) or \
                   (level == "bachelor" and highlights["highest_education"] not in ["phd", "master"]) or \
                   (level == "associate" and highlights["highest_education"] not in ["phd", "master", "bachelor"]) or \
                   (not highlights["highest_education"]):
                    highlights["highest_education"] = level
    
    # Extract career level
    career_levels = {
        "executive": ["executive", "ceo", "cto", "cfo", "cio", "chief", "vp", "vice president", "director"],
        "senior": ["senior", "sr.", "lead", "principal", "manager", "head"],
        "mid-level": ["mid level", "experienced", "specialist"],
        "entry-level": ["entry level", "junior", "jr.", "associate", "intern", "trainee", "graduate"]
    }
    
    for level, keywords in career_levels.items():
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', text, re.IGNORECASE):
                highlights["career_level"] = level
                break
        if highlights["career_level"]:
            break
    
    # Check for leadership experience
    leadership_keywords = ["lead", "manage", "oversee", "direct", "supervise", "head", "team lead", "leader"]
    for keyword in leadership_keywords:
        if re.search(r'\b' + re.escape(keyword) + r'\b', text, re.IGNORECASE):
            highlights["leadership_experience"] = True
            break
    
    # Extract common industries
    industry_keywords = [
        "technology", "IT", "software", "finance", "banking", "healthcare", "medical", "retail",
        "education", "manufacturing", "telecommunications", "media", "marketing", "advertising",
        "consulting", "construction", "energy", "oil", "gas", "pharmaceutical", "automotive",
        "aerospace", "defense", "hospitality", "travel", "tourism", "food", "beverage", "real estate",
        "legal", "insurance", "government", "nonprofit", "agriculture", "mining", "transportation",
        "logistics", "e-commerce", "entertainment"
    ]
    
    for industry in industry_keywords:
        if re.search(r'\b' + re.escape(industry) + r'\b', text, re.IGNORECASE):
            highlights["industries"].append(industry)
    
    return highlights

def parse_resume(file_path: str) -> Dict[str, Any]:
    """Parse a resume file and extract structured information."""
    try:
        # Determine file type from extension
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # Extract text from file
        text = ""
        if file_ext in ['.pdf']:
            text = extract_text_from_pdf(file_path)
        elif file_ext in ['.docx', '.doc']:
            text = extract_text_from_docx(file_path)
        else:
            return {
                "success": False,
                "error": "Unsupported file format",
                "details": f"The file extension {file_ext} is not supported. Please upload a PDF or DOCX file."
            }
        
        # Check if text was successfully extracted
        if not text or len(text.strip()) < 50:
            return {
                "success": False,
                "error": "Failed to extract text",
                "details": "The file appears to be empty or contains very little text. Please check the file and try again."
            }
        
        # Load NER model
        ner_pipeline = load_ner_model()
        
        # Load BART model for section extraction
        model, tokenizer = load_resume_parser_model()
        
        # Extract sections from resume
        sections = extract_resume_sections(text, model, tokenizer)
        
        # Extract personal information
        personal_info = extract_entities(text, ner_pipeline)
        
        # Parse education
        education_data = parse_education(sections.get('education', ''))
        
        # Parse experience
        experience_data = parse_experience(sections.get('experience', ''))
        
        # Parse skills
        skills_data = parse_skills(sections.get('skills', ''))
        
        # Extract key highlights
        highlights = extract_summary_highlights(text)
        
        # Build the final output
        result = {
            "success": True,
            "name": personal_info.get('name', ''),
            "email": personal_info.get('email', ''),
            "phone": personal_info.get('phone', ''),
            "linkedin": personal_info.get('linkedin', ''),
            "github": personal_info.get('github', ''),
            "website": personal_info.get('website', ''),
            "summary": sections.get('summary', ''),
            "education": education_data,
            "experience": experience_data,
            "skills": skills_data.get('uncategorized', []),
            "technical_skills": skills_data.get('technical', []),
            "soft_skills": skills_data.get('soft', []),
            "language_skills": skills_data.get('languages', []),
            "tools": skills_data.get('tools', []),
            "highlights": highlights,
            "organizations": personal_info.get('organizations', []),
            "locations": personal_info.get('locations', []),
            "certifications": [],  # Could extract these in future updates
            "projects": [],        # Could extract these in future updates
            "publications": []     # Could extract these in future updates
        }
        
        # Add additional sections if present
        if 'projects' in sections:
            result['projects'] = sections['projects']
        
        if 'certifications' in sections:
            result['certifications'] = sections['certifications']
        
        if 'publications' in sections:
            result['publications'] = sections['publications']
        
        if 'awards' in sections:
            result['awards'] = sections['awards']
        
        if 'languages' in sections and not result['language_skills']:
            result['language_skills'] = sections['languages'].split(',')
        
        if 'interests' in sections:
            result['interests'] = sections['interests']
        
        return result
    
    except Exception as e:
        print(f"Error parsing resume: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return {
            "success": False,
            "error": "Failed to parse resume",
            "details": str(e)
        }

if __name__ == "__main__":
    # Check command line arguments
    if len(sys.argv) != 2:
        print("Usage: python enhanced_resume_parser.py <resume_file_path>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # Check if file exists
    if not os.path.isfile(file_path):
        print(json.dumps({
            "success": False,
            "error": "File not found",
            "details": f"The file {file_path} does not exist."
        }))
        sys.exit(1)
    
    # Parse the resume
    result = parse_resume(file_path)
    
    # Print the result as JSON
    print(json.dumps(result, indent=2)) 