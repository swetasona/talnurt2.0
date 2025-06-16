import React from 'react';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const Footer: React.FC = () => (
  <footer className="w-full bg-primary text-white pt-12 pb-4 px-4">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10 mb-8 px-2 md:px-6 items-start">
      {/* Logo and Description */}
      <div>
        <div className="mb-6">
          <span className="font-extrabold text-2xl tracking-tight lowercase text-white opacity-90">talnurt</span>
        </div>
        <p className="mb-4 text-white/90 font-semibold">
          <span className="font-bold">TalNurt, is an innovative, <span className='font-bold'>cloud–integrated platform</span></span> designed to empower recruiters. HR teams, and job seekers with cutting-edge tools and global talent access.
        </p>
        <div className="flex space-x-4 mt-4">
          <a href="#" aria-label="Facebook" className="hover:text-gray-200"><FaFacebook size={28} /></a>
          <a href="#" aria-label="Instagram" className="hover:text-gray-200"><FaInstagram size={28} /></a>
          <a href="#" aria-label="LinkedIn" className="hover:text-gray-200"><FaLinkedin size={28} /></a>
          <a href="#" aria-label="WhatsApp" className="hover:text-gray-200"><FaWhatsapp size={28} /></a>
          <a href="mailto:info@talnurt.com" aria-label="Email" className="hover:text-gray-200"><FaEnvelope size={28} /></a>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mx-auto text-center">
        <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
        <ul className="space-y-2">
          <li><Link href="/" className="hover:underline">Home</Link></li>
          <li><Link href="/about" className="hover:underline">About Us</Link></li>
          <li><Link href="/hiring-solutions" className="hover:underline">Services</Link></li>
          <li><Link href="/jobs" className="hover:underline">Jobs</Link></li>
          <li><Link href="/blogs" className="hover:underline">Blogs</Link></li>
        </ul>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Contact Information</h3>
        <ul className="space-y-3 text-white/90">
          <li className="flex items-center"><FaPhoneAlt className="mr-3 text-pink-200" />+91 88666 62335 (India)</li>
          <li className="flex items-center"><FaEnvelope className="mr-3 text-pink-200" />info@talnurt.com</li>
          <li className="flex items-center"><FaMapMarkerAlt className="mr-3 text-pink-200" />30 N Gould St Ste R Sheridan, WY 82801</li>
          <li className="flex items-center"><FaClock className="mr-3 text-pink-200" />Mon to Sat: 9:00 AM – 6:00 PM</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/30 pt-4 pb-2 text-center">
      <div className="text-white/80 text-sm mb-2">
        © {new Date().getFullYear()} TalNurt Private Limited. All rights reserved.
      </div>
      <div className="flex justify-center gap-8">
        <Link href="/privacy-policy" className="text-white hover:underline text-base">Privacy Policy</Link>
        <Link href="/terms-of-service" className="text-white hover:underline text-base">Terms of Service</Link>
      </div>
    </div>
  </footer>
);

export default Footer; 