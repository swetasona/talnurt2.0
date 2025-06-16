import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaCheckCircle, FaClock, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface EmployerApplication {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface EmployerAccessApplicationProps {
  userRole: string;
}

const EmployerAccessApplication: React.FC<EmployerAccessApplicationProps> = ({ userRole }) => {
  const [application, setApplication] = useState<EmployerApplication | null>(null);
  const [hasApplication, setHasApplication] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show only for recruiter-type roles (but not employees, managers, admins/superadmins)
  const validRolesForEmployerAccess = ['recruiter', 'unassigned'];
  
  console.log('EmployerAccessApplication - userRole:', userRole, 'isValid:', validRolesForEmployerAccess.includes(userRole));
  
  useEffect(() => {
    if (validRolesForEmployerAccess.includes(userRole)) {
      fetchApplicationStatus();
    }
  }, [userRole]);

  if (!validRolesForEmployerAccess.includes(userRole)) {
    console.log('EmployerAccessApplication - hiding component due to invalid role');
    return null;
  }

  const fetchApplicationStatus = async () => {
    try {
      console.log('EmployerAccessApplication - fetching application status...');
      const response = await fetch('/api/recruiter/employer-access-status');
      console.log('EmployerAccessApplication - response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('EmployerAccessApplication - received data:', data);
        setHasApplication(data.hasApplication);
        setApplication(data.application);
      } else {
        const errorData = await response.json();
        console.error('EmployerAccessApplication - API error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching application status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyForEmployerAccess = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/recruiter/apply-employer-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setHasApplication(true);
        setApplication(data.application);
      } else {
        toast.error(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying for employer access:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaClock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <FaTimesCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FaExclamationTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Application Pending';
      case 'approved':
        return 'Application Approved';
      case 'rejected':
        return 'Application Rejected';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your employer access application is being reviewed by the admin team. You will be notified once a decision is made.';
      case 'approved':
        return 'Congratulations! Your employer access application has been approved. You now have enhanced permissions.';
      case 'rejected':
        return 'Your employer access application was not approved at this time. Please contact the admin team for more information.';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg border-2 border-blue-200 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center ring-2 ring-blue-300">
            <FaShieldAlt className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span>🚀 Employer Access Application</span>
          </h3>
          
          {hasApplication && application ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(application.status)}
                <span className="font-medium text-gray-900">
                  {getStatusText(application.status)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600">
                {getStatusDescription(application.status)}
              </p>
              
              {application.admin_notes && (
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                  <p className="text-sm text-gray-600">{application.admin_notes}</p>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                Applied on: {new Date(application.created_at).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600">
                Apply for employer access to unlock additional features and permissions for managing job postings and candidates.
              </p>
              
              <div className="bg-blue-50 rounded-md p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Benefits of Employer Access:</h4>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li>Enhanced job posting capabilities</li>
                  <li>Advanced candidate management tools</li>
                  <li>Priority support from our team</li>
                  <li>Access to premium features</li>
                </ul>
              </div>
              
              <button
                onClick={handleApplyForEmployerAccess}
                disabled={isSubmitting}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                } transition-colors`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaShieldAlt className="h-4 w-4 mr-2" />
                    Apply for Employer Access
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerAccessApplication; 