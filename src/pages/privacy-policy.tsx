import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const PrivacyPolicyPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy | Talnurt Recruitment Portal</title>
        <meta name="description" content="Privacy Policy for Talnurt Recruitment Portal - how we collect, use, and protect your data." />
      </Head>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">
                <strong>Last Updated:</strong> January 1, 2025
              </p>
              
              <h2 className="text-xl font-semibold mb-2 mt-6">1. Introduction</h2>
              <p className="mb-4">
                Welcome to Talnurt ("we," "our," or "us"). We are committed to protecting your privacy and personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our recruitment platform.
              </p>
              
              <h2 className="text-xl font-semibold mb-2 mt-6">2. Information We Collect</h2>
              <p className="mb-2">We may collect the following types of information:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Personal Information:</strong> Name, email address, phone number, employment history, education, skills, and other information typically found in a resume or professional profile.</li>
                <li><strong>Account Information:</strong> Login credentials, user preferences, and settings.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our platform, including log data, device information, and IP address.</li>
                <li><strong>Communication Data:</strong> Communications between recruiters, employers, and candidates through our platform.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-2 mt-6">3. How We Use Your Information</h2>
              <p className="mb-2">We use your information for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>To provide and maintain our recruitment platform</li>
                <li>To facilitate job applications and the hiring process</li>
                <li>To communicate with you about your account, job opportunities, or platform updates</li>
                <li>To improve our platform and user experience</li>
                <li>To comply with legal obligations</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-2 mt-6">4. Information Sharing</h2>
              <p className="mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Employers and Recruiters:</strong> If you're a job seeker, your profile and application information will be shared with potential employers and recruiters using our platform.</li>
                <li><strong>Service Providers:</strong> We may use third-party services to support our platform's functionality.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-2 mt-6">5. Data Security</h2>
              <p className="mb-4">
                We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
              </p>
              
              <h2 className="text-xl font-semibold mb-2 mt-6">6. Your Rights</h2>
              <p className="mb-2">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access and receive a copy of your personal information</li>
                <li>Rectify inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Restrict or object to the processing of your information</li>
                <li>Data portability</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-2 mt-6">7. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:privacy@talnurt.com" className="text-blue-600 hover:text-blue-800">privacy@talnurt.com</a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PrivacyPolicyPage; 