import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchBarProps {
  onSearch?: (query: {skills: string, experience: string, location: string}) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('Fresher');
  const [location, setLocation] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        skills,
        experience,
        location
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="bg-white rounded-full shadow-lg p-2 sm:p-3 flex flex-col sm:flex-row items-center">
        {/* Skills/Designations/Companies Input */}
        <div className="relative flex-grow flex items-center w-full sm:w-auto">
          <div className="absolute left-4 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-3 py-3 sm:py-4 text-gray-700 bg-transparent rounded-full focus:outline-none"
            placeholder="Enter skills / designations / companies"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
        
        {/* Divider */}
        <div className="border-t sm:border-t-0 sm:border-l border-gray-200 w-full sm:w-auto my-2 sm:my-0 py-2 sm:py-0"></div>
        
        {/* Experience Dropdown */}
        <div className="relative w-full sm:w-auto flex items-center px-4 py-2">
          <div className="flex-grow">
            <select 
              className="w-full appearance-none bg-transparent border-none text-gray-700 py-2 pl-0 pr-8 focus:outline-none cursor-pointer"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="Fresher">Fresher</option>
              <option value="1-3 Years">1-3 Years</option>
              <option value="3-5 Years">3-5 Years</option>
              <option value="5+ Years">5+ Years</option>
            </select>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t sm:border-t-0 sm:border-l border-gray-200 w-full sm:w-auto my-2 sm:my-0 py-2 sm:py-0"></div>
        
        {/* Location Input */}
        <div className="relative flex-grow flex items-center w-full sm:w-auto">
          <div className="absolute left-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-3 py-3 sm:py-4 text-gray-700 bg-transparent rounded-full focus:outline-none"
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        
        {/* Search Button */}
        <button 
          onClick={handleSearch}
          className="mt-3 sm:mt-0 sm:ml-3 px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors duration-200 w-full sm:w-auto"
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
