import { v4 as uuidv4 } from 'uuid';
import { User, JobPosting, Candidate, Company, Notification, Task, Placement } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: uuidv4(),
    name: 'Admin User',
    email: 'admin@talnurt.com',
    phone: '+1234567890',
    linkedIn: 'linkedin.com/in/adminuser',
    role: 'admin',
    profilePicture: '/images/avatars/admin.jpg',
  },
  {
    id: uuidv4(),
    name: 'Employer One',
    email: 'employer@talnurt.com',
    phone: '+1234567891',
    linkedIn: 'linkedin.com/in/employerone',
    role: 'employer',
    profilePicture: '/images/avatars/employer.jpg',
  },
  {
    id: uuidv4(),
    name: 'Manager One',
    email: 'manager@talnurt.com',
    phone: '+1234567892',
    linkedIn: 'linkedin.com/in/managerone',
    role: 'manager',
    profilePicture: '/images/avatars/manager.jpg',
  },
  {
    id: uuidv4(),
    name: 'Employee One',
    email: 'employee@talnurt.com',
    phone: '+1234567893',
    linkedIn: 'linkedin.com/in/employeeone',
    role: 'employee',
    profilePicture: '/images/avatars/employee.jpg',
  },
];

// Mock Job Postings
export const mockJobPostings: JobPosting[] = [
  {
    id: uuidv4(),
    title: 'Senior Software Engineer',
    description: 'We are looking for a Senior Software Engineer to join our team. The ideal candidate will have experience with React, Node.js, and AWS.',
    requirements: ['5+ years of software development experience', 'Experience with React', 'Experience with Node.js', 'Experience with AWS'],
    location: 'New York, NY',
    salary: '$120,000 - $150,000',
    postedDate: '2023-01-10',
    postedBy: mockUsers[0].id,
    status: 'open',
    applications: [{
      id: uuidv4(),
      jobId: '1',
      name: 'Applicant One',
      email: 'applicant1@example.com',
      phone: '+1234567899',
      resumeUrl: '/resumes/applicant1.pdf',
      status: 'pending',
      appliedDate: '2023-01-12',
    }],
  },
  {
    id: uuidv4(),
    title: 'Product Manager',
    description: 'We are seeking a Product Manager to drive our product strategy and roadmap.',
    requirements: ['3+ years of product management experience', 'Experience with agile methodologies', 'Strong communication skills'],
    location: 'San Francisco, CA',
    salary: '$130,000 - $160,000',
    postedDate: '2023-01-15',
    postedBy: mockUsers[1].id,
    status: 'open',
    applications: [],
  },
  {
    id: uuidv4(),
    title: 'UI/UX Designer',
    description: 'Looking for a talented UI/UX Designer to create beautiful and functional interfaces.',
    requirements: ['Portfolio of design work', 'Experience with Figma', 'Understanding of user research'],
    location: 'Remote',
    salary: '$90,000 - $120,000',
    postedDate: '2023-01-20',
    postedBy: mockUsers[0].id,
    status: 'open',
    applications: [],
  },
];

