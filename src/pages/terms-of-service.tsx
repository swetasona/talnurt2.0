import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const TermsOfServicePage = () => {
  return (
    <>
      <Head>
        <title>Terms of Service | Talnurt Recruitment Portal</title>
        <meta name="description" content="Terms of Service for Talnurt Recruitment Portal - the rules and guidelines for using our platform." />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
              
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  <strong>Last Updated:</strong> January 1, 2025
                </p>
                
                <p className="mb-4">
                  Welcome to Talnurt. Please read these Terms of Service ("Terms") carefully before using our recruitment platform.
                </p>
                
                <h2 className="text-xl font-semibold mb-2 mt-6">1. Acceptance of Terms</h2>
                <p className="mb-4">
                  By accessing or using the Talnurt platform, you agree to be bound by these Terms. If you do not agree to all the Terms, you may not use our services.
                </p>
                
                <h2 className="text-xl font-semibold mb-2 mt-6">2. User Accounts</h2>
                <p className="mb-4">
                  To use certain features of our platform, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
                <p className="mb-4">
                  You agree to:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Provide accurate and complete information when creating your account</li>
                  <li>Immediately notify us of any unauthorized use of your account</li>
                  <li>Keep your account information up-to-date</li>
                  <li>Not share your account credentials with any third party</li>
                </ul>
                
                <h2 className="text-xl font-semibold mb-2 mt-6">3. User Content</h2>
                <p className="mb-4">
                  You retain ownership of any content you submit to the platform, including resumes, job postings, and communications. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and display such content for the purpose of providing and improving our services.
                </p>
                <p className="mb-4">
                  You are solely responsible for the content you submit and agree not to post content that:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Violates any laws or regulations</li>
                  <li>Infringes on the rights of others</li>
                  <li>Is fraudulent, deceptive, or misleading</li>
                  <li>Contains harmful software or code</li>
                  <li>Is offensive, discriminatory, or inappropriate</li>
                </ul>
                
                <h2 className="text-xl font-semibold mb-2 mt-6">4. Platform Usage</h2>
                <p className="mb-4">
                  You agree to use our platform only for lawful purposes and in accordance with these Terms. You will not:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Use the platform in any way that violates applicable laws or regulations</li>
                  <li>Attempt to gain unauthorized access to any part of the platform</li>
                  <li>Interfere with the operation of the platform</li>
                  <li>Collect or harvest user data without permission</li>
                  <li>Use the platform to send unsolicited communications</li>
                </ul>
                
                <h2 className="text-xl font-semibold mb-2 mt-6">5. Termination</h2>
                <p className="mb-4">
                  We reserve the right to terminate or suspend your access to our platform at any time, without prior notice or liability, for any reason, including breach of these Terms.
                </p>
                
                <h2 className="text-xl font-semibold mb-2 mt-6">6. Disclaimer of Warranties</h2>
                <p className="mb-4">
                  The platform is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the platform will be uninterrupted, error-free, or secure.
                </p>
                
                <h2 className="text-xl font-semibold mb-2 mt-6">7. Limitation of Liability</h2>
                <p className="mb-4">
                  To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the platform.
                </p>
                
                <h2 className="text-xl font-semibold mb-2 mt-6">8. Changes to Terms</h2>
                <p className="mb-4">
                  We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the updated Terms on our platform. Your continued use of the platform after such changes constitutes your acceptance of the new Terms.
                </p>
                
                <h2 className="text-xl font-semibold mb-2 mt-6">9. Contact Us</h2>
                <p className="mb-4">
                  If you have any questions about these Terms, please contact us at: <a href="mailto:legal@talnurt.com" className="text-blue-600 hover:text-blue-800">legal@talnurt.com</a>
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default TermsOfServicePage; 