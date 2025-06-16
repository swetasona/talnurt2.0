import React, { useState, useRef, useEffect } from 'react';
import { FaFileExcel, FaTimes, FaFilter, FaDownload, FaCheck } from 'react-icons/fa';
import { ExportFilters } from '@/utils/excelExport';

interface ExportFilterModalProps {
  onExport: (filters: ExportFilters) => void;
  onCancel: () => void;
  skillOptions: string[];
  industryOptions: string[];
  educationOptions: string[];
  isOpen?: boolean;
  onClose?: () => void;
  totalCandidates?: number;
}

const ExportFilterModal: React.FC<ExportFilterModalProps> = ({
  onExport,
  onCancel,
  skillOptions,
  industryOptions,
  educationOptions,
  isOpen,
  onClose,
  totalCandidates
}) => {
  const [filters, setFilters] = useState<ExportFilters>({
    skills: [],
    industries: [],
    minExperience: undefined,
    educationLevels: []
  });
  
  const [exportType, setExportType] = useState<'filtered' | 'all'>('filtered');
  
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);
  
  // Handle checkboxes for multi-select fields
  const handleCheckboxChange = (field: keyof ExportFilters, value: string) => {
    setFilters(prev => {
      const currentValues = prev[field] as string[];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [field]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [field]: [...currentValues, value]
        };
      }
    });
  };
  
  const handleMinExperienceChange = (value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    setFilters(prev => ({
      ...prev,
      minExperience: numValue
    }));
  };
  
  const handleSelectAll = (field: keyof ExportFilters, options: string[]) => {
    setFilters(prev => ({
      ...prev,
      [field]: [...options]
    }));
  };
  
  const handleClearAll = (field: keyof ExportFilters) => {
    setFilters(prev => ({
      ...prev,
      [field]: []
    }));
  };
  
  const handleExport = () => {
    // If exportType is 'all', pass empty filters
    if (exportType === 'all') {
      onExport({
        skills: [],
        industries: [],
        minExperience: undefined,
        educationLevels: []
      });
    } else {
      onExport(filters);
    }
    onCancel();
  };
  
  const resetFilters = () => {
    setFilters({
      skills: [],
      industries: [],
      minExperience: undefined,
      educationLevels: []
    });
  };
  
  // Count total filters applied
  const totalFiltersApplied = 
    filters.skills.length + 
    filters.industries.length + 
    (filters.minExperience !== undefined ? 1 : 0) + 
    filters.educationLevels.length;
    
  return (
    <div 
      ref={modalRef}
      className="bg-white rounded-lg w-full max-w-2xl flex flex-col shadow-xl overflow-hidden animate-fadeIn"
      style={{animation: 'fadeIn 0.3s ease-out'}}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-[#4154ef] to-[#5563f5] text-white flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <FaFileExcel className="mr-3" size={20} />
          Export Candidates
        </h2>
        <button
          className="text-white hover:text-gray-200 transition-colors rounded-full hover:bg-white hover:bg-opacity-20 p-1"
          onClick={onCancel}
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>
      </div>
      
      {/* Main Content */}
      <div className="p-5">
        <h3 className="text-lg font-medium text-gray-700 mb-1">What would you like to export?</h3>
        <p className="text-sm text-gray-500 mb-4">Choose whether to apply filters or export all candidates</p>
        
        {/* Filter Type Selection */}
        <div className="flex border rounded-lg mb-5 w-full overflow-hidden shadow-sm">
          <button
            className={`flex-1 py-2.5 px-4 text-sm font-medium flex justify-center items-center ${
              exportType === 'filtered' 
                ? 'bg-[#4154ef] text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            } transition-all duration-300 ease-in-out`}
            onClick={() => setExportType('filtered')}
          >
            <FaFilter className="mr-2" size={12} />
            Filtered
          </button>
          <button
            className={`flex-1 py-2.5 px-4 text-sm font-medium flex justify-center items-center ${
              exportType === 'all' 
                ? 'bg-[#4154ef] text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            } transition-all duration-300 ease-in-out`}
            onClick={() => setExportType('all')}
          >
            <svg className="mr-2 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            All Candidates
          </button>
        </div>
        
        {/* Filter Status */}
        <div className="flex items-center justify-between mb-4 py-3 border-b">
          <div className="flex items-center">
            <div className="bg-gray-100 p-1.5 rounded-md mr-2">
              <FaFilter className="text-[#4154ef]" size={12} />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {totalFiltersApplied === 0 
                ? 'No filters applied' 
                : `${totalFiltersApplied} filter${totalFiltersApplied === 1 ? '' : 's'} applied`}
            </span>
          </div>
          {totalFiltersApplied > 0 && (
            <button 
              onClick={resetFilters}
              className="text-sm text-[#4154ef] hover:text-[#3245df] font-medium transition-colors flex items-center"
            >
              Reset all
            </button>
          )}
        </div>
        
        {/* Filter Sections - only show if filtered is selected */}
        <div className={`${exportType === 'all' ? 'opacity-50 pointer-events-none' : ''} overflow-auto max-h-[400px] pr-2`}>
          {/* Skills Section */}
          <div className="mb-6 animate-fadeIn" style={{animationDelay: '0.1s'}}>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700 flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                Skills
              </h4>
              <div className="flex space-x-4">
                <button 
                  className="text-xs text-[#4154ef] hover:text-[#3245df] transition-colors flex items-center"
                  onClick={() => handleSelectAll('skills', skillOptions)}
                >
                  <FaCheck className="mr-1" size={9} />
                  Select all
                </button>
                <button 
                  className="text-xs text-[#4154ef] hover:text-[#3245df] transition-colors"
                  onClick={() => handleClearAll('skills')}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="border rounded-md overflow-y-auto max-h-32 p-2 bg-gray-50 shadow-inner">
              {skillOptions.map(skill => (
                <label key={skill} className="flex items-center py-1.5 px-2 hover:bg-white rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-[#4154ef] rounded mr-2 focus:ring-[#4154ef]"
                    checked={filters.skills.includes(skill)}
                    onChange={() => handleCheckboxChange('skills', skill)}
                  />
                  <span className="text-sm">{skill}</span>
                </label>
              ))}
              {skillOptions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">No skills available</p>
              )}
            </div>
          </div>
          
          {/* Industries Section */}
          <div className="mb-6 animate-fadeIn" style={{animationDelay: '0.2s'}}>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Industries
              </h4>
              <div className="flex space-x-4">
                <button 
                  className="text-xs text-[#4154ef] hover:text-[#3245df] transition-colors flex items-center"
                  onClick={() => handleSelectAll('industries', industryOptions)}
                >
                  <FaCheck className="mr-1" size={9} />
                  Select all
                </button>
                <button 
                  className="text-xs text-[#4154ef] hover:text-[#3245df] transition-colors"
                  onClick={() => handleClearAll('industries')}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="border rounded-md overflow-y-auto max-h-32 p-2 bg-gray-50 shadow-inner">
              {industryOptions.map(industry => (
                <label key={industry} className="flex items-center py-1.5 px-2 hover:bg-white rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-[#4154ef] rounded mr-2 focus:ring-[#4154ef]"
                    checked={filters.industries.includes(industry)}
                    onChange={() => handleCheckboxChange('industries', industry)}
                  />
                  <span className="text-sm">{industry}</span>
                </label>
              ))}
              {industryOptions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">No industries available</p>
              )}
            </div>
          </div>
          
          {/* Min Experience Section */}
          <div className="mb-6 animate-fadeIn" style={{animationDelay: '0.3s'}}>
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
              Minimum Work Experience
            </h4>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                className="w-full p-2.5 pl-3 border rounded shadow-sm focus:ring-[#4154ef] focus:border-[#4154ef] bg-gray-50"
                value={filters.minExperience === undefined ? '' : filters.minExperience}
                onChange={(e) => handleMinExperienceChange(e.target.value)}
                placeholder="Enter minimum years"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">years</span>
              </div>
            </div>
          </div>
          
          {/* Education Level Section */}
          <div className="animate-fadeIn" style={{animationDelay: '0.4s'}}>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700 flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                Education
              </h4>
              <div className="flex space-x-4">
                <button 
                  className="text-xs text-[#4154ef] hover:text-[#3245df] transition-colors flex items-center"
                  onClick={() => handleSelectAll('educationLevels', educationOptions)}
                >
                  <FaCheck className="mr-1" size={9} />
                  Select all
                </button>
                <button 
                  className="text-xs text-[#4154ef] hover:text-[#3245df] transition-colors"
                  onClick={() => handleClearAll('educationLevels')}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="border rounded-md overflow-y-auto max-h-32 p-2 bg-gray-50 shadow-inner">
              {educationOptions.map(education => (
                <label key={education} className="flex items-center py-1.5 px-2 hover:bg-white rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-[#4154ef] rounded mr-2 focus:ring-[#4154ef]"
                    checked={filters.educationLevels.includes(education)}
                    onChange={() => handleCheckboxChange('educationLevels', education)}
                  />
                  <span className="text-sm">{education}</span>
                </label>
              ))}
              {educationOptions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">No education levels available</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with actions */}
      <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
        <button
          type="button"
          className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        
        <button
          type="button"
          className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#4154ef] to-[#5563f5] hover:from-[#3245df] hover:to-[#4154ef] border border-transparent rounded-md shadow-sm flex items-center transition-all duration-300 ease-in-out"
          onClick={handleExport}
        >
          <FaDownload className="mr-2" />
          Export {exportType === 'filtered' && totalFiltersApplied > 0 ? `(${totalFiltersApplied} filters)` : ''}
        </button>
      </div>
    </div>
  );
};

export default ExportFilterModal;

// Add this to your global CSS file
const globalCss = `
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
`; 