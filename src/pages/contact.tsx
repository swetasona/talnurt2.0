import React from 'react';
import PageLayout from '@/components/Layout/PageLayout';
import ContactForm from '@/components/Connect/ContactForm';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaLinkedin, FaTwitter, FaFacebook } from 'react-icons/fa';
// import Footer from '@/components/Layout/Footer';
// import Navbar from '@/components/Layout/Navbar';

const ContactPage = () => {
  return (
    <PageLayout>
      <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-[1px] w-10 bg-primary"></div>
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-primary text-sm font-medium rounded-full">Connect With Us</span>
              <div className="h-[1px] w-10 bg-primary"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
              <span className="relative inline-block">
                Get in <span className="text-primary">Touch</span>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-primary rounded-full"></div>
              </span>
            </h1>
            <p className="text-gray-600 mt-6 max-w-2xl mx-auto text-lg">
              Have a question or want to learn more? We'd love to hear from you.
            </p>
          </div>
          
          {/* Main Content */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
              {/* Contact Info Column */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <div className="bg-white rounded-2xl shadow-xl p-8 h-full border border-gray-100/80">
                  <div className="mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl mb-6 shadow-lg">
                      <FaEnvelope className="text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
                    <p className="text-gray-600 mb-6">
                      Fill out the form and our team will get back to you within 24 hours.
                    </p>
                  </div>
                  
                  <ul className="space-y-6">
                    <li className="flex items-start">
                      <div className="mt-1 bg-blue-100 p-2 rounded-full text-primary mr-4">
                        <FaPhone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Phone</p>
                        <p className="text-gray-700 font-medium">+91 88666 62335 (India)</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 bg-blue-100 p-2 rounded-full text-primary mr-4">
                        <FaEnvelope className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="text-gray-700 font-medium">info@talnurt.com</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="mt-1 bg-blue-100 p-2 rounded-full text-primary mr-4">
                        <FaMapMarkerAlt className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Address</p>
                        <p className="text-gray-700 font-medium">30 N Gould St Ste R Sheridan, WY 82801</p>
                      </div>
                    </li>
                  </ul>
                  
                  {/* Social Links */}
                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <p className="text-gray-700 font-medium mb-4">Connect with us</p>
                    <div className="flex space-x-4">
                      <a href="#" className="bg-gray-100 hover:bg-primary hover:text-white text-gray-600 p-3 rounded-full transition-all duration-300">
                        <FaLinkedin className="h-5 w-5" />
                      </a>
                      <a href="#" className="bg-gray-100 hover:bg-primary hover:text-white text-gray-600 p-3 rounded-full transition-all duration-300">
                        <FaTwitter className="h-5 w-5" />
                      </a>
                      <a href="#" className="bg-gray-100 hover:bg-primary hover:text-white text-gray-600 p-3 rounded-full transition-all duration-300">
                        <FaFacebook className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Form Column */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <ContactForm />
              </div>
            </div>
          </div>
          
          {/* Map Section (Optional) */}
          <div className="max-w-7xl mx-auto mt-16 md:mt-20">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100/80">
              <div className="aspect-video w-full">
                <iframe
                  src="https://www.google.com/maps?q=30+N+Gould+St+Ste+R+Sheridan,+WY+82801&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  title="Talnurt Office Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ContactPage; 