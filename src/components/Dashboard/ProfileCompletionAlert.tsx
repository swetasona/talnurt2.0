import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaExclamationCircle } from 'react-icons/fa';

interface ProfileCompletionAlertProps {
  userId: string;
}

const ProfileCompletionAlert: React.FC<ProfileCompletionAlertProps> = ({ userId }) => {
  const [profileCompletion, setProfileCompletion] = useState<{
    isComplete: boolean;
    details: {
      hasEducation: boolean;
      hasExperience: boolean;
      hasSkills: boolean;
      hasResume: boolean;
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        const response = await fetch(`/api/profile/is-complete?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setProfileCompletion(data);
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      checkProfileCompletion();
    }
  }, [userId]);

  const getMissingProfileSections = () => {
    if (!profileCompletion) return [];
    
    const missing = [];
    if (!profileCompletion.details.hasEducation) missing.push('education details');
    if (!profileCompletion.details.hasResume) missing.push('resume');
    if (!profileCompletion.details.hasExperience && !profileCompletion.details.hasSkills) missing.push('work experience or skills');
    
    return missing;
  };

  if (loading || !profileCompletion || profileCompletion.isComplete) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-lg shadow-md mb-8">
      <div className="flex">
        <div className="flex-shrink-0">
          <FaExclamationCircle className="h-6 w-6 text-blue-500" />
        </div>
        <div className="ml-4 w-full">
          <h3 className="text-lg font-semibold text-blue-800">
            Your profile is incomplete
          </h3>
          <div className="mt-2 text-blue-700">
            <p className="text-base">
              Complete your profile to apply for jobs.
            </p>
            {getMissingProfileSections().length > 0 && (
              <div className="mt-3 px-3 py-2 bg-white rounded-md shadow-sm">
                <p className="font-medium text-gray-700">Missing information:</p>
                <ul className="list-none mt-2 space-y-2">
                  {getMissingProfileSections().map((item, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                      <span className="capitalize">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-blue-700 mb-1">
              <span>Profile completion</span>
              <span className="font-medium">
                {Math.max(
                  10, 
                  Math.round(
                    100 - (getMissingProfileSections().length / 3) * 100
                  )
                )}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ 
                  width: `${Math.max(
                    10, 
                    Math.round(
                      100 - (getMissingProfileSections().length / 3) * 100
                    )
                  )}%` 
                }}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Link href="/profile" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Complete Your Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionAlert; 