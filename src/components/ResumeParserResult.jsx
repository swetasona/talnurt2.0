import React, { useState } from 'react';
import JsonTree from './shared/JsonTree';

// Main component
const ResumeParserResult = ({ parserResult }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [jsonView, setJsonView] = useState('tree'); // 'tree' or 'raw'

  if (!parserResult || !parserResult.success) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
        <h3 className="font-bold">Error Parsing Resume</h3>
        <p>{parserResult?.error || 'Unknown error occurred'}</p>
      </div>
    );
  }

  const { name, email, phone, skills, education, experience } = parserResult;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">Parsed Resume Data</h2>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'education'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Education
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'experience'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Experience
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'skills'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Skills
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'json'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            JSON Data
          </button>
        </nav>
      </div>
      
      {/* Content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-gray-600 font-medium">Name:</span> 
                  <span className="ml-2">{name || 'Not detected'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-gray-600 font-medium">Email:</span> 
                  <span className="ml-2">{email || 'Not detected'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-gray-600 font-medium">Phone:</span> 
                  <span className="ml-2">{phone || 'Not detected'}</span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p><span className="font-medium">Education:</span> {education.length} entries found</p>
                <p><span className="font-medium">Experience:</span> {experience.length} entries found</p>
                <p><span className="font-medium">Skills:</span> {skills.length} skills found</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'education' && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Education History</h3>
            {education.length > 0 ? (
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between">
                      <h4 className="font-semibold">{edu.description || 'Unnamed Degree'}</h4>
                      {edu.date && <span className="text-gray-600">{edu.date}</span>}
                    </div>
                    {edu.institution && <p className="text-gray-600 mt-1">{edu.institution}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No education history detected</p>
            )}
          </div>
        )}
        
        {activeTab === 'experience' && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Work Experience</h3>
            {experience.length > 0 ? (
              <div className="space-y-4">
                {experience.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between">
                      <h4 className="font-semibold">{exp.position || 'Unnamed Position'}</h4>
                      {exp.date && <span className="text-gray-600">{exp.date}</span>}
                    </div>
                    {exp.company && <p className="text-gray-600 mt-1">{exp.company}</p>}
                    {exp.description && (
                      <p className="mt-2 text-gray-700 whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No work experience detected</p>
            )}
          </div>
        )}
        
        {activeTab === 'skills' && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Skills</h3>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No skills detected</p>
            )}
          </div>
        )}
        
        {activeTab === 'json' && (
          <div>
            <div className="mb-4 flex space-x-4">
              <button
                onClick={() => setJsonView('tree')}
                className={`px-3 py-1 rounded ${
                  jsonView === 'tree' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Tree View
              </button>
              <button
                onClick={() => setJsonView('raw')}
                className={`px-3 py-1 rounded ${
                  jsonView === 'raw' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Raw JSON
              </button>
            </div>
            
              {jsonView === 'tree' ? (
              <div className="border rounded p-4 bg-gray-50">
                  <JsonTree data={parserResult} />
                </div>
              ) : (
              <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-xs">
                {JSON.stringify(parserResult, null, 2)}
              </pre>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeParserResult; 