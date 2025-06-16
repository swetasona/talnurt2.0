import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid resume ID' });
  }
  
  try {
    // Generate resume data based on ID
    const resumeData = {
      id,
      name: id === '1' ? 'Sweta Sona' : `Applicant ${id}`,
      email: id === '1' ? 'swetasona@gmail.com' : `applicant${id}@example.com`,
      phone: id === '1' ? '9823873268' : `555-123-456${id}`,
      location: id === '1' ? 'Jamshedpur, India' : 'City, Country',
      education: id === '1' ? [
        {
          degree: 'Bachelor of Technology in Computer Science',
          institution: 'XYZ University',
          yearRange: '2019-2023'
        }
      ] : [
        {
          degree: 'Degree in Subject',
          institution: 'University Name',
          yearRange: '20XX-20XX'
        }
      ],
      experience: id === '1' ? [
        {
          position: 'Software Developer',
          company: 'Tech Solutions Inc.',
          yearRange: '2023-Present',
          responsibilities: [
            'Developed web applications using React and Node.js',
            'Implemented CI/CD pipelines for automated testing and deployment',
            'Collaborated with cross-functional teams to deliver features on time'
          ]
        }
      ] : [
        {
          position: 'Position Title',
          company: 'Company Name',
          yearRange: 'Date Range',
          responsibilities: [
            'Accomplishment 1',
            'Accomplishment 2',
            'Accomplishment 3'
          ]
        }
      ],
      skills: id === '1' ? 
        ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Next.js', 'SQL', 'Git', 'CI/CD', 'Agile'] : 
        ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4', 'Skill 5'],
      projects: id === '1' ? [
        {
          title: 'E-commerce Platform',
          description: [
            'Built a full-stack e-commerce platform using MERN stack',
            'Implemented payment gateway integration and order management system'
          ]
        },
        {
          title: 'Portfolio Website',
          description: [
            'Designed and developed a personal portfolio website using Next.js and Tailwind CSS'
          ]
        }
      ] : [
        {
          title: 'Project 1',
          description: ['Description of project 1']
        },
        {
          title: 'Project 2',
          description: ['Description of project 2']
        }
      ]
    };

    // Return the resume data as JSON
    res.status(200).json(resumeData);
  } catch (error: any) {
    console.error(`Error serving resume for ID ${id}:`, error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
} 