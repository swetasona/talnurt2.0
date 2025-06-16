import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaSave, FaUndo, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  team?: {
    name: string;
  };
}

interface Manager {
  id: string;
  name: string;
  email: string;
  company_id?: string;
  team_id?: string;
}

const ProfileAllocation: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  
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
  
  // Profile Allocation Specific Fields
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [portalNotifications, setPortalNotifications] = useState(true);
  const [priority, setPriority] = useState('medium');
  const [responseDeadline, setResponseDeadline] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Data and state management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Fetch employees and managers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch employees
        console.log('Fetching employees...');
        const employeesResponse = await fetch('/api/recruiter/employer/employees');
        console.log('Employees response status:', employeesResponse.status);
        
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          console.log('Employees data:', employeesData);
          console.log('Number of employees:', employeesData.employees?.length || 0);
          
          // Log employees by role for debugging
          if (employeesData.employees?.length > 0) {
            const roleGroups = employeesData.employees.reduce((acc: Record<string, Employee[]>, emp: Employee) => {
              if (!acc[emp.role]) acc[emp.role] = [];
              acc[emp.role].push(emp);
              return acc;
            }, {});
            
            console.log('Employees by role:');
            Object.keys(roleGroups).forEach(role => {
              console.log(`${role}: ${roleGroups[role].length}`);
            });
          }
          
          setEmployees(employeesData.employees || []);
        } else {
          console.error('Failed to fetch employees:', employeesResponse.status, employeesResponse.statusText);
          const errorText = await employeesResponse.text();
          console.error('Error response:', errorText);
        }

        // Fetch managers
        console.log('Fetching managers...');
        const managersResponse = await fetch('/api/recruiter/employer/managers');
        console.log('Managers response status:', managersResponse.status);
        
        if (managersResponse.ok) {
          const managersData = await managersResponse.json();
          console.log('Managers data:', managersData);
          console.log('Number of managers:', managersData.managers?.length || 0);
          setManagers(managersData.managers || []);
        } else {
          console.error('Failed to fetch managers:', managersResponse.status, managersResponse.statusText);
          const errorText = await managersResponse.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load employees and managers');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Form validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = 'Job title is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!description.trim()) newErrors.description = 'Job description is required';
    if (!requirements.trim()) newErrors.requirements = 'Requirements are required';
    if (selectedEmployees.length === 0) newErrors.employees = 'Please select at least one employee';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = {
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
        requirements: requirements.split('\n').filter(req => req.trim()),
        skills: skills.split('\n').filter(skill => skill.trim()),
        deadline,
        applicationEmail,
        applicationUrl,
        contactPerson,
        selectedEmployees,
        emailNotifications,
        portalNotifications,
        priority,
        responseDeadline,
        additionalNotes,
      };

      const response = await fetch('/api/recruiter/employer/profile-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show success toast
        toast.success('Profile allocation created successfully!', {
          duration: 5000,
          style: {
            background: '#22c55e',
            color: '#fff',
            fontWeight: 'bold',
          },
          icon: <FaCheckCircle className="text-white" />,
        });
        
        // Show custom success alert
        setShowSuccessAlert(true);
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/recruiter/employer/dashboard');
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create profile allocation');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to create profile allocation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
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
    setSelectedEmployees([]);
    setEmailNotifications(true);
    setPortalNotifications(true);
    setPriority('medium');
    setResponseDeadline('');
    setAdditionalNotes('');
    setErrors({});
  };

  // Handle employee selection
  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <RecruiterLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Success Alert */}
        {showSuccessAlert && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all">
              <div className="rounded-t-lg bg-gradient-to-r from-green-600 to-green-700 p-6 flex items-center justify-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <FaCheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="border-x border-green-100">
                <div className="text-center pt-5 px-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    Profile Allocated Successfully!
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <p className="text-gray-600 text-lg text-center">
                    The profile has been successfully allocated to the selected employees.
                  </p>
                </div>
              </div>
              <div className="bg-green-50 px-6 py-4 rounded-b-lg border-x border-b border-green-100">
                <div className="flex justify-center">
                  <p className="text-sm text-gray-500">
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Profile Allocation
            </h2>
            <p className="text-gray-600">Allocate job profiles to your team members</p>
            {/* Debug info */}
            <div className="mt-2 text-sm text-gray-500">
              Debug: {employees.length} employees loaded, Loading: {loading ? 'Yes' : 'No'}
              <div>
                <strong>Employees by role:</strong>
                <ul className="list-disc pl-5">
                  {['manager', 'employee', 'recruiter', 'unassigned'].map(role => (
                    <li key={role}>
                      {role}: {employees.filter(emp => emp.role === role).length}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

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
                    placeholder="Bachelor's degree in Computer Science&#10;5+ years of experience in software development&#10;Knowledge of React and Node.js"
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
                    placeholder="JavaScript&#10;React&#10;Node.js&#10;SQL"
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

            {/* Employee Selection */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 bg-gradient-to-r from-primary to-primary-light px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Employee Selection</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="employees">
                    Select Employees <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    Choose employees to allocate this profile to. You can select multiple employees.
                  </p>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading employees...</p>
                    </div>
                  ) : employees.length === 0 && managers.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">No employees found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You need to add employees to your company before you can allocate profiles.
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => router.push('/recruiter/employer/employees')}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Add Employees
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-4">
                      <div>
                        <select
                          className="form-select w-full"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleEmployeeToggle(e.target.value);
                              e.target.value = ''; // Reset select after selection
                            }
                          }}
                        >
                          <option value="">Select employees to add...</option>
                          
                          {/* Managers Group */}
                          {managers.length > 0 && (
                            <optgroup label={`Managers (${managers.filter(m => !selectedEmployees.includes(m.id)).length})`}>
                              {managers
                                .filter(manager => !selectedEmployees.includes(manager.id))
                                .map(manager => (
                                  <option key={manager.id} value={manager.id}>
                                    {manager.name} ({manager.email})
                                  </option>
                                ))}
                            </optgroup>
                          )}
                          
                          {/* Employees Group */}
                          {employees.filter(emp => emp.role === 'employee').length > 0 && (
                            <optgroup label={`Employees (${employees.filter(emp => emp.role === 'employee' && !selectedEmployees.includes(emp.id)).length})`}>
                              {employees
                                .filter(emp => emp.role === 'employee' && !selectedEmployees.includes(emp.id))
                                .map(employee => (
                                  <option key={employee.id} value={employee.id}>
                                    {employee.name} ({employee.email})
                                  </option>
                                ))}
                            </optgroup>
                          )}
                          
                          {/* Recruiters Group */}
                          {employees.filter(emp => emp.role === 'recruiter').length > 0 && (
                            <optgroup label={`Recruiters (${employees.filter(emp => emp.role === 'recruiter' && !selectedEmployees.includes(emp.id)).length})`}>
                              {employees
                                .filter(emp => emp.role === 'recruiter' && !selectedEmployees.includes(emp.id))
                                .map(recruiter => (
                                  <option key={recruiter.id} value={recruiter.id}>
                                    {recruiter.name} ({recruiter.email})
                                  </option>
                                ))}
                            </optgroup>
                          )}
                          
                          {/* Unassigned Group */}
                          {employees.filter(emp => emp.role === 'unassigned').length > 0 && (
                            <optgroup label={`Unassigned (${employees.filter(emp => emp.role === 'unassigned' && !selectedEmployees.includes(emp.id)).length})`}>
                              {employees
                                .filter(emp => emp.role === 'unassigned' && !selectedEmployees.includes(emp.id))
                                .map(unassigned => (
                                  <option key={unassigned.id} value={unassigned.id}>
                                    {unassigned.name} ({unassigned.email})
                                  </option>
                                ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                      
                      {/* Selected Employees */}
                      {selectedEmployees.length > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Selected Employees ({selectedEmployees.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedEmployees.map(id => {
                              const employee = [...employees, ...managers].find(e => e.id === id);
                              return (
                                <div 
                                  key={id}
                                  className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center"
                                >
                                  <span>{employee?.name || id}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleEmployeeToggle(id)}
                                    className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                                  >
                                    &times;
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {errors.employees && (
                        <p className="mt-1 text-sm text-red-500">{errors.employees}</p>
                      )}
                    </div>
                  )}
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
                      Allocating...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Allocate Profile
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Cancel Profile Allocation?</h3>
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
                        router.push('/recruiter/employer/dashboard');
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
      </div>
    </RecruiterLayout>
  );
};

export default ProfileAllocation;