// Mock Candidates
export const mockCandidates: Candidate[] = [
  // Fixed ID candidate that was in the URL when error occurred
  {
    id: 'd54b1683-fd21-453e-a7e2-e95c1d1bdbf6',
    name: 'Michael Johnson',
    email: 'michael.johnson@example.com',
    phone: '+12345678903',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'AWS'],
    experience: [
      {
        company: 'Enterprise Solutions',
        title: 'Senior Java Developer',
        startDate: '2019-03-01',
        endDate: undefined, // Currently employed
        description: 'Leading backend development for enterprise applications.',
      },
      {
        company: 'Tech Innovators Inc.',
        title: 'Java Developer',
        startDate: '2016-06-15',
        endDate: '2019-02-28',
        description: 'Developed and maintained Java-based applications.',
      }
    ],
    education: [
      {
        institution: 'MIT',
        degree: 'Master',
        field: 'Computer Engineering',
        startDate: '2014-09-01',
        endDate: '2016-05-30',
      },
      {
        institution: 'Carnegie Mellon University',
        degree: 'Bachelor',
        field: 'Computer Science',
        startDate: '2010-09-01',
        endDate: '2014-05-30',
      }
    ],
    resumeUrl: '/resumes/michael_johnson.pdf',
    relevancyScore: 92,
  },
  // Other fixed ID candidates for testing and fallback
  {
    id: '85fe5673-1e43-4854-b935-7d06a8b0b5c2',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+12345678901',
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    experience: [
      {
        company: 'Tech Innovations Inc.',
        title: 'Senior Software Engineer',
        startDate: '2020-01-01',
        endDate: '2023-01-01',
        description: 'Led development of several key projects and mentored junior developers.',
      },
      {
        company: 'Digital Solutions LLC',
        title: 'Software Engineer',
        startDate: '2017-03-15',
        endDate: '2019-12-31',
        description: 'Developed and maintained web applications using React and Node.js.',
      }
    ],
    education: [
      {
        institution: 'Stanford University',
        degree: 'Master',
        field: 'Computer Science',
        startDate: '2015-09-01',
        endDate: '2017-06-01',
      },
      {
        institution: 'University of California',
        degree: 'Bachelor',
        field: 'Software Engineering',
        startDate: '2011-09-01',
        endDate: '2015-06-01',
      }
    ],
    resumeUrl: '/resumes/john_doe.pdf',
    relevancyScore: 95,
  },
  {
    id: '91fb7862-30ed-42f1-8611-98f19b2f2f00',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+12345678902',
    skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'HTML/CSS'],
    experience: [
      {
        company: 'Design Masters',
        title: 'Senior UI/UX Designer',
        startDate: '2019-05-01',
        endDate: undefined, // Currently employed
        description: 'Creating user-centered designs for web and mobile applications.',
      },
      {
        company: 'Creative Solutions',
        title: 'UI Designer',
        startDate: '2016-02-01',
        endDate: '2019-04-30',
        description: 'Designed interfaces for clients across various industries.',
      }
    ],
    education: [
      {
        institution: 'Rhode Island School of Design',
        degree: 'Bachelor',
        field: 'Graphic Design',
        startDate: '2012-09-01',
        endDate: '2016-06-01',
      }
    ],
    resumeUrl: '/resumes/jane_smith.pdf',
    relevancyScore: 88,
  },
  // Continue with the dynamically generated candidates
  ...Array.from({ length: 100 }, (_, i) => ({
    id: uuidv4(),
    name: `Candidate ${i + 1}`,
    email: `candidate${i + 1}@example.com`,
    phone: `+123456${i.toString().padStart(4, '0')}`,
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'].slice(0, Math.floor(Math.random() * 4) + 1),
    experience: [
      {
        company: `Company ${i % 10 + 1}`,
        title: `${['Software Engineer', 'Product Manager', 'UI Designer', 'Data Scientist'][i % 4]} ${['I', 'II', 'Senior', 'Lead'][Math.floor(Math.random() * 4)]}`,
        startDate: `202${i % 3}-01-01`,
        endDate: i % 5 === 0 ? undefined : `202${(i % 3) + 1}-01-01`,
        description: 'Worked on various projects and contributed to team success.',
      },
    ],
    education: [
      {
        institution: `University ${i % 20 + 1}`,
        degree: ['Bachelor', 'Master', 'PhD'][i % 3],
        field: ['Computer Science', 'Information Technology', 'Software Engineering', 'Business Administration'][i % 4],
        startDate: `201${i % 9}-09-01`,
        endDate: `201${(i % 9) + 4}-06-01`,
      },
    ],
    resumeUrl: `/resumes/candidate${i + 1}.pdf`,
    relevancyScore: Math.floor(Math.random() * 100),
  }))
];

