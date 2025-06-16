import React, { useState, useRef } from 'react';
import { FaFileExcel, FaUpload, FaDownload, FaCheck, FaTimes } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { Candidate } from '@/types';
import * as XLSX from 'xlsx';

interface ExcelUploaderProps {
  onUpload: (candidates: Candidate[]) => void;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Candidate[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setPreviewData([]);
    setIsPreviewMode(false);
    
    if (!selectedFile) {
      return;
    }
    
    // Check file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls' && fileExtension !== 'csv') {
      setError('Please upload an Excel file (xlsx, xls) or CSV file');
      return;
    }
    
    // Check file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size should be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
    
    // Parse the file for preview
    try {
      setIsLoading(true);
      const candidates = await parseExcelFile(selectedFile);
      setPreviewData(candidates);
      setIsPreviewMode(true);
    } catch (err: any) {
      setError(`Failed to parse file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const parseExcelFile = async (file: File): Promise<Candidate[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('Raw Excel data:', jsonData);
          
          // Transform the data into Candidate objects
          const candidates: Candidate[] = jsonData.map((row: any, index: number) => {
            console.log(`Processing row ${index}:`, row);
            
            // Extract skills (assuming they're comma-separated)
            const skillsString = row.skills || '';
            const skills = skillsString.split(',').map((s: string) => s.trim()).filter(Boolean);
            
            console.log(`Extracted for row ${index}:`, { 
              name: row.name || 'Unknown', 
              email: row.email || '', 
              phone: row.phone || '', 
              skills 
            });
            
            // Create a candidate object
            return {
              id: uuidv4(),
              name: row.name || 'Unknown',
              email: row.email || '',
              phone: row.phone || '',
              skills: skills,
              experience: parseExperience(row),
              education: parseEducation(row),
            };
          });
          
          console.log('Final parsed candidates:', candidates);
          resolve(candidates);
        } catch (err) {
          console.error('Error parsing Excel file:', err);
          reject(new Error('Failed to parse Excel file. Please check the format.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read the file'));
      };
      
      reader.readAsBinaryString(file);
    });
  };
  
  const parseExperience = (row: any) => {
    const experience = [];
    
    // Check if we have experience data
    if (row.company || row.title || row.experienceStartDate || row.experienceEndDate) {
      experience.push({
        company: row.company || 'Unknown Company',
        title: row.title || 'Unknown Position',
        startDate: row.experienceStartDate || '',
        endDate: row.experienceEndDate || '',
        description: row.experienceDescription || ''
      });
    }
    
    return experience;
  };
  
  const parseEducation = (row: any) => {
    const education = [];
    
    // Check if we have education data
    if (row.institution || row.degree || row.field || row.educationStartDate || row.educationEndDate) {
      education.push({
        institution: row.institution || 'Unknown Institution',
        degree: row.degree || '',
        field: row.field || '',
        startDate: row.educationStartDate || '',
        endDate: row.educationEndDate || ''
      });
    }
    
    return education;
  };

  const handleUpload = () => {
    if (previewData.length === 0) {
      setError('No valid candidates found in the file');
      return;
    }
    
    onUpload(previewData);
    
    // Reset the state
    setFile(null);
    setPreviewData([]);
    setIsPreviewMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const downloadTemplate = () => {
    // Create a simple template
    const template = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        skills: 'JavaScript, React, Node.js',
        company: 'Example Corp',
        title: 'Senior Developer', 
        experienceStartDate: '2020-01',
        experienceEndDate: '2023-01',
        experienceDescription: 'Led development team',
        institution: 'University',
        degree: 'Bachelor',
        field: 'Computer Science',
        educationStartDate: '2012-09',
        educationEndDate: '2016-06'
      }
    ];
    
    // Convert to worksheet
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    
    // Generate and download the file
    XLSX.writeFile(wb, 'candidate_template.xlsx');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Bulk Upload Candidates</h2>
          <p className="text-gray-500 mt-1">Import multiple candidates at once from an Excel file</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
          onClick={downloadTemplate}
        >
          <FaDownload className="mr-2" />
          Download Template
        </button>
      </div>
      
      <div className="p-6">
        {!isPreviewMode ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 mb-4">
                <FaFileExcel className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Upload Excel File</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Upload an Excel or CSV file to import multiple candidates at once. Make sure your file follows the template format.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Accepted formats: .xlsx, .xls, .csv (max 10MB)
              </p>
            </div>
            
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            
            <button
              type="button"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors inline-flex items-center mx-auto"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Reading file...
                </>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  Select File
                </>
              )}
            </button>
            
            {file && !isLoading && (
              <div className="mt-5 flex items-center justify-center p-3 bg-blue-50 border border-blue-100 rounded-lg max-w-md mx-auto">
                <FaFileExcel className="text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">{file.name}</span>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg max-w-md mx-auto">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4 p-4 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>Found {previewData.length} candidates in the file. Please review before importing.</p>
              </div>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Education</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((candidate, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{candidate.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{candidate.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.map((skill, skillIndex) => (
                            <span key={skillIndex} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length === 0 && (
                            <span className="text-gray-400 italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {candidate.experience.length > 0 ? (
                          <div>
                            <div className="font-medium">{candidate.experience[0].title}</div>
                            <div>{candidate.experience[0].company}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {candidate.education.length > 0 ? (
                          <div>
                            <div>{candidate.education[0].degree} in {candidate.education[0].field}</div>
                            <div>{candidate.education[0].institution}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end space-x-4">
              <button
                type="button"
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                onClick={() => {
                  setIsPreviewMode(false);
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
              
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors flex items-center"
                onClick={handleUpload}
              >
                <FaCheck className="mr-2" />
                Import Candidates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUploader; 