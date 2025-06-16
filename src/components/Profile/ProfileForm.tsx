import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FaExclamationTriangle, FaCheck, FaPhone, FaMapMarkerAlt, FaExclamationCircle, FaSearch, 
  FaGraduationCap, FaBriefcase, FaLightbulb, FaTrashAlt, FaPlus, FaUserAlt } from 'react-icons/fa';
import { Country, State, City } from 'country-state-city';
import type { ICountry, IState, ICity } from 'country-state-city';

interface Education {
  institution: string;
  degree: string;
  year: string;
}

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  currentlyWorking?: boolean;
}

interface Skill {
  name: string;
}

interface ContactInfo {
  phoneNumber?: string;
  countryCode?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

interface ProfileFormProps {
  initialData?: {
    education?: Education[];
    experience?: Experience[];
    skills?: Skill[];
    preferences?: {
      preferredLocation?: string;
      preferredRole?: string;
      preferredType?: string;
    };
    contactInfo?: ContactInfo;
    resume?: string | null;
  };
}

// Country codes data
const countryCodes = [
  { code: '+1', country: 'US/Canada', isoCode: 'US' },
  { code: '+44', country: 'UK', isoCode: 'GB' },
  { code: '+91', country: 'India', isoCode: 'IN' },
  { code: '+61', country: 'Australia', isoCode: 'AU' },
  { code: '+49', country: 'Germany', isoCode: 'DE' },
  { code: '+33', country: 'France', isoCode: 'FR' },
  { code: '+81', country: 'Japan', isoCode: 'JP' },
  { code: '+86', country: 'China', isoCode: 'CN' },
  { code: '+7', country: 'Russia', isoCode: 'RU' },
  { code: '+55', country: 'Brazil', isoCode: 'BR' },
  { code: '+34', country: 'Spain', isoCode: 'ES' },
  { code: '+39', country: 'Italy', isoCode: 'IT' },
  { code: '+1', country: 'Canada', isoCode: 'CA' },
  { code: '+52', country: 'Mexico', isoCode: 'MX' },
  { code: '+82', country: 'South Korea', isoCode: 'KR' },
  { code: '+65', country: 'Singapore', isoCode: 'SG' },
  { code: '+31', country: 'Netherlands', isoCode: 'NL' },
  { code: '+64', country: 'New Zealand', isoCode: 'NZ' },
  { code: '+27', country: 'South Africa', isoCode: 'ZA' },
  { code: '+41', country: 'Switzerland', isoCode: 'CH' },
  { code: '+46', country: 'Sweden', isoCode: 'SE' },
  { code: '+47', country: 'Norway', isoCode: 'NO' },
  { code: '+45', country: 'Denmark', isoCode: 'DK' },
  { code: '+358', country: 'Finland', isoCode: 'FI' },
  { code: '+32', country: 'Belgium', isoCode: 'BE' },
  { code: '+43', country: 'Austria', isoCode: 'AT' },
  { code: '+351', country: 'Portugal', isoCode: 'PT' },
  { code: '+353', country: 'Ireland', isoCode: 'IE' },
  { code: '+30', country: 'Greece', isoCode: 'GR' },
  { code: '+36', country: 'Hungary', isoCode: 'HU' },
  // Add more as needed
];

const ProfileForm: React.FC<ProfileFormProps> = ({ initialData = {} }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileCompletion, setProfileCompletion] = useState<{
    isComplete: boolean;
    details: {
      hasEducation: boolean;
      hasExperience: boolean;
      hasSkills: boolean;
      hasResume: boolean;
    };
  } | null>(null);

  // Education
  const [educations, setEducations] = useState<Education[]>(
    initialData.education || [{ institution: '', degree: '', year: '' }]
  );

  // Experience
  const [experiences, setExperiences] = useState<Experience[]>(
    initialData.experience || [{ title: '', company: '', startDate: '', endDate: '', currentlyWorking: false }]
  );

  // Skills
  const [skills, setSkills] = useState<Skill[]>(
    initialData.skills || [{ name: '' }]
  );

  // Contact Info - Updated for location and phone
  const [phoneNumber, setPhoneNumber] = useState<string>(
    initialData.contactInfo?.phoneNumber || ''
  );
  const [countryCode, setCountryCode] = useState<string>(
    initialData.contactInfo?.countryCode || '+1'
  );
  