// Mock Companies
export const mockCompanies: Company[] = [
  {
    id: uuidv4(),
    name: 'Tech Innovations Inc.',
    industry: 'Technology',
    location: 'San Francisco, CA',
    website: 'techinnovations.com',
  },
  {
    id: uuidv4(),
    name: 'Finance Solutions LLC',
    industry: 'Finance',
    location: 'New York, NY',
    website: 'financesolutions.com',
  },
  {
    id: uuidv4(),
    name: 'Healthcare Partners',
    industry: 'Healthcare',
    location: 'Boston, MA',
    website: 'healthcarepartners.com',
  },
  {
    id: uuidv4(),
    name: 'Retail Dynamics',
    industry: 'Retail',
    location: 'Chicago, IL',
    website: 'retaildynamics.com',
  },
  {
    id: uuidv4(),
    name: 'Manufacturing Pro',
    industry: 'Manufacturing',
    location: 'Detroit, MI',
    website: 'manufacturingpro.com',
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: uuidv4(),
    userId: mockUsers[3].id,
    title: 'New Task Assigned',
    message: 'You have been assigned a new task: Review candidate profiles',
    type: 'task',
    read: false,
    timestamp: '2023-05-15T10:30:00.000Z',
  },
  {
    id: uuidv4(),
    userId: mockUsers[3].id,
    title: 'New Message',
    message: 'You have a new message from Manager One',
    type: 'chat',
    read: false,
    timestamp: '2023-05-14T14:45:00.000Z',
  },
  {
    id: uuidv4(),
    userId: mockUsers[3].id,
    title: 'System Update',
    message: 'The recruitment portal will be undergoing maintenance tonight',
    type: 'system',
    read: true,
    timestamp: '2023-05-13T08:20:00.000Z',
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: uuidv4(),
    title: 'Review Candidate Profiles',
    description: 'Review the profiles of 10 new candidates that applied for the Senior Software Engineer position',
    assignedTo: mockUsers[3].id,
    assignedBy: mockUsers[2].id,
    dueDate: '2023-05-17T10:00:00.000Z',
    status: 'pending',
  },
  {
    id: uuidv4(),
    title: 'Schedule Interviews',
    description: 'Schedule interviews with the 5 shortlisted candidates for the Product Manager position',
    assignedTo: mockUsers[3].id,
    assignedBy: mockUsers[2].id,
    dueDate: '2023-05-18T14:30:00.000Z',
    status: 'in-progress',
  },
  {
    id: uuidv4(),
    title: 'Prepare Offer Letter',
    description: 'Prepare an offer letter for the selected candidate for the UI/UX Designer position',
    assignedTo: mockUsers[3].id,
    assignedBy: mockUsers[1].id,
    dueDate: '2023-05-16T09:00:00.000Z',
    status: 'pending',
  },
];

// Mock Placements
export const mockPlacements: Placement[] = [
  {
    id: uuidv4(),
    candidateId: mockCandidates[0].id,
    companyId: mockCompanies[0].id,
    position: 'Senior Software Engineer',
    salary: 140000,
    startDate: '2023-01-15',
    recruiterId: mockUsers[3].id,
    managerId: mockUsers[2].id,
    businessDeveloperId: mockUsers[3].id,
    coordinatorId: mockUsers[3].id,
    revenue: 28000,
    documents: {
      offerLetter: '/documents/offer_letter_1.pdf',
      passport: '/documents/passport_1.pdf',
      photoId: '/documents/photo_id_1.pdf',
      resignationLetter: '/documents/resignation_letter_1.pdf',
    },
  },
  {
    id: uuidv4(),
    candidateId: mockCandidates[1].id,
    companyId: mockCompanies[1].id,
    position: 'Product Manager',
    salary: 150000,
    startDate: '2023-02-01',
    recruiterId: mockUsers[3].id,
    managerId: mockUsers[2].id,
    businessDeveloperId: mockUsers[3].id,
    coordinatorId: mockUsers[3].id,
    revenue: 30000,
    documents: {
      offerLetter: '/documents/offer_letter_2.pdf',
      passport: '/documents/passport_2.pdf',
      photoId: '/documents/photo_id_2.pdf',
    },
  },
  {
    id: uuidv4(),
    candidateId: mockCandidates[2].id,
    companyId: mockCompanies[2].id,
    position: 'UI/UX Designer',
    salary: 110000,
    startDate: '2023-02-15',
    recruiterId: mockUsers[3].id,
    managerId: mockUsers[2].id,
    businessDeveloperId: mockUsers[3].id,
    coordinatorId: mockUsers[3].id,
    revenue: 22000,
    documents: {
      offerLetter: '/documents/offer_letter_3.pdf',
      passport: '/documents/passport_3.pdf',
    },
  },
]; 