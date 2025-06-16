export interface ResumeParserResponse {
  success: boolean;
  error?: string;
  details?: string;
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: string[];
  fileInfo?: FileInfo;
}

export interface EnhancedResumeParserResponse {
  success: boolean;
  error?: string;
  details?: string;
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
  education: EducationEntry[];
  experience: EnhancedExperienceEntry[];
  skill?: {
    technical_skills: string[];
    soft_skills: string[];
    tools: string[];
  };
  skills?: string[];
  technical_skills?: string[];
  soft_skills?: string[];
  language_skills?: string[];
  tools?: string[];
  highlights?: ResumeHighlights;
  organizations?: string[];
  locations?: string[];
  certifications?: string[] | string;
  projects?: string[] | string;
  publications?: string[] | string;
  awards?: string[] | string;
  interests?: string[] | string;
  fileInfo?: FileInfo;
}

export interface EducationEntry {
  institution?: string;
  degree?: string;
  date?: string;
  description?: string;
}

export interface ExperienceEntry {
  position?: string;
  company?: string;
  date?: string;
  description?: string;
}

export interface EnhancedExperienceEntry extends ExperienceEntry {
  responsibilities?: string[];
  achievements?: string[];
}

export interface FileInfo {
  filePath: string;
  filename: string;
  originalFilename: string;
  extension: string;
}

export interface ResumeHighlights {
  years_experience?: number;
  highest_education?: string;
  top_skills?: string[];
  summary?: string;
  career_level?: string;
  leadership_experience?: boolean;
  industries?: string[];
  relevant_keywords?: string[];
} 