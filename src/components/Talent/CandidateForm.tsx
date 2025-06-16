import React, { useState, useRef } from 'react';
import { FaUpload, FaPlus, FaTimes } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { Candidate, ExperienceEntry, EducationEntry } from '@/types';
import { validateFile, uploadFile } from '@/utils/fileUpload';

interface CandidateFormProps {
  onSubmit: (candidate: Candidate) => void;
  initialData?: Candidate;
  isEdit?: boolean;
  onCancel?: () => void;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ 
  onSubmit, 
  initialData,
  isEdit = false,
  onCancel
}) => {
  const [formData, setFormData] = useState<Candidate>(
    initialData || {
      id: uuidv4(),
      name: '',
      email: '',
      phone: '',
      githubUrl: '',
      linkedinUrl: '',
      skills: [],
      experience: [{
        company: '',
        title: '',
        startDate: '',
        endDate: '',
        description: ''
      }],
      education: [{
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: ''
      }]
    }
  );
  
  const [newSkill, setNewSkill] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSkillAdd = () => {
    if (newSkill.trim() === '') return;
    
    setFormData({
      ...formData,
      skills: [...formData.skills, newSkill.trim()]
    });
    setNewSkill('');
  };
  
  const handleSkillRemove = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    });
  };
  
  const handleExperienceChange = (index: number, field: keyof ExperienceEntry, value: string) => {
    const newExperience = [...formData.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    
    setFormData({
      ...formData,
      experience: newExperience
    });
  };

  // Date handlers for experience 
  const handleExperienceMonthChange = (index: number, dateType: 'startDate' | 'endDate', value: string) => {
    const newExperience = [...formData.experience];
    const currentDate = newExperience[index][dateType] || '';
    
    // Extract year from current date or default to current year
    const year = currentDate.split('-')[0] || new Date().getFullYear().toString();
    
    newExperience[index] = { 
      ...newExperience[index], 
      [dateType]: `${year}-${value}` 
    };
    
    setFormData({
      ...formData,
      experience: newExperience
    });
  };

  const handleExperienceYearChange = (index: number, dateType: 'startDate' | 'endDate', value: string) => {
    const newExperience = [...formData.experience];
    const currentDate = newExperience[index][dateType] || '';
    
    // Extract month from current date or default to 01
    const month = currentDate.split('-')[1] || '01';
    
    newExperience[index] = { 
      ...newExperience[index], 
      [dateType]: `${value}-${month}` 
    };
    
    setFormData({
      ...formData,
      experience: newExperience
    });
  };
  
  const handleAddExperience = () => {
    setFormData({
      ...formData,
      experience: [
        ...formData.experience,
        {
          company: '',
          title: '',
          startDate: '',
          endDate: '',
          description: ''
        }
      ]
    });
  };
  
  const handleRemoveExperience = (index: number) => {
    if (formData.experience.length <= 1) return;
    
    setFormData({
      ...formData,
      experience: formData.experience.filter((_, i) => i !== index)
    });
  };
  
  const handleEducationChange = (index: number, field: keyof EducationEntry, value: string) => {
    const newEducation = [...formData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    
    setFormData({
      ...formData,
      education: newEducation
    });
  };

  // Date handlers for education
  const handleEducationMonthChange = (index: number, dateType: 'startDate' | 'endDate', value: string) => {
    const newEducation = [...formData.education];
    const currentDate = newEducation[index][dateType] || '';
    
    // Extract year from current date or default to current year
    const year = currentDate.split('-')[0] || new Date().getFullYear().toString();
    
    newEducation[index] = { 
      ...newEducation[index], 
      [dateType]: `${year}-${value}` 
    };
    
    setFormData({
      ...formData,
      education: newEducation
    });
  };

  const handleEducationYearChange = (index: number, dateType: 'startDate' | 'endDate', value: string) => {
    const newEducation = [...formData.education];
    const currentDate = newEducation[index][dateType] || '';
    
    // Extract month from current date or default to 01
    const month = currentDate.split('-')[1] || '01';
    
    newEducation[index] = { 
      ...newEducation[index], 
      [dateType]: `${value}-${month}` 
    };
    
    setFormData({
      ...formData,
      education: newEducation
    });
  };
  
  const handleAddEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        {
          institution: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: ''
        }
      ]
    });
  };
  
  const handleRemoveEducation = (index: number) => {
    if (formData.education.length <= 1) return;
    
    setFormData({
      ...formData,
      education: formData.education.filter((_, i) => i !== index)
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setUploadStatus(null);
    
    if (!selectedFile) {
      return;
    }
    
    // Log file information for debugging
    console.log('Selected file:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size
    });
    
    // Validate the file
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    setFile(selectedFile);
    setUploadStatus('File selected and ready to upload');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setUploadStatus(null);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.email) {
        throw new Error('Name and email are required fields');
      }
      
      // Handle file upload if there's a new file
      let resumeUrl = formData.resumeUrl;
      
      if (file) {
        setUploadStatus('Uploading file...');
        console.log('Starting file upload process');
        
        try {
          // Make sure we have a valid candidate ID
          const candidateId = formData.id || uuidv4();
          
          // If ID was missing, update the form data
          if (!formData.id) {
            console.warn('No candidate ID found, using generated ID:', candidateId);
            setFormData(prev => ({ ...prev, id: candidateId }));
          }
          
          resumeUrl = await uploadFile(file, candidateId);
          console.log('File uploaded successfully:', resumeUrl);
          setUploadStatus('File uploaded successfully');
        } catch (uploadError: any) {
          console.error('Resume upload error:', uploadError);
          throw new Error(`Resume upload failed: ${uploadError.message || 'Unknown error'}`);
        }
      }
      // Make resume upload optional for recruiter-added candidates
      // Removed the mandatory file check
      
      // Prepare the final candidate data
      const candidateData: Candidate = {
        ...formData,
        resumeUrl,
        source: 'recruiter' // Set source to 'recruiter' for candidates added through the recruiter form
      };
      
      console.log('Submitting candidate data:', candidateData);
      
      onSubmit(candidateData);
      
      // Reset the form if not editing
      if (!isEdit) {
        setFormData({
          id: uuidv4(),
          name: '',
          email: '',
          phone: '',
          githubUrl: '',
          linkedinUrl: '',
          skills: [],
          experience: [{
            company: '',
            title: '',
            startDate: '',
            endDate: '',
            description: ''
          }],
          education: [{
            institution: '',
            degree: '',
            field: '',
            startDate: '',
            endDate: ''
          }]
        });
        
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save candidate information');
      console.error('Form submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract month and year from date string
  const extractDateParts = (dateString: string | undefined) => {
    if (!dateString) {
      return { year: '', month: '' };
    }
    const parts = dateString.split('-');
    return {
      year: parts[0] || '',
      month: parts[1] || ''
    };
  };

  // Generate years for dropdown (from 1970 to current year + 5)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 1970; year <= currentYear + 5; year++) {
      years.push(year);
    }
    return years;
  };

  const years = generateYearOptions();

  // Generate months for dropdown
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
                Full Name<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.name}
              onChange={handleChange}
              required
                placeholder="John Doe"
            />
          </div>
          
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                Email Address<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.email}
              onChange={handleChange}
              required
                placeholder="johndoe@example.com"
            />
          </div>
          
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.phone}
              onChange={handleChange}
                placeholder="+1 123 456 7890"
            />
          </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="githubUrl">
                GitHub URL
              </label>
              <input
                id="githubUrl"
                name="githubUrl"
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/username"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="linkedinUrl">
                LinkedIn URL
              </label>
              <input
                id="linkedinUrl"
                name="linkedinUrl"
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={formData.linkedinUrl}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Skills Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Skills</h3>
        </div>
        
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.skills.map((skill, index) => (
              <div 
                key={index} 
                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleSkillRemove(index)}
                  className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}
            {formData.skills.length === 0 && (
              <p className="text-sm text-gray-500 italic">No skills added yet</p>
            )}
          </div>
          
          <div className="flex">
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill (e.g. JavaScript, React, Project Management)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSkillAdd();
                }
              }}
            />
            <button
              type="button"
              onClick={handleSkillAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
            </button>
          </div>
        </div>
      </div>
      
      {/* Resume Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Resume Upload</h3>
        </div>
        
        <div className="p-6">
          <div className={`border-2 border-dashed ${isLoading ? 'border-blue-300 bg-blue-50' : 'border-gray-300'} rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer`}
            onClick={() => !isLoading && fileInputRef.current?.click()}>
          <div className="mb-4">
            {isLoading ? (
              <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-blue-400 rounded-full mb-3"></div>
                <p className="text-sm text-blue-600 font-medium">
                  {uploadStatus || 'Processing...'}
                </p>
              </div>
            ) : (
              <>
                  <FaUpload className="mx-auto text-gray-400 mb-3" size={48} />
                  <h4 className="text-lg font-medium text-gray-700">Upload Resume</h4>
                <p className="mt-2 text-sm text-gray-500">
                    Drag and drop a PDF or DOCX file here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Maximum file size: 5MB
                </p>
              </>
            )}
          </div>
          
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isLoading}
          />
          
            {!isLoading && (
          <button
            type="button"
                className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
            disabled={isLoading}
          >
                Select File
          </button>
            )}
          
          {file && !isLoading && (
              <div className="mt-4 flex items-center justify-center p-3 bg-blue-50 rounded-md border border-blue-200">
                <FaUpload className="text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">{file.name}</span>
            </div>
          )}
          
          {formData.resumeUrl && !file && !isLoading && (
              <div className="mt-4 flex items-center justify-center p-3 bg-green-50 rounded-md border border-green-200">
                <FaUpload className="text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Resume already uploaded</span>
            </div>
          )}

            {error && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error}
            </div>
          )}
        </div>
      </div>
          </div>
          
      {/* Work Experience Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Work Experience</h3>
                <button 
                  type="button" 
            onClick={handleAddExperience}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
          >
            <FaPlus className="mr-1.5" size={12} /> Add Experience
          </button>
        </div>
        
        <div className="p-6">
          {formData.experience.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No work experience added. Click 'Add Experience' to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
        {formData.experience.map((exp, index) => {
          const startDate = extractDateParts(exp.startDate);
          const endDate = extractDateParts(exp.endDate);
          
          return (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h4 className="font-medium text-gray-700 flex items-center">
                        {exp.company ? (
                          <>
                            <span>{exp.title || 'Role'}</span>
                            {exp.company && <span className="mx-2">at</span>}
                            <span className="font-semibold">{exp.company}</span>
                          </>
                        ) : (
                          `Experience ${index + 1}`
                        )}
                      </h4>
                {formData.experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                  >
                          <FaTimes size={16} />
                  </button>
                )}
              </div>
              
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={exp.title}
                    onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                            placeholder="Software Engineer"
                  />
                </div>
                
                <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={exp.company}
                    onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                            placeholder="Acme Inc."
                  />
                </div>
                
                <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                          <div className="grid grid-cols-2 gap-3">
                    <select 
                              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
                      value={startDate.month}
                      onChange={(e) => handleExperienceMonthChange(index, 'startDate', e.target.value)}
                    >
                      <option value="">Month</option>
                      {months.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    
                    <select 
                              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
                      value={startDate.year}
                      onChange={(e) => handleExperienceYearChange(index, 'startDate', e.target.value)}
                    >
                      <option value="">Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date <span className="text-gray-500 text-xs">(leave empty if current)</span>
                  </label>
                          <div className="grid grid-cols-2 gap-3">
                    <select 
                              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
                      value={endDate.month}
                      onChange={(e) => handleExperienceMonthChange(index, 'endDate', e.target.value)}
                    >
                      <option value="">Month</option>
                      {months.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    
                    <select 
                              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
                      value={endDate.year}
                      onChange={(e) => handleExperienceYearChange(index, 'endDate', e.target.value)}
                    >
                      <option value="">Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Description
                </label>
                <textarea
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          rows={4}
                  value={exp.description}
                  onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                          placeholder="Describe your responsibilities and accomplishments in this role"
                />
                      </div>
              </div>
            </div>
          );
        })}
            </div>
          )}
        </div>
      </div>
      
      {/* Education Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Education</h3>
          <button
            type="button"
            onClick={handleAddEducation}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
          >
            <FaPlus className="mr-1.5" size={12} /> Add Education
          </button>
        </div>
        
        <div className="p-6">
          {formData.education.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No education added. Click 'Add Education' to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
        {formData.education.map((edu, index) => {
          const startDate = extractDateParts(edu.startDate);
          const endDate = extractDateParts(edu.endDate);
          
          return (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h4 className="font-medium text-gray-700 flex items-center">
                        {edu.institution ? (
                          <>
                            <span className="font-semibold">{edu.institution}</span>
                            {edu.degree && <span className="mx-2">-</span>}
                            <span>{edu.degree}</span>
                          </>
                        ) : (
                          `Education ${index + 1}`
                        )}
                      </h4>
                {formData.education.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                  >
                          <FaTimes size={16} />
                  </button>
                )}
              </div>
              
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution
                  </label>
                  <input
                    type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={edu.institution}
                    onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                            placeholder="University of California"
                  />
                </div>
                
                <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree
                  </label>
                  <input
                    type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={edu.degree}
                    onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                            placeholder="Bachelor of Science"
                  />
                </div>
                
                <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field of Study
                  </label>
                  <input
                    type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={edu.field}
                    onChange={(e) => handleEducationChange(index, 'field', e.target.value)}
                            placeholder="Computer Science"
                  />
                </div>
                
                        <div className="grid grid-cols-2 gap-3">
                  <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
                        value={startDate.month}
                        onChange={(e) => handleEducationMonthChange(index, 'startDate', e.target.value)}
                      >
                        <option value="">Month</option>
                        {months.map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                      
                      <select 
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
                        value={startDate.year}
                        onChange={(e) => handleEducationYearChange(index, 'startDate', e.target.value)}
                      >
                        <option value="">Year</option>
                        {years.map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
                        value={endDate.month}
                        onChange={(e) => handleEducationMonthChange(index, 'endDate', e.target.value)}
                      >
                        <option value="">Month</option>
                        {months.map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                      
                      <select 
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm"
                        value={endDate.year}
                        onChange={(e) => handleEducationYearChange(index, 'endDate', e.target.value)}
                      >
                        <option value="">Year</option>
                        {years.map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                            </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
          )}
            </div>
            </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update Candidate' : 'Add Candidate'}
        </button>
      </div>
    </form>
  );
};

export default CandidateForm; 