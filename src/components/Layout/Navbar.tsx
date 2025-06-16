import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaBriefcase, FaEnvelope, FaSignInAlt } from 'react-icons/fa';
import { canPostJobs } from '@/utils/auth';

const Navbar: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Force re-render to update cached component
  const [forceUpdateKey] = useState(Date.now());
  
  const handleSignOut = () => {
    // Redirect based on current user role or default to signin
    router.push('/auth/signout');
  };

  // Determine the post job link based on user role
  const getPostJobLink = () => {
    if (!session?.user) return '/auth/signin';
    
    if (session.user.role === 'admin' || session.user.role === 'superadmin' || session.user.role === 'super_admin') {
      return '/admin/job-post/new';
    } else if (session.user.role === 'recruiter') {
      return '/recruiter/jobs/create';
    }
    
    return '/auth/signin'; // Default for applicants and others
  };

  const getDashboardLink = () => {
    if (!session?.user) return '/auth/signin';
    
    if (session.user.role === 'admin' || session.user.role === 'superadmin' || session.user.role === 'super_admin') {
      return '/admin/dashboard';
    } else if (session.user.role === 'employer') {
      return '/recruiter/employer/dashboard';
    } else if (session.user.role === 'recruiter') {
      return '/recruiter/dashboard';
    } else {
      return '/dashboard'; // For applicants
    }
  };
  
  return (
    <header className="bg-white w-full border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-extrabold text-2xl text-black tracking-tight lowercase">
          talnurt
        </Link>

        {/* Centered Navigation */}
        <nav className="hidden md:flex flex-1 justify-center space-x-10">
          <Link 
            href="/jobs" 
            className={`font-medium hover:text-primary transition-colors ${router.pathname.startsWith('/jobs') ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-900'}`}
          >Jobs</Link>
          <Link 
            href="/hiring-solutions" 
            className={`font-medium hover:text-primary transition-colors ${router.pathname === '/hiring-solutions' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-900'}`}
          >Hiring Solutions</Link>
          <Link 
            href="/about" 
            className={`font-medium hover:text-primary transition-colors ${router.pathname === '/about' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-900'}`}
          >About</Link>
          <Link 
            href="/blogs" 
            className={`font-medium hover:text-primary transition-colors ${router.pathname.startsWith('/blogs') ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-900'}`}
          >Blog</Link>
        </nav>

        {/* Right Side Buttons */}
        <div className="flex items-center space-x-4">
          <Link href="/contact" className="flex items-center px-5 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
            <FaEnvelope className="mr-2" /> Contact Us
          </Link>
          {session?.user ? (
            <>
              <Link href={getDashboardLink()} className="flex items-center px-5 py-2 rounded-full bg-green-600 text-white font-medium hover:bg-green-700 transition">
                <FaBriefcase className="mr-2" /> Dashboard
              </Link>
              <button onClick={handleSignOut} className="flex items-center px-5 py-2 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition">
                <FaSignOutAlt className="mr-2" /> Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth/signin" className="flex items-center px-5 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
              <FaSignInAlt className="mr-2" /> Sign Up / Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar; 