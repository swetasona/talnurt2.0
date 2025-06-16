import React from 'react';
import { FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaBriefcase } from 'react-icons/fa';
import { JobPosting } from '@/types';
import Link from 'next/link';

interface PublicJobCardProps {
  job: JobPosting;
  index?: number; // Used to determine card color
}

const PublicJobCard: React.FC<PublicJobCardProps> = ({ job, index = 0 }) => {
  // Define job type styling
  let jobTypeStyle = "";
  let jobTypeText = "";
  
  if (job.workMode?.toLowerCase() === "remote") {
    jobTypeStyle = "text-orange-600";
    jobTypeText = "remote";
  } else if (job.workMode?.toLowerCase() === "hybrid") {
    jobTypeStyle = "text-blue-600";
    jobTypeText = "hybrid";
  } else {
    jobTypeStyle = "text-rose-600";
    jobTypeText = "on-site";
  }
  
  // Format salary with currency symbol
  let formattedSalary = "Salary Undisclosed";
  if (job.salary) {
    // Get currency code
    const currencyCode = 
      job.currency === "USD" ? "USD" : 
      job.currency === "CAD" ? "CAD" : 
      job.currency === "AUD" ? "AUD" : 
      job.currency || "USD";
    
    // Check if salary is a range
    let salaryText = "";
    if (typeof job.salary === 'string' && job.salary.includes('-')) {
      // Split by dash and format each part
      const parts = job.salary.split('-').map(part => {
        const trimmed = part.trim();
        // Add comma separators to numbers
        return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      });
      salaryText = `${parts[0]} - ${parts[1]}`;
    } else {
      // Format with comma separators
      salaryText = job.salary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    formattedSalary = `${currencyCode} ${salaryText}`;
  }
  
  // Define color based on index
  const colors = [
    "bg-blue-500", // Blue for first card
    "bg-indigo-500", // Indigo for second card
    "bg-purple-500", // Purple for third card
    "bg-teal-500" // Teal for fourth card
  ];
  
  const cardColor = colors[index % colors.length];
  const iconBgColors = [
    "bg-blue-100", "bg-indigo-100", "bg-purple-100", "bg-teal-100"
  ];
  const iconColor = index % 4 === 0 ? "text-blue-500" : 
                   index % 4 === 1 ? "text-indigo-500" :
                   index % 4 === 2 ? "text-purple-500" : 
                   "text-teal-500";

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border border-gray-100">
      <div className={`h-3 ${cardColor} w-full`}></div>
      <div className="p-6">
        <div className="flex gap-4 mb-4">
          <div className={`${iconBgColors[index % 4]} w-12 h-12 rounded-lg flex items-center justify-center shrink-0`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
            <p className="text-gray-500 text-sm">{job.company || "Company"}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>{job.location}</span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className={`${jobTypeStyle} text-sm lowercase`}>
            {jobTypeText}
          </span>
          <div className="text-gray-900 font-medium">
            {formattedSalary}
            <span className="text-xs text-gray-500"> / yr</span>
          </div>
        </div>
        
        <Link 
          href={`/jobs/${job.id}`}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center"
        >
          <span>Apply Now</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default PublicJobCard; 