  // For storing the actual values to be submitted
  const [city, setCity] = useState<string>(initialData.contactInfo?.city || '');
  const [state, setState] = useState<string>(initialData.contactInfo?.state || '');
  const [country, setCountry] = useState<string>(initialData.contactInfo?.country || '');
  
  // Countries, States, Cities from the library
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const [selectedState, setSelectedState] = useState<IState | null>(null);
  const [selectedCity, setSelectedCity] = useState<ICity | null>(null);
  
  // For search/filter functionality
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);
  
  // Add refs for dropdowns
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const countryCodeDropdownRef = useRef<HTMLDivElement>(null);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
      if (countryCodeDropdownRef.current && !countryCodeDropdownRef.current.contains(event.target as Node)) {
        setShowCountryCodeDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Load all countries on component mount
  useEffect(() => {
    const allCountries = Country.getAllCountries();
        setCountries(allCountries);
        
        // Try to restore selected country from initial data
        if (initialData.contactInfo?.country) {
          const matchedCountry = allCountries.find(
            (c: ICountry) => c.name.toLowerCase() === initialData.contactInfo?.country?.toLowerCase()
          );
          if (matchedCountry) {
            setSelectedCountry(matchedCountry);
            setCountry(matchedCountry.name);
          }
        }
  }, [initialData.contactInfo?.country]);
  
  // Load states based on selected country
  useEffect(() => {
      if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry.isoCode);
          setStates(countryStates);
          
          // Try to restore selected state from initial data
          if (initialData.contactInfo?.state) {
            const matchedState = countryStates.find(
              (s: IState) => s.name.toLowerCase() === initialData.contactInfo?.state?.toLowerCase()
            );
            if (matchedState) {
              setSelectedState(matchedState);
              setState(matchedState.name);
            } else {
              setSelectedState(null);
              setState('');
            }
        }
      } else {
        setStates([]);
        setSelectedState(null);
        setState('');
      }
  }, [selectedCountry, initialData.contactInfo?.state]);
  
  // Load cities based on selected state
  useEffect(() => {
      if (selectedCountry && selectedState) {
      const stateCities = City.getCitiesOfState(
            selectedCountry.isoCode, 
            selectedState.isoCode
          );
          setCities(stateCities);
          
          // Try to restore selected city from initial data
          if (initialData.contactInfo?.city) {
            const matchedCity = stateCities.find(
              (c: ICity) => c.name.toLowerCase() === initialData.contactInfo?.city?.toLowerCase()
            );
            if (matchedCity) {
              setSelectedCity(matchedCity);
              setCity(matchedCity.name);
            } else {
              setSelectedCity(null);
              setCity('');
            }
        }
      } else {
        setCities([]);
        setSelectedCity(null);
        setCity('');
      }
  }, [selectedState, selectedCountry, initialData.contactInfo?.city]);
  
  // Handle country selection
  const handleCountrySelect = (country: ICountry) => {
    setSelectedCountry(country);
    setCountry(country.name);
    // Reset state and city
    setSelectedState(null);
    setSelectedCity(null);
    setState('');
    setCity('');
    
    // Find the matching country code
    const countryCode = countryCodes.find(
      cc => cc.isoCode.toUpperCase() === country.isoCode.toUpperCase()
    )?.code || '+1';
    
    // Set the country code
    setCountryCode(countryCode);
    
    // Hide dropdown
    setShowCountryDropdown(false);
    setCountrySearchTerm('');
  };
  
  // Handle state selection
  const handleStateSelect = (state: IState) => {
    setSelectedState(state);
    setState(state.name);
    // Reset city
    setSelectedCity(null);
    setCity('');
  };
  
  // Handle city selection
  const handleCitySelect = (city: ICity) => {
    setSelectedCity(city);
    setCity(city.name);
    // Hide dropdown
    setShowCityDropdown(false);
    setCitySearchTerm('');
  };
  
  // Filter countries by search term
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );
  
  // Filter cities by search term
  const filteredCities = cities.filter(city => 
    city.name.toLowerCase().includes(citySearchTerm.toLowerCase())
  );

  // Preferences
  const [preferredLocation, setPreferredLocation] = useState<string>(
    initialData.preferences?.preferredLocation || ''
  );
  const [preferredRole, setPreferredRole] = useState<string>(
    initialData.preferences?.preferredRole || ''
  );
  const [preferredType, setPreferredType] = useState<string>(
    initialData.preferences?.preferredType || ''
  );

  // Resume upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResume, setExistingResume] = useState<string | null>(initialData.resume || null);
  const [showResumeUpload, setShowResumeUpload] = useState(!initialData.resume);

  // Resume Upload Section
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>(
    initialData.resume ? initialData.resume.split('/').pop() || '' : ''
  );

  // When component mounts, set preview URL for existing resume if it's a PDF
  useEffect(() => {
    if (existingResume && existingResume.toLowerCase().endsWith('.pdf')) {
      setResumePreviewUrl(existingResume);
    }
  }, [existingResume]);

  // Fetch profile completion status
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/profile/is-complete?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setProfileCompletion(data);
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    };
    
    checkProfileCompletion();
  }, [session]);

  // Try to get location info when city changes
  useEffect(() => {
    if (city) {
      // This is a mock implementation - in production, use a real geocoding API like Google Places API
      const cityToLocationMap: Record<string, { state: string, country: string }> = {
        'new york': { state: 'New York', country: 'USA' },
        'san francisco': { state: 'California', country: 'USA' },
        'chicago': { state: 'Illinois', country: 'USA' },
        'boston': { state: 'Massachusetts', country: 'USA' },
        'los angeles': { state: 'California', country: 'USA' },
        'seattle': { state: 'Washington', country: 'USA' },
        'austin': { state: 'Texas', country: 'USA' },
        'miami': { state: 'Florida', country: 'USA' },
        'london': { state: 'England', country: 'UK' },
        'manchester': { state: 'England', country: 'UK' },
        'birmingham': { state: 'England', country: 'UK' },
        'paris': { state: 'Île-de-France', country: 'France' },
        'berlin': { state: 'Berlin', country: 'Germany' },
        'tokyo': { state: 'Tokyo', country: 'Japan' },
        'mumbai': { state: 'Maharashtra', country: 'India' },
        'delhi': { state: 'Delhi', country: 'India' },
        'bangalore': { state: 'Karnataka', country: 'India' },
        'toronto': { state: 'Ontario', country: 'Canada' },
        'vancouver': { state: 'British Columbia', country: 'Canada' },
        'sydney': { state: 'New South Wales', country: 'Australia' },
        'melbourne': { state: 'Victoria', country: 'Australia' }
      };

      const cityLower = city.toLowerCase();
      const match = Object.entries(cityToLocationMap).find(([key]) => 
        cityLower.includes(key) || key.includes(cityLower)
      );

      if (match) {
        const [_, location] = match;
        setState(location.state);
        setCountry(location.country);
        
        // Set appropriate country code
        const countryCodeMap: {[key: string]: string} = {
          'USA': '+1',
          'Canada': '+1',
          'UK': '+44',
          'India': '+91',
          'Australia': '+61',
          'Germany': '+49',
          'France': '+33',
          'Japan': '+81',
        };
        
        if (countryCodeMap[location.country]) {
          setCountryCode(countryCodeMap[location.country]);
        }
      }
    }
  }, [city]);

  // Add/remove education fields
  const addEducation = () => {
    setEducations([...educations, { institution: '', degree: '', year: '' }]);
  };

  const removeEducation = (index: number) => {
    const newEducations = [...educations];
    newEducations.splice(index, 1);
    setEducations(newEducations);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const newEducations = [...educations];
    newEducations[index][field] = value;
    setEducations(newEducations);
  };

  // Add/remove experience fields
  const addExperience = () => {
    setExperiences([
      ...experiences,
      { title: '', company: '', startDate: '', endDate: '', currentlyWorking: false },
    ]);
  };

  const removeExperience = (index: number) => {
    const newExperiences = [...experiences];
    newExperiences.splice(index, 1);
    setExperiences(newExperiences);
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
    const newExperiences = [...experiences];
    if (field === 'currentlyWorking') {
      newExperiences[index][field] = value as boolean;
      if (value) {
        newExperiences[index].endDate = 'Present';
      } else {
        newExperiences[index].endDate = '';
      }
    } else {
      newExperiences[index][field as keyof (Omit<Experience, 'currentlyWorking'>)] = value as string;
    }
    setExperiences(newExperiences);
  };

  // Add/remove skill fields
  const addSkill = () => {
    setSkills([...skills, { name: '' }]);
  };

  const removeSkill = (index: number) => {
    const newSkills = [...skills];
    newSkills.splice(index, 1);
    setSkills(newSkills);
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index].name = value;
    setSkills(newSkills);
  };

  // Handle resume upload
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && 
          file.type !== 'application/msword' && 
          file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setError('Please upload a PDF, DOC, or DOCX file');
        return;
      }
      
      setResumeFile(file);
      setResumeFileName(file.name);
      
      // Create a preview URL for PDF files
      if (file.type === 'application/pdf') {
        const previewUrl = URL.createObjectURL(file);
        setResumePreviewUrl(previewUrl);
      } else {
        setResumePreviewUrl(null);
      }
      
      setError('');
    }
  };

  // Resume section
  const handleChangeResume = () => {
    setShowResumeUpload(true);
    setExistingResume(null);
    setResumePreviewUrl(null);
  };

  // Get missing profile sections
  const getMissingProfileSections = () => {
    if (!profileCompletion) return [];
    
    const missing = [];
    if (!profileCompletion.details.hasEducation) missing.push('education details');
    if (!profileCompletion.details.hasResume) missing.push('resume');
    if (!profileCompletion.details.hasExperience && !profileCompletion.details.hasSkills) missing.push('work experience or skills');
    
    // Additional missing field details
    if (!phoneNumber) missing.push('phone number');
    if (!city || !state || !country) missing.push('location information');
    if (!preferredRole || !preferredLocation || !preferredType) missing.push('job preferences');
    
    return missing;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate phone number if provided
    if (phoneNumber && !/^[0-9\s\-+()]*$/.test(phoneNumber)) {
      setError('Please enter a valid phone number');
      setIsLoading(false);
      return;
    }

    // Validate GitHub URL if provided
    if (githubUrl && !githubUrl.trim().startsWith('https://github.com/')) {
      setError('Please enter a valid GitHub URL (starting with https://github.com/)');
      setIsLoading(false);
      return;
    }

    // Validate LinkedIn URL if provided
    if (linkedinUrl && !linkedinUrl.trim().startsWith('https://linkedin.com/in/') && 
        !linkedinUrl.trim().startsWith('https://www.linkedin.com/in/')) {
      setError('Please enter a valid LinkedIn URL (starting with https://linkedin.com/in/ or https://www.linkedin.com/in/)');
      setIsLoading(false);
      return;
    }

    // Validate and clean up education data
    const validEducations = educations.filter(
      (edu) => edu.institution.trim() !== '' || edu.degree.trim() !== ''
      );

    // Validate and clean up experience data
    const validExperiences = experiences.filter(
      (exp) => exp.company.trim() !== '' || exp.title.trim() !== ''
      );

    // Validate and clean up skills data
    const validSkills = skills.filter((skill) => skill.name.trim() !== '');

    try {
      // Upload resume file if a new one is selected
      let resumeFileUrl = existingResume;
      
      if (resumeFile) {
        console.log('Uploading resume file:', resumeFile.name);
        const uploadFormData = new FormData();
        uploadFormData.append('file', resumeFile);

        const uploadResponse = await fetch('/api/profile/upload-resume', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload resume');
        }

        const uploadResult = await uploadResponse.json();
        resumeFileUrl = uploadResult.fileUrl;
        console.log('Resume uploaded successfully:', resumeFileUrl);
      }

      // Prepare data for API
      const formData = {
        education: validEducations,
        experience: validExperiences,
        skills: validSkills,
          contactInfo: {
            phoneNumber,
            countryCode,
            city,
            state,
            country,
          githubUrl,
          linkedinUrl
          },
          preferences: {
          preferredLocation: selectedCity ? selectedCity.name : '',
            preferredRole,
          preferredType
          },
        resumeUrl: resumeFileUrl
      };

      console.log('Saving profile data with resumeUrl:', resumeFileUrl);

      // Make API call to save profile
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      // Update the existingResume state with the new URL
      if (resumeFileUrl) {
        setExistingResume(resumeFileUrl);
        setResumeFile(null);
      }

      setSuccess('Profile updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'An error occurred while saving your profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      if (resumePreviewUrl) {
        URL.revokeObjectURL(resumePreviewUrl);
      }
    };
  }, [resumePreviewUrl]);

  // GitHub and LinkedIn URLs
  const [githubUrl, setGithubUrl] = useState<string>(
    initialData.contactInfo?.githubUrl || ''
  );
  const [linkedinUrl, setLinkedinUrl] = useState<string>(
    initialData.contactInfo?.linkedinUrl || ''
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      {/* Success message */}
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaCheck className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
                  </div>
              </div>
        </div>
      )}
              
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-500" />
                </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile completion status */}
      {profileCompletion && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary mr-2 text-xs">
                <FaUserAlt />
              </span>
              Profile Completion
              </h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div className="bg-gradient-to-r from-primary to-indigo-600 h-2.5 rounded-full"
                style={{ width: `${profileCompletion.isComplete ? '100' : '75'}%` }}>
              </div>
            </div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span>In Progress</span>
              <span>{profileCompletion.isComplete ? 'Complete' : 'Almost there!'}</span>
          </div>
        </div>
        </div>
      )}

      {/* Contact Information Section */}
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0 bg-gradient-to-r from-primary to-indigo-600 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md">1</div>
          <h2 className="text-2xl font-bold text-gray-800 ml-4 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Contact Information</h2>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
          {/* Country selection */}
          <div className="mb-5">
            <div className="flex justify-between">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
            </div>
            <div className="relative" ref={countryDropdownRef}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Select or search for a country"
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                  value={selectedCountry ? selectedCountry.name : countrySearchTerm}
                  onChange={(e) => {
                    setCountrySearchTerm(e.target.value);
                    setShowCountryDropdown(true);
                  }}
                  onClick={() => setShowCountryDropdown(true)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                    </div>
                </div>
                
                {showCountryDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                  <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                        placeholder="Search countries..."
                        value={countrySearchTerm}
                        onChange={(e) => setCountrySearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                      {filteredCountries.map((country) => (
                      <button
                          key={country.isoCode} 
                        type="button"
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                          selectedCountry?.isoCode === country.isoCode ? 'bg-blue-50 text-primary' : ''
                        }`}
                          onClick={() => handleCountrySelect(country)}
                        >
                        {country.name}
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">No countries found</div>
                    )}
                  </div>
                  </div>
                )}
            </div>
            </div>
            
          {/* State selection - Only show when country is selected */}
            {selectedCountry && (
            <div className="mb-5">
              <div className="flex justify-between">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
              </div>
              <div className="relative">
                <select
                  id="state"
                  value={selectedState?.isoCode || ''}
                  onChange={(e) => {
                    const stateCode = e.target.value;
                    const selected = states.find(s => s.isoCode === stateCode);
                    if (selected) {
                      handleStateSelect(selected);
                    } else {
                      setSelectedState(null);
                      setState('');
                      setSelectedCity(null);
                      setCity('');
                    }
                  }}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select a state/province</option>
                  {states.map((state) => (
                    <option key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              </div>
            )}
            
          {/* City selection - Only show when state is selected */}
          {selectedCountry && selectedState && (
            <div className="mb-5">
              <div className="flex justify-between">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                </label>
                      </div>
              {cities.length > 0 ? (
                <div className="relative">
                  <select
                    id="city"
                    value={selectedCity?.name || ''}
                    onChange={(e) => {
                      const cityName = e.target.value;
                      const selected = cities.find(c => c.name === cityName);
                      if (selected) {
                        handleCitySelect(selected);
                      } else {
                        setSelectedCity(null);
                        setCity('');
                      }
                    }}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select a city</option>
                    {cities.map((city) => (
                      <option key={city.name} value={city.name}>
                              {city.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </div>
              </div>
              ) : (
                <div className="italic text-gray-500 text-sm">No cities available for the selected state</div>
              )}
              </div>
            )}
            
          {/* Phone number */}
          <div className="mb-5">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
              </label>
            <div className="flex">
              <div className="relative" ref={countryCodeDropdownRef}>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-3 border border-gray-300 bg-gray-50 text-gray-700 rounded-l-lg hover:bg-gray-100 focus:outline-none"
                    onClick={() => setShowCountryCodeDropdown(!showCountryCodeDropdown)}
                  >
                    <span>{countryCode}</span>
                  <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                  {showCountryCodeDropdown && (
                  <div className="absolute z-10 mt-1 w-48 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                    <div className="py-1">
                        {countryCodes.map((cc) => (
                        <button
                            key={cc.code} 
                          type="button"
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                            countryCode === cc.code ? 'bg-blue-50 text-primary' : ''
                          }`}
                            onClick={() => {
                              setCountryCode(cc.code);
                              setShowCountryCodeDropdown(false);
                            }}
                          >
                          <span className="mr-2">{cc.code}</span>
                          <span className="text-sm text-gray-500">{cc.country}</span>
                        </button>
                        ))}
                    </div>
                    </div>
                  )}
              </div>
              
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                  placeholder="Phone number"
                />
              </div>
              </div>
            <p className="mt-1 text-xs text-gray-500">Format: {countryCode} + your phone number</p>
            </div>

          {/* Add GitHub and LinkedIn fields */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
              <div className="flex">
                <input
                  type="url"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://github.com/yourusername"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <div className="flex">
                <input
                  type="url"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://linkedin.com/in/yourusername"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education Section */}
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0 bg-gradient-to-r from-primary to-indigo-600 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md">2</div>
          <h2 className="text-2xl font-bold text-gray-800 ml-4 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Education</h2>
        </div>
        
        {educations.map((education, index) => (
          <div key={index} className="mb-6 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm relative">
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="absolute top-4 right-4 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors duration-200"
                aria-label="Remove education"
              >
                <FaTrashAlt className="h-4 w-4 text-red-500" />
              </button>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor={`institution-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Institution
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                <input
                  type="text"
                    id={`institution-${index}`}
                    value={education.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                  placeholder="University/College Name"
                    required
                />
              </div>
              </div>
              
              <div>
                <label htmlFor={`degree-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Degree/Certificate
                </label>
                <input
                  type="text"
                  id={`degree-${index}`}
                  value={education.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                  placeholder="Bachelor's, Master's, etc."
                  required
                />
              </div>
              
              <div>
                <label htmlFor={`year-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year
                </label>
                <input
                  type="text"
                  id={`year-${index}`}
                  value={education.year}
                  onChange={(e) => updateEducation(index, 'year', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                  placeholder="2020"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addEducation}
          className="inline-flex items-center text-primary hover:text-primary-darker bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <FaPlus className="mr-2 h-4 w-4" />
          Add Education
        </button>
      </div>

      {/* Experience Section */}
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0 bg-gradient-to-r from-primary to-indigo-600 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md">3</div>
          <h2 className="text-2xl font-bold text-gray-800 ml-4 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Work Experience</h2>
        </div>
        
        {experiences.map((experience, index) => (
          <div key={index} className="mb-6 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm relative">
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeExperience(index)}
                className="absolute top-4 right-4 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors duration-200"
                aria-label="Remove experience"
              >
                <FaTrashAlt className="h-4 w-4 text-red-500" />
              </button>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor={`title-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBriefcase className="h-5 w-5 text-gray-400" />
                  </div>
                <input
                  type="text"
                    id={`title-${index}`}
                    value={experience.title}
                  onChange={(e) => updateExperience(index, 'title', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                  placeholder="Software Engineer"
                    required
                />
              </div>
              </div>
              
              <div>
                <label htmlFor={`company-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  id={`company-${index}`}
                  value={experience.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                  placeholder="Company Name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor={`startDate-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                  <input
                  type="text"
                  id={`startDate-${index}`}
                  value={experience.startDate}
                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                  placeholder="MM/YYYY"
                  required
                  />
                </div>
              
              <div>
                <label htmlFor={`endDate-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                      <input
                  type="text"
                  id={`endDate-${index}`}
                  value={experience.endDate}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                  disabled={experience.currentlyWorking}
                  className={`block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200 ${
                    experience.currentlyWorking ? 'bg-gray-100 text-gray-500' : ''
                  }`}
                  placeholder="MM/YYYY or Present"
                      />
                    </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center">
                    <input
                      type="checkbox"
                    id={`currentlyWorking-${index}`}
                    checked={experience.currentlyWorking}
                      onChange={(e) => updateExperience(index, 'currentlyWorking', e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary rounded border-gray-300 transition duration-150 ease-in-out"
                    />
                  <label htmlFor={`currentlyWorking-${index}`} className="ml-2 block text-sm text-gray-700">
                    I am currently working here
                    </label>
                  </div>
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addExperience}
          className="inline-flex items-center text-primary hover:text-primary-darker bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <FaPlus className="mr-2 h-4 w-4" />
          Add Experience
        </button>
      </div>

      {/* Skills Section */}
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0 bg-gradient-to-r from-primary to-indigo-600 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md">4</div>
          <h2 className="text-2xl font-bold text-gray-800 ml-4 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Skills</h2>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {skills.map((skill, index) => (
              <div key={index} className="relative">
                <div className="flex">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLightbulb className="h-5 w-5 text-gray-400" />
                    </div>
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateSkill(index, e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                      placeholder="Skill (e.g. JavaScript)"
                />
                  </div>
                  {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                      className="ml-2 bg-red-50 hover:bg-red-100 p-3 rounded-lg transition-colors duration-200"
                      aria-label="Remove skill"
                  >
                      <FaTrashAlt className="h-4 w-4 text-red-500" />
                  </button>
                )}
                </div>
              </div>
            ))}
          </div>
          
        <button
          type="button"
          onClick={addSkill}
            className="mt-4 inline-flex items-center text-primary hover:text-primary-darker bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors duration-200"
        >
            <FaPlus className="mr-2 h-4 w-4" />
          Add Skill
        </button>
        </div>
      </div>

      {/* Resume Upload Section */}
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0 bg-gradient-to-r from-primary to-indigo-600 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md">5</div>
          <h2 className="text-2xl font-bold text-gray-800 ml-4 bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Resume</h2>
            </div>
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-center">
            <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-4">
              Upload your resume (PDF, DOC, DOCX)
              </label>
            
            <div className="flex flex-col items-center justify-center space-y-6">
              {!resumeFile && !existingResume ? (
                <>
                  <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  
              <input
                    id="resume"
                    type="file"
                    className="hidden"
                    onChange={handleResumeChange}
                    accept=".pdf,.doc,.docx"
                  />
                  
                  <button
                    type="button"
                    onClick={() => document.getElementById('resume')?.click()}
                    className="px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                  >
                    Select Resume File
                  </button>
                </>
              ) : (
                <>
                  {/* File Card */}
                  <div className="w-full max-w-md mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex items-center p-4">
                      <div className="flex-shrink-0 mr-4">
                        <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
            </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {resumeFileName || existingResume?.split('/').pop() || 'Resume'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {resumeFile ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                        </p>
          </div>
                      
                      <div className="flex-shrink-0 ml-4">
                        <button
                          type="button"
                          onClick={handleChangeResume}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          Change
                        </button>
        </div>
      </div>

                    {/* PDF Preview */}
                    {resumePreviewUrl && (
                      <div>
                        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                          <h5 className="text-sm font-medium text-gray-700">Preview</h5>
                        </div>
                        <div className="relative pb-2">
                <iframe 
                            src={resumePreviewUrl} 
                            className="w-full h-[400px] border-0"
                  title="Resume Preview"
                          />
              </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4 mt-4">
                    {resumePreviewUrl && (
                <a 
                        href={resumePreviewUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                        Open in New Tab
                      </a>
                    )}
                    
                    <input
                      id="resumeReplace"
                      type="file"
                      className="hidden"
                      onChange={handleResumeChange}
                      accept=".pdf,.doc,.docx"
                    />
                    
                <button
                  type="button"
                      onClick={() => document.getElementById('resumeReplace')?.click()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                      Upload New File
                </button>
              </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-10 flex justify-center">
        <button
          type="submit"
          disabled={isLoading}
          className={`px-10 py-4 bg-gradient-to-r from-primary to-indigo-600 text-white text-lg font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Save Profile'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm; 