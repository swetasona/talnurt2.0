import React, { useState, useRef } from 'react';
import { FaUpload } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { JobApplication } from '@/types';

interface ApplicationFormProps {
  jobId: string;
  onSubmit: (application: JobApplication) => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ jobId, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    
    if (!selectedFile) {
      return;
    }
    
    // Check file type
    const fileType = selectedFile.type;
    if (fileType !== 'application/pdf' && 
        fileType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setError('Please upload a PDF or DOCX file');
      return;
    }
    
    // Check file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please upload your resume');
      return;
    }
    
    // In a real app, you would upload the file first and get a URL
    // For now, we'll create a temporary URL
    const resumeUrl = URL.createObjectURL(file);
    
    const application: JobApplication = {
      id: uuidv4(),
      jobId,
      name,
      email,
      phone: phone || undefined,
      resumeUrl,
      status: 'pending',
      appliedDate: new Date().toISOString().slice(0, 10),
    };
    
    onSubmit(application);
    
    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-6">Apply for this Position</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="phone">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            className="form-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Resume (PDF or DOCX) <span className="text-red-500">*</span>
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            
            <button
              type="button"
              className="btn btn-secondary mb-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaUpload className="mr-2" />
              Select Resume
            </button>
            
            {file && (
              <div className="mt-2 text-sm font-medium text-gray-700">
                {file.name}
              </div>
            )}
            
            {error && (
              <div className="mt-2 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm; 