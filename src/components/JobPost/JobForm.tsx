import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { JobPosting } from '@/types';
import { mockUsers } from '@/data/mockData';
import { FaArrowRight, FaSave, FaUndo, FaExclamationCircle } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

interface JobFormProps {
  onSubmit: (job: JobPosting) => void;
  initialData?: JobPosting | null;
  hideHeading?: boolean;
  onCancel?: () => void;
}

const JobForm: React.FC<JobFormProps> = ({ onSubmit, initialData, hideHeading = false, onCancel }) => {
  const { data: session } = useSession();
  const isEmployer = session?.user?.role === 'employer';
  const isManager = session?.user?.role === 'manager';
  
  // Basic Job Information
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  
  // Job Details
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('full-time');
  const [workMode, setWorkMode] = useState('on-site');
  const [experience, setExperience] = useState('');
  const [industry, setIndustry] = useState('');
  
  // Salary and Compensation
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [benefits, setBenefits] = useState('');
  
  // Job Description
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');
  const [skills, setSkills] = useState('');
  
  // Application Details
  const [deadline, setDeadline] = useState('');
  const [applicationEmail, setApplicationEmail] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  
  // Additional Settings
  const [status, setStatus] = useState('open');
  const [isInternalOnly, setIsInternalOnly] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  
  // Team members and managers data state
  const [companyEmployees, setCompanyEmployees] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  
  // Function to fetch company employees based on user role
  const fetchCompanyEmployees = async () => {
    try {
      if (isEmployer) {
        // For employers, fetch all employees and managers
        const response = await fetch('/api/recruiter/employer/employees');
        if (response.ok) {
          const data = await response.json();
          setCompanyEmployees(data.employees || []);
          
          // Separate managers for the dropdown
          setManagers(data.employees.filter((emp: any) => emp.role === 'manager') || []);
          setLoading(false);
        } else {
          // Handle API error - set loading to false so UI renders
          console.error('Error fetching employees:', await response.text());
          setLoading(false);
        }
      } else if (isManager) {
        // For managers, fetch only their team members
        await fetchManagerTeamMembers();
      } else {
        // Set loading to false if no role match
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
    }
  };
  
  // Function to fetch team members for a manager
  const fetchManagerTeamMembers = async () => {
    if (!session?.user?.id) return;
    
    try {
      // Get all teams managed by this manager
      const teamsResponse = await fetch('/api/recruiter/employer/teams');
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        const managedTeams = teamsData.teams.filter((team: any) => team.manager?.id === session.user.id);
        
        // Get all employees in those teams
        let members: any[] = [];
        managedTeams.forEach((team: any) => {
          members = [...members, ...team.members];
        });
        
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };
  
  useEffect(() => {
    if (session?.user?.id) {
      fetchCompanyEmployees();
    }
  }, [session]);
  
  // Function to reset form to initial values or clear fields
  const resetForm = () => {
    if (initialData) {
      // Reset to initial data if editing
      setTitle(initialData.title);
      setCompany(initialData.company || '');
      setDepartment(initialData.department || '');
      
      setLocation(initialData.location);
      setJobType(initialData.jobType || 'full-time');
      setWorkMode(initialData.workMode || 'on-site');
      setExperience(initialData.experience || '');
      setIndustry(initialData.industry || '');
      
      setSalary(initialData.salary || '');
      setCurrency(initialData.currency || 'USD');
      setBenefits(initialData.benefits || '');
      
      setSummary(initialData.summary || '');
      setDescription(initialData.description);
      setResponsibilities(initialData.responsibilities || '');
      setRequirements(initialData.requirements.join('\n'));
      setSkills(initialData.skills?.join('\n') || '');
      
      setDeadline(initialData.deadline || '');
      setApplicationEmail(initialData.applicationEmail || '');
      setApplicationUrl(initialData.applicationUrl || '');
      setContactPerson(initialData.contactPerson || '');
      
      setStatus(initialData.status);
      setIsInternalOnly(initialData.isInternalOnly || false);
      setIsFeatured(initialData.isFeatured || false);
      setAssignedTo(initialData.assignedToUser?.id || '');
    } else {
      // Clear form if creating new job
      setTitle('');
      setCompany('');
      setDepartment('');
      
      setLocation('');
      setJobType('full-time');
      setWorkMode('on-site');
      setExperience('');
      setIndustry('');
      
      setSalary('');
      setCurrency('USD');
      setBenefits('');
      
      setSummary('');
      setDescription('');
      setResponsibilities('');
      setRequirements('');
      setSkills('');
      
      setDeadline('');
      setApplicationEmail('');
      setApplicationUrl('');
      setContactPerson('');
      
      setStatus('open');
      setIsInternalOnly(false);
      setIsFeatured(false);
      setAssignedTo('');
    }
    
    // Clear any errors
    setErrors({});
  };
  
  // If initialData is provided, populate the form for editing
  useEffect(() => {
    if (initialData) {
      // Basic Information
      setTitle(initialData.title);
      setCompany(initialData.company || '');
      setDepartment(initialData.department || '');
      
      // Job Details
      setLocation(initialData.location);
      setJobType(initialData.jobType || 'full-time');
      setWorkMode(initialData.workMode || 'on-site');
      setExperience(initialData.experience || '');
      setIndustry(initialData.industry || '');
      
      // Salary and Compensation
      setSalary(initialData.salary || '');
      setCurrency(initialData.currency || 'USD');
      setBenefits(initialData.benefits || '');
      
      // Job Description
      setSummary(initialData.summary || '');
      setDescription(initialData.description);
      setResponsibilities(initialData.responsibilities || '');
      setRequirements(initialData.requirements.join('\n'));
      setSkills(initialData.skills?.join('\n') || '');
      
      // Application Details
      setDeadline(initialData.deadline || '');
      setApplicationEmail(initialData.applicationEmail || '');
      setApplicationUrl(initialData.applicationUrl || '');
      setContactPerson(initialData.contactPerson || '');
      
      // Additional Settings
      setStatus(initialData.status);
      setIsInternalOnly(initialData.isInternalOnly || false);
      setIsFeatured(initialData.isFeatured || false);
      setAssignedTo(initialData.assignedToUser?.id || '');
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!title.trim()) newErrors.title = 'Job title is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!requirements.trim()) newErrors.requirements = 'At least one requirement is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorId = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorId);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const requirementsList = requirements
        .split('\n')
        .filter(req => req.trim() !== '');
      
      const skillsList = skills
        .split('\n')
        .filter(skill => skill.trim() !== '');
      
      const assignedEmployee = assignedTo ? companyEmployees.find(emp => emp.id === assignedTo) : null;
      
      const jobData = {
        id: initialData?.id || uuidv4(),
        title,
        company,
        department,
        location,
        jobType,
        workMode,
        experience,
        industry,
        salary,
        currency,
        benefits,
        summary,
        description,
        responsibilities,
        requirements: requirementsList,
        skills: skillsList,
        deadline,
        applicationEmail,
        applicationUrl,
        contactPerson,
        status: status as 'open' | 'closed' | 'draft',
        isInternalOnly,
        isFeatured,
        postedDate: initialData?.postedDate || new Date().toISOString().slice(0, 10),
        postedBy: mockUsers[0].id, // In a real app this would be the logged-in user's ID
        assignedToUser: assignedEmployee ? {
          id: assignedEmployee.id,
          name: assignedEmployee.name,
          role: assignedEmployee.role
        } : null,
        applications: initialData?.applications || [],
      };
      
      console.log('Submitting job data:', jobData);
      
      // Call the onSubmit function passed from the parent component
      onSubmit(jobData as JobPosting);
      
    } catch (error) {
      console.error('Error submitting job:', error);
      alert('Failed to save job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {!hideHeading && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
        {initialData ? 'Edit Job Posting' : 'Post a New Job'}
      </h2>
          <p className="text-gray-600">Complete the form below with details about the position</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Basic Job Information */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary to-primary-light px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Basic Job Information</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">
                Job Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
                className={`form-input w-full ${errors.title ? 'border-red-500' : ''}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
                placeholder="e.g. Senior Software Engineer"
          />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
        </div>
        
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="company">
                  Company
          </label>
                <input
                  id="company"
                  type="text"
                  className="form-input w-full"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corporation"
          />
        </div>
        
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="department">
                  Department
          </label>
                <input
                  id="department"
                  type="text"
                  className="form-input w-full"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
          />
        </div>
            </div>
          </div>
        </section>
        
        {/* Job Details */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary to-primary-light px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Job Details</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
          <label className="block text-sm font-medium mb-1" htmlFor="location">
                Location <span className="text-red-500">*</span>
          </label>
          <input
            id="location"
            type="text"
                className={`form-input w-full ${errors.location ? 'border-red-500' : ''}`}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
                placeholder="e.g. New York, NY or Remote"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-500">{errors.location}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="jobType">
                  Job Type
                </label>
                <select
                  id="jobType"
                  className="form-select w-full"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="workMode">
                  Work Mode
                </label>
                <select
                  id="workMode"
                  className="form-select w-full"
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                >
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="experience">
                  Experience Required
                </label>
                <input
                  id="experience"
                  type="text"
                  className="form-input w-full"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 3-5 years"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="industry">
                  Industry
                </label>
                <input
                  id="industry"
                  type="text"
                  className="form-input w-full"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Information Technology"
          />
        </div>
            </div>
          </div>
        </section>
        
        {/* Salary and Compensation */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary to-primary-light px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Salary & Compensation</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" htmlFor="salary">
                  Salary Range
          </label>
          <input
            id="salary"
            type="text"
                  className="form-input w-full"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. 80,000 - 100,000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="currency">
                  Currency
                </label>
                <select
                  id="currency"
                  className="form-select w-full"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="benefits">
                Benefits
              </label>
              <textarea
                id="benefits"
                className="form-input w-full min-h-[100px]"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="e.g. Health insurance, 401(k) matching, flexible work hours, etc."
              />
            </div>
          </div>
        </section>
        
        {/* Job Description */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary to-primary-light px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Job Description</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="summary">
                Summary
              </label>
              <textarea
                id="summary"
                className="form-input w-full min-h-[80px]"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief overview of the position and your company"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="description">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                className={`form-input w-full min-h-[150px] ${errors.description ? 'border-red-500' : ''}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Full description of the job, including day-to-day responsibilities"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="responsibilities">
                Key Responsibilities
              </label>
              <textarea
                id="responsibilities"
                className="form-input w-full min-h-[100px]"
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="Specific duties and responsibilities of the role"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="requirements">
                Requirements <span className="text-red-500">*</span>
              </label>
              <textarea
                id="requirements"
                className={`form-input w-full min-h-[100px] ${errors.requirements ? 'border-red-500' : ''}`}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                required
                placeholder="Bachelor's degree in Computer Science\n5+ years of experience in software development\nKnowledge of React and Node.js"
              />
              {errors.requirements && (
                <p className="mt-1 text-sm text-red-500">{errors.requirements}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Enter one requirement per line</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="skills">
                Skills
              </label>
              <textarea
                id="skills"
                className="form-input w-full min-h-[100px]"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="JavaScript\nReact\nNode.js\nSQL"
              />
              <p className="text-xs text-gray-500 mt-1">Enter one skill per line</p>
            </div>
          </div>
        </section>
        
        {/* Application Details */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary to-primary-light px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Application Details</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="deadline">
                Application Deadline
              </label>
              <input
                id="deadline"
                type="date"
                className="form-input w-full"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="applicationEmail">
                  Application Email
                </label>
                <input
                  id="applicationEmail"
                  type="email"
                  className="form-input w-full"
                  value={applicationEmail}
                  onChange={(e) => setApplicationEmail(e.target.value)}
                  placeholder="e.g. careers@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="applicationUrl">
                  Application URL
                </label>
                <input
                  id="applicationUrl"
                  type="url"
                  className="form-input w-full"
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  placeholder="e.g. https://company.com/careers/apply"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="contactPerson">
                Contact Person
              </label>
              <input
                id="contactPerson"
                type="text"
                className="form-input w-full"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. John Doe, HR Manager"
          />
        </div>
          </div>
        </section>
        
        {/* Additional Settings */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary to-primary-light px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Additional Settings</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Assigned To:</strong> When you assign a job to a specific person, they will automatically become responsible for posting and managing this job listing.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="status">
                Job Status
              </label>
              <select
                id="status"
                className="form-select w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="open">Open (Published)</option>
                <option value="closed">Closed (No longer accepting applications)</option>
                <option value="draft">Draft (Not publicly visible)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  id="isInternalOnly"
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-primary rounded"
                  checked={isInternalOnly}
                  onChange={(e) => setIsInternalOnly(e.target.checked)}
                />
                <label htmlFor="isInternalOnly" className="ml-2 text-sm text-gray-700">
                  Internal Only (Only visible to employees)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="isFeatured"
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-primary rounded"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700">
                  Featured Job (Highlighted on job listings)
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="assignedTo">
                Assigned To
              </label>
              <select
                id="assignedTo"
                className="form-select w-full"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Select assignees...</option>
                {isEmployer && (
                  <>
                    <optgroup label="Managers">
                      {loading ? (
                        <option disabled>Loading managers...</option>
                      ) : managers.length > 0 ? (
                        managers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name} (Manager - {manager.team?.name || 'No Team'})
                          </option>
                        ))
                      ) : (
                        <option disabled>No managers available</option>
                      )}
                    </optgroup>
                    <optgroup label="All Employees">
                      {loading ? (
                        <option disabled>Loading employees...</option>
                      ) : companyEmployees.filter(emp => emp.role === 'employee').length > 0 ? (
                        companyEmployees
                          .filter(emp => emp.role === 'employee')
                          .map(employee => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name} (Employee - {employee.team?.name || 'No Team'})
                            </option>
                          ))
                      ) : (
                        <option disabled>No employees available</option>
                      )}
                    </optgroup>
                  </>
                )}
                {isManager && (
                  <optgroup label="Team Members">
                    {loading ? (
                      <option disabled>Loading team members...</option>
                    ) : teamMembers.length > 0 ? (
                      teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} (Employee - {member.team?.name || 'No Team'})
                        </option>
                      ))
                    ) : (
                      <option disabled>No team members available</option>
                    )}
                  </optgroup>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selected person will automatically post this job upon assignment
              </p>
            </div>
          </div>
        </section>
        
        {/* Fixed action bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 z-10 shadow-md rounded-b-lg">
          <div className="flex justify-end space-x-4 max-w-7xl mx-auto">
          <button 
            type="button" 
              className="btn flex items-center px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={resetForm}
            >
              <FaUndo className="mr-2" />
            Reset
          </button>
            
          <button 
            type="submit" 
              className="btn flex items-center px-6 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
            disabled={isSubmitting}
          >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {initialData ? 'Update Job' : 'Post Job'}
                </>
              )}
          </button>
          </div>
        </div>
      </form>
      
      {/* Cancel confirmation modal */}
      {showConfirmCancel && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FaExclamationCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cancel Job Creation?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to cancel? All unsaved changes will be lost.  
              </p>
              
              <div className="flex justify-center space-x-4 mt-5">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={() => setShowConfirmCancel(false)}
                >
                  Continue Editing
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => {
                    if (onCancel) {
                      onCancel();
                    } else {
                      window.location.reload();
                    }
                  }}
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobForm; 