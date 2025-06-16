export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedIn?: string;
  role: 'admin' | 'recruiter' | 'applicant' | 'employer' | 'employee' | 'unassigned' | 'manager';
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company?: string;
  department?: string;
  location: string;
  jobType?: string;
  workMode?: string;
  experience?: string;
  industry?: string;
  description: string;
  summary?: string;
  responsibilities?: string;
  requirements: string[];
  skills?: string[];
  salary?: string;
  currency?: string;
  benefits?: string;
  postedDate: string;
  deadline?: string;
  applicationEmail?: string;
  applicationUrl?: string;
  contactPerson?: string;
  postedBy?: string;
  postedByRole?: string;
  postedByName?: string;
  companyId?: string;
  teamId?: string;
  postedByUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedToUser?: {
    id: string;
    name: string;
    role: string;
  } | null;
  status: 'open' | 'closed' | 'draft';
  isInternalOnly?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  applications?: JobApplication[];
  applicationsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobApplication {
  id?: string;
  jobId: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl: string;
  status?: 'pending' | 'reviewed' | 'interviewed' | 'offered' | 'rejected';
  appliedDate?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  toolSkills?: string[];
  languageSkills?: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  resumeUrl?: string;
  relevancyScore?: number;
  source?: 'frontend' | 'manual' | 'excel' | 'excel-import' | 'resume-parsing' | 'resume' | 'recruiter';
}

export interface ExperienceEntry {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  website?: string;
}

export interface Placement {
  id: string;
  candidateId: string;
  companyId: string;
  position: string;
  salary: number;
  startDate: string;
  recruiterId: string;
  managerId: string;
  businessDeveloperId: string;
  coordinatorId: string;
  revenue: number;
  documents: {
    offerLetter?: string;
    passport?: string;
    photoId?: string;
    visa?: string;
    yellowFever?: string;
    resignationLetter?: string;
    experienceLetter?: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: string[];
}

export interface ChatGroup {
  id: string;
  name: string;
  memberIds: string[];
  messages: Message[];
}

export interface Report {
  id: string;
  userId: string;
  date: string;
  content: string;
  attachments?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'chat' | 'system';
  read: boolean;
  timestamp: string;
}

export interface ProfileData {
  education?: Education[];
  experience?: Experience[];
  skills?: Skill[];
  contactInfo?: {
    phoneNumber?: string;
    countryCode?: string;
    city?: string;
    state?: string;
    country?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  };
  preferences?: {
    preferredLocation?: string;
    preferredRole?: string;
    preferredType?: string;
  };
  resume?: string | null;
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  year: string;
}

export interface Experience {
  id?: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
}

export interface Skill {
  id?: string;
  name: string;
} 