import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowLeft, FaLightbulb, FaHandshake, FaCog, FaStar, FaGlobe, FaTools, FaUserTie, FaChartLine } from 'react-icons/fa';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

type TabType = 'mission' | 'vision' | 'approach' | 'expertise';

const AboutPage = () => {
  // Add state for active tab with proper typing
  const [activeTab, setActiveTab] = useState<TabType>('mission');

  // Define tab images with proper typing
  const tabImages: Record<TabType, string> = {
    mission: "https://images.unsplash.com/photo-1556484687-30636164638b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    vision: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    approach: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    expertise: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
  };

  return (
    <>
      <Head>
        <title>About TalNurt | Recruitment Portal</title>
        <meta name="description" content="Learn about TalNurt - a modern recruitment and team management platform designed to simplify the hiring and team management process." />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-white">
        {/* Hero Section - Clean Design with Animated Shapes */}
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
                  About Us
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
                  About <span className="text-primary">TalNurt</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                  We're reimagining how companies connect with talent and how professionals find meaningful careers in today's dynamic job market.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/contact" 
                    className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Get in Touch
                  </Link>
                  <Link 
                    href="/" 
                    className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-gray-300 transition-colors flex items-center"
                  >
                    <FaArrowLeft className="mr-2" /> 
                    Back to Home
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
                      src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="TalNurt team" 
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent mix-blend-overlay"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Company Introduction - Centered Wide Layout */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                TalNurt Private Limited
              </h2>
              <div className="w-32 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="flex justify-center">
              <div className="flex w-full max-w-6xl">
                {/* Vertical Line */}
                <div className="w-1 bg-primary rounded-full flex-shrink-0 mr-8"></div>
                
                {/* Text Content - Centered with max width */}
                <div className="flex-grow">
                  <p className="text-lg text-gray-700 leading-relaxed mb-8">
                    TalNurt, is an innovative, cloud-integrated platform designed to empower recruiters, HR teams, and job seekers with cutting-edge tools and global talent access. Our mission is to simplify hiring, reduce costs, and provide a seamless experience for both candidates and employers.
                  </p>
                  
                  <p className="text-lg text-gray-700 leading-relaxed mb-8">
                    Our mission is to make hiring smarter, faster, and more cost-effective. TalNurt provides employers with a smart dashboard to manage job postings, track applicants, and access a curated talent pool. For job seekers, the platform offers a seamless way to explore career opportunities and apply for jobs that align with their skills and aspirations.
                  </p>
                  
                  <p className="text-lg text-gray-700 leading-relaxed">
                    With its scalable cloud infrastructure, TalNurt ensures data security, ease of access, and a streamlined recruitment process. Whether you're a small business or a large enterprise, TalNurt helps you find the right talent, faster and at a fraction of the cost.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Allegiance - Overlapping Design - UPDATED */}
        <section className="py-20 bg-gray-50 relative">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-5/12">
                <div className="relative">
                  <div className="absolute -inset-3 bg-primary/5 rounded-lg transform rotate-3"></div>
                  <div className="absolute -inset-3 bg-accent/5 rounded-lg transform -rotate-3"></div>
                  <div className="relative rounded-lg overflow-hidden shadow-xl max-w-sm mx-auto h-80 w-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-indigo-600/40 mix-blend-overlay z-10"></div>
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={activeTab}
                        src={tabImages[activeTab]} 
                        alt={`Our ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                        className="w-full h-full object-cover object-top"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-7/12">
                <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-5">
                  Our Promise
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Our Allegiance
                </h2>
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="border-b border-gray-100">
                    <div className="flex flex-wrap">
                      <button 
                        onClick={() => setActiveTab('mission')}
                        className={`px-4 py-3 text-sm md:text-base md:px-6 font-medium transition-colors ${activeTab === 'mission' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Our Mission
                      </button>
                      <button 
                        onClick={() => setActiveTab('vision')}
                        className={`px-4 py-3 text-sm md:text-base md:px-6 font-medium transition-colors ${activeTab === 'vision' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Our Vision
                      </button>
                      <button 
                        onClick={() => setActiveTab('approach')}
                        className={`px-4 py-3 text-sm md:text-base md:px-6 font-medium transition-colors ${activeTab === 'approach' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Our Approach
                      </button>
                      <button 
                        onClick={() => setActiveTab('expertise')}
                        className={`px-4 py-3 text-sm md:text-base md:px-6 font-medium transition-colors ${activeTab === 'expertise' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Our Expertise
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {/* Mission Tab Content */}
                    {activeTab === 'mission' && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          At TalNurt, our mission is to simplify the hiring process through innovative, AI-powered solutions that connect companies with the best talent from across the globe.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          We are committed to helping businesses streamline their recruitment process, reduce costs, and find candidates that not only meet the job requirements but also align with the company's culture and values.
                        </p>
                      </div>
                    )}
                    
                    {/* Vision Tab Content */}
                    {activeTab === 'vision' && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Our Vision</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          Our vision is to revolutionize the recruitment industry by creating a seamless, data-driven platform that empowers recruiters, HR teams, and job seekers alike.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          We envision a world where businesses can effortlessly build high-performing teams with the right talent, while candidates can find fulfilling job opportunities that align with their career aspirations.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          Through cutting-edge technology and deep industry expertise, we aim to become the go-to platform for both employers and job seekers across industries worldwide.
                        </p>
                      </div>
                    )}
                    
                    {/* Approach Tab Content */}
                    {activeTab === 'approach' && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Our Approach</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          At TalNurt, we take a holistic, data-driven approach to recruitment that combines technology, human insights, and industry expertise.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          Our platform uses Artificial Intelligence (AI) to optimize every stage of the hiring process, from job posting and candidate sourcing to screening and selection.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          We focus on providing personalized solutions for employers while empowering candidates to showcase their skills, experience, and potential.
                        </p>
                      </div>
                    )}
                    
                    {/* Expertise Tab Content */}
                    {activeTab === 'expertise' && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Our Expertise</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          With years of experience in recruitment and HR technology, our team brings deep expertise in AI, machine learning, and human resources management.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          We combine technical innovation with industry best practices to deliver a recruitment platform that's both powerful and user-friendly.
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-8 flex items-center">
                      <div className="mr-4">
                        <div className="flex -space-x-2">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">TN</div>
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium">HR</div>
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">JS</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Trusted by thousands of recruiters and job seekers
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section - New Addition */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Meet Our Leadership Team
              </h2>
              <div className="w-32 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
              <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
                Our diverse team of experts brings together decades of experience in recruitment, technology, and business innovation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Team Member 1 */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                <div className="relative h-64">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    alt="CEO"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">John Smith</h3>
                  <p className="text-primary font-medium mb-4">Chief Executive Officer</p>
                  <p className="text-gray-600">
                    With over 15 years of experience in HR technology, John leads our mission to revolutionize recruitment.
                  </p>
                </div>
              </div>

              {/* Team Member 2 */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                <div className="relative h-64">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    alt="CTO"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">Sarah Johnson</h3>
                  <p className="text-primary font-medium mb-4">Chief Technology Officer</p>
                  <p className="text-gray-600">
                    Sarah brings her expertise in AI and machine learning to drive our technological innovation.
                  </p>
                </div>
              </div>

              {/* Team Member 3 */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                <div className="relative h-64">
                  <img
                    src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    alt="COO"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">Michael Chen</h3>
                  <p className="text-primary font-medium mb-4">Chief Operations Officer</p>
                  <p className="text-gray-600">
                    Michael ensures our platform delivers exceptional value to both employers and job seekers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - New Addition */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                <p className="text-gray-600">Active Companies</p>
              </div>
              <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                <div className="text-4xl font-bold text-primary mb-2">50K+</div>
                <p className="text-gray-600">Job Seekers</p>
              </div>
              <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                <div className="text-4xl font-bold text-primary mb-2">100K+</div>
                <p className="text-gray-600">Successful Placements</p>
              </div>
              <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                <div className="text-4xl font-bold text-primary mb-2">95%</div>
                <p className="text-gray-600">Client Satisfaction</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - New Addition */}
        <section className="py-20 bg-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Transform Your Recruitment Process?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-3xl mx-auto">
              Join thousands of companies that trust TalNurt for their hiring needs. Experience the future of recruitment today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/contact" 
                className="px-8 py-4 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors"
              >
                Get Started
              </Link>
              <Link 
                href="/hiring-solutions" 
                className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Core Values - Hexagonal Grid */}
        <section className="py-20 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-5">
                What Drives Us
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Core Values
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These principles guide everything we do and define how we serve our customers
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
              {[
                { 
                  icon: <FaHandshake className="text-blue-600 text-2xl" />, 
                  title: "Integrity", 
                  description: "Building trust through transparent and ethical practices",
                  color: "blue"
                },
                { 
                  icon: <FaLightbulb className="text-indigo-600 text-2xl" />, 
                  title: "Innovation", 
                  description: "We leverage creative strategies and modern tools to revolutionize recruitment practices",
                  color: "indigo"
                },
                { 
                  icon: <FaCog className="text-green-600 text-2xl" />, 
                  title: "Efficiency", 
                  description: "We streamline hiring processes to deliver timely and effective solutions",
                  color: "green"
                },
                { 
                  icon: <FaHandshake className="text-yellow-600 text-2xl" />, 
                  title: "Collaboration", 
                  description: "Encouraging synergy among job seekers, recruiters, and employers",
                  color: "yellow"
                },
                { 
                  icon: <FaUserTie className="text-purple-600 text-2xl" />, 
                  title: "Empowerment", 
                  description: "Enabling users to take control of their recruitment journey",
                  color: "purple"
                },
                { 
                  icon: <FaStar className="text-rose-600 text-2xl" />, 
                  title: "Excellence", 
                  description: "Delivering top-notch solutions that exceed expectations",
                  color: "rose"
                }
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <div className="relative p-6 bg-white border border-gray-100 rounded-xl shadow-sm h-full transition-all duration-300 group-hover:shadow-md group-hover:border-gray-200">
                    {value.title === "Excellence" ? (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 rounded-t-xl"></div>
                    ) : (
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-${value.color}-500 rounded-t-xl`}></div>
                    )}
                    
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full bg-${value.color}-100 flex items-center justify-center`}>
                        {value.icon}
                      </div>
                      <h3 className="ml-4 text-xl font-semibold text-gray-900">{value.title}</h3>
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us - Updated Card Layout */}
        <section className="py-20 bg-gray-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-5">
                Our Strengths
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose Us?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                What sets TalNurt apart from other recruitment platforms
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Card 1 - Innovative Tools */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                    alt="Innovative Tools" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FaTools className="text-primary text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovative Tools</h3>
                  <p className="text-gray-600">
                    Our suite of AI-powered tools streamlines every aspect of the recruitment process, from resume matching to interview scheduling.
                  </p>
                </div>
              </motion.div>
              
              {/* Feature Card 2 - Global Reach */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                    alt="Global Reach" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <FaGlobe className="text-accent text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Global Reach</h3>
                  <p className="text-gray-600">
                    We bridge the gap between local talent and global opportunities, connecting candidates and employers across borders.
                  </p>
                </div>
              </motion.div>
              
              {/* Feature Card 3 - Proven Expertise */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                    alt="Proven Expertise" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <FaChartLine className="text-green-600 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Proven Expertise</h3>
                  <p className="text-gray-600">
                    With years of industry experience, our team of recruitment specialists brings invaluable insights to every hiring challenge.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section - Split Design */}
        <section className="relative">
          <div className="absolute inset-0">
            <div className="absolute inset-y-0 left-0 w-1/2 bg-primary"></div>
            <div className="absolute inset-y-0 right-0 w-1/2 bg-gray-900"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="py-16 px-4 sm:px-6 lg:px-8 lg:py-24 bg-primary text-white">
                <div className="max-w-md mx-auto lg:max-w-lg lg:mx-0">
                  <h2 className="text-3xl font-bold mb-6">
                    Ready to Transform Your Recruitment Process?
                  </h2>
                  <p className="text-lg opacity-90 mb-8">
                    Join thousands of companies and job seekers who have already discovered the TalNurt advantage.
                  </p>
                  <Link
                    href="/contact"
                    className="inline-block px-8 py-3 bg-white text-primary font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
              
              <div className="py-16 px-4 sm:px-6 lg:px-8 lg:py-24 bg-gray-900 text-white">
                <div className="max-w-md mx-auto lg:max-w-lg lg:mx-0">
                  <h2 className="text-3xl font-bold mb-6">
                    Looking for Your Next Career Move?
                  </h2>
                  <p className="text-lg opacity-90 mb-8">
                    Create your profile today and get matched with opportunities that align with your skills and career goals.
                  </p>
                  <Link
                    href="/auth/signup"
                    className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Sign Up Free
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
      {/* Add custom CSS for clip path */}
      <style jsx global>{`
        .clip-path-slant {
          clip-path: polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
      `}</style>
    </>
  );
};

export default AboutPage; 