import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaArrowRight, FaDatabase, FaBriefcase, FaUsers, FaGlobeAmericas, FaCheckCircle } from 'react-icons/fa';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const HiringSolutionsPage = () => {
  return (
    <>
      <Head>
        <title>Hiring Solutions | TalNurt</title>
        <meta name="description" content="Discover hiring solutions with Talnurt Recruitment Portal." />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-blue-50 to-white">
          <div className="absolute inset-0 bg-pattern opacity-5"></div>
          
          {/* Animated decorative elements */}
          <motion.div 
            className="absolute left-10 top-32 w-20 h-20 rounded-full bg-primary/10"
            animate={{ 
              y: [0, -15, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          
          <motion.div 
            className="absolute right-20 bottom-40 w-16 h-16 rounded-lg bg-accent/10 rotate-12"
            animate={{ 
              rotate: [12, 45, 12],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
                  Talent Solutions
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
                  Empowering Your <span className="text-primary">Recruitment Process</span> with Innovation
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                  Innovative & Cost-effective hiring solutions designed to streamline your Recruitment Process, enhance candidate quality, & help you build exceptional teams.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/contact" 
                    className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center"
                  >
                    Get Started <FaArrowRight className="ml-2" />
                  </Link>
                  <Link 
                    href="/about" 
                    className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              
              <div className="lg:w-1/2">
                <div className="relative">
                  {/* Decorative elements */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-lg"></div>
                  <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-accent/10 rounded-lg rotate-12"></div>
                  <div className="absolute -left-5 -top-5 w-20 h-20 bg-primary/10 rounded-full"></div>
                  
                  {/* Main image */}
                  <div className="relative z-10 overflow-hidden rounded-xl shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="Team collaboration" 
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent mix-blend-overlay"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hiring Solutions Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-5">
                Our Solutions
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Hiring Solutions
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Our comprehensive range of recruitment services designed to streamline your hiring process
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {/* Solution Card 1 */}
              <motion.div 
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-48 bg-blue-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaDatabase className="text-blue-600 text-7xl" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Database Creation and Management</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Build and manage a centralized candidate database effortlessly.</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Quickly retrieve resumes and candidate details whenever needed.</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Customize filters to find candidates based on skills, experience, or location.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
              
              {/* Solution Card 2 */}
              <motion.div 
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-48 bg-indigo-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-indigo-600/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaBriefcase className="text-indigo-600 text-7xl" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Job Posting and Candidate Sourcing</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Post job openings globally with just a few clicks.</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Automate candidate sourcing using AI-driven algorithms that match the best-fit candidates based on skills, experience, and cultural fit.</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Access a global talent pool to ensure diversity and top-tier talent, no matter your location.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
              
              {/* Solution Card 3 */}
              <motion.div 
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-48 bg-green-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaUsers className="text-green-600 text-7xl" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Talent Pool Management</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Build and maintain a comprehensive database of qualified candidates.</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Tag candidates based on skill sets, availability, and other criteria for quick reference.</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Reconnect with past applicants whenever a new role arises.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
              
              {/* Solution Card 4 */}
              <motion.div 
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-48 bg-purple-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-600/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaGlobeAmericas className="text-purple-600 text-7xl" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Global Talent Access</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Connect with an existing database of global talent.</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Simplify candidate sourcing with a single login.</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Match candidates with the right roles based on skills and experience.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Choose Our Hiring Solutions */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-5">
                Our Advantage
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our Hiring Solutions?
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Discover the benefits that set TalNurt apart from other recruitment platforms
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Innovative Technology",
                  description: "Our AI-powered platform uses cutting-edge technology to match candidates with the perfect roles based on skills, experience, and cultural fit.",
                  color: "blue"
                },
                {
                  title: "Cost-Effective",
                  description: "Save on recruitment costs with our efficient platform that streamlines the hiring process and reduces time-to-hire significantly.",
                  color: "green"
                },
                {
                  title: "Global Reach",
                  description: "Access a diverse pool of talent from around the world, expanding your recruitment reach beyond geographical boundaries.",
                  color: "indigo"
                },
                {
                  title: "Time-Saving",
                  description: "Our automated processes handle the time-consuming tasks of recruitment, allowing your team to focus on strategic decisions.",
                  color: "purple"
                },
                {
                  title: "Quality Candidates",
                  description: "Our advanced screening algorithms ensure that you only see candidates who truly match your requirements and company culture.",
                  color: "rose"
                },
                {
                  title: "Dedicated Support",
                  description: "Our team of recruitment experts is always available to provide guidance and support throughout your hiring journey.",
                  color: "yellow"
                }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                >
                  <div className={`w-12 h-12 rounded-lg bg-${benefit.color}-100 flex items-center justify-center mb-4`}>
                    <div className={`w-6 h-6 rounded-full bg-${benefit.color}-500`}></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-indigo-600 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why wait? Transform the way you hire and build careers.
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
              Experience the future of recruitment today!
            </p>
            <Link 
              href="/contact" 
              className="inline-block px-8 py-4 bg-white text-primary font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Started Today
            </Link>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default HiringSolutionsPage; 