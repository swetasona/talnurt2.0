import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaPaperPlane } from 'react-icons/fa';
import CountryCodeSelect, { countries, Country } from '../shared/CountryCodeSelect';

const ContactForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+1',
    phoneNumber: '',
    subject: '',
    message: ''
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountrySelect = (code: string) => {
    setFormData(prev => ({
      ...prev,
      countryCode: code
    }));
    setShowCountryDropdown(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/contact/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      toast.success('Message sent successfully!');
      setFormData({
        name: '',
        email: '',
        countryCode: '+1',
        phoneNumber: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Contact form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Find the selected country to display flag and code
  const selectedCountry = React.useMemo(() => {
    return countries.find(c => c.dial_code === formData.countryCode) || 
      { dial_code: '+1', name: 'United States', code: 'US', flag: '🇺🇸' };
  }, [formData.countryCode]);

  // Filter countries when searching
  const [searchTerm, setSearchTerm] = useState('');
  const filteredCountries = React.useMemo(() => {
    if (!searchTerm) return countries;
    const term = searchTerm.toLowerCase();
    return countries.filter(
      country => 
        country.name.toLowerCase().includes(term) || 
        country.code.toLowerCase().includes(term) ||
        country.dial_code.includes(term)
    );
  }, [searchTerm]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl p-8 shadow-xl h-full border border-gray-100/80 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full z-0"></div>
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-tr from-blue-100/20 to-primary/10 rounded-full z-0"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-[1px] w-10 bg-primary"></div>
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-primary text-sm font-medium rounded-full">Send Us a Message</span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          <span className="text-primary">Write to</span> Our Team
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-primary transition-colors">
                Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-primary transition-colors">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
          
          {/* Phone Number with Country Code */}
          <div className="group">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-primary transition-colors">
              Phone Number
            </label>
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                {/* Country code selector */}
                <div 
                  className="flex items-center px-3 py-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors border-r border-gray-200"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <span className="mr-1 text-lg">{selectedCountry.flag}</span>
                  <span className="font-medium text-gray-700">{selectedCountry.dial_code}</span>
                  <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Phone input */}
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  required
                  pattern="[0-9]{3}[0-9]{3}[0-9]{4}|[0-9]{3}-[0-9]{3}-[0-9]{4}|[0-9]{10}"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="(123) 456-7890"
                  className="flex-1 px-4 py-3 border-0 focus:outline-none"
                  aria-label="Phone number"
                />
              </div>
              
              {/* Country dropdown */}
              {showCountryDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="py-1">
                    {filteredCountries.map((country) => (
                      <div
                        key={`${country.code}-${country.name}`}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        onClick={() => handleCountrySelect(country.dial_code)}
                      >
                        <span className="mr-2 text-lg">{country.flag}</span>
                        <span className="font-medium">{country.dial_code}</span>
                        <span className="ml-2 text-sm text-gray-600">({country.name})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Format: {selectedCountry.dial_code} (123) 456-7890 or 1234567890 | <span className="cursor-pointer text-primary hover:underline" onClick={() => setShowCountryDropdown(true)}>Change country</span>
              </p>
            </div>
          </div>
          
          <div className="group">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-primary transition-colors">
              Subject
            </label>
            <div className="relative">
              <input
                type="text"
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="How can we help you?"
                className="block w-full px-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="group">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-primary transition-colors">
              Message
            </label>
            <div className="relative">
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder="Please tell us how we can assist you..."
                className="block w-full px-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all resize-none"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none font-medium"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                <>
                  <span>Send Message</span>
                  <FaPaperPlane className="text-sm" />
                </>
              )}
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            We&apos;ll get back to you within 24 hours
          </p>
        </form>
      </div>
    </motion.div>
  );
};

export default ContactForm; 