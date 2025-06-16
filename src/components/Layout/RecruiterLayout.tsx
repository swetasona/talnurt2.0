import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FaBars, FaBriefcase, FaUsers, FaUserTie, FaSignOutAlt, FaTachometerAlt, FaPlus, FaBell, FaSearch, FaCog, FaUser, FaTimes, FaChartLine, FaBuilding, FaUserFriends, FaDatabase, FaRobot, FaUserCog, FaChevronRight, FaChevronDown, FaUserCheck, FaThList } from 'react-icons/fa';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useNotifications } from '@/contexts/NotificationsContext';
import SessionRefreshButton from '@/components/SessionRefreshButton';

interface RecruiterLayoutProps {
  children: ReactNode;
}

const RecruiterLayout: React.FC<RecruiterLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { unreadReports, refreshUnreadReports } = useNotifications();
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recruitingOpen, setRecruitingOpen] = useState(false);
  const [profileManagementOpen, setProfileManagementOpen] = useState(false);
  const [hasEmployerAccess, setHasEmployerAccess] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Auto logout after inactivity (30 minutes)
  const AUTO_LOGOUT_TIME = 30 * 60 * 1000;
  
  // Recruiting menu for employer
  
  // Check employer access
  useEffect(() => {
    const checkEmployerAccess = async () => {
      if (session?.user) {
        // Direct role check (when approved, role becomes 'employer')
        if (session.user.role === 'employer') {
          setHasEmployerAccess(true);
          return;
        }
        
        // Also check for approved applications
        try {
          const response = await fetch('/api/recruiter/employer-access-status');
          if (response.ok) {
            const data = await response.json();
            setHasEmployerAccess(data.application?.status === 'approved');
          }
        } catch (error) {
          console.error('Error checking employer access:', error);
        }
      }
    };
    
    if (status === 'authenticated') {
      checkEmployerAccess();
    }
  }, [session, status]);

  // Redirect if not logged in as recruiter
  useEffect(() => {
    if (status === 'loading') {
      return; // Still loading, wait
    }
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    const validRecruiterRoles = ['recruiter', 'unassigned', 'employee', 'employer', 'manager'];
    if (!validRecruiterRoles.includes(session.user.role) && 
        session.user.role !== 'admin' && 
        session.user.role !== 'superadmin' && 
        session.user.role !== 'super_admin') {
      // If user is logged in but not a recruiter, sign them out and redirect
      signOut({ callbackUrl: '/auth/signin' });
    }
  }, [session, status, router]);
  
  // Auto logout after inactivity
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        signOut({ callbackUrl: '/auth/recruiter/signin' });
      }, AUTO_LOGOUT_TIME);
    };
    
    // Set up event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Reset the timer when the user is active
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    // Initialize the timer
    resetTimer();
    
    // Cleanup event listeners
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearTimeout(inactivityTimer);
    };
  }, [router]);

  // Handle responsive sidebar for mobile devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation items for sidebar
  const navItems = [
    {
      name: 'Dashboard',
      href: session?.user?.role === 'employer' ? '/recruiter/employer/dashboard' : '/recruiter/dashboard',
      icon: <FaTachometerAlt />,
      active: (session?.user?.role === 'employer' ? router.pathname === '/recruiter/employer/dashboard' : router.pathname === '/recruiter/dashboard'),
    },
    {
      name: 'My Talent',
      href: '/recruiter/my-talent',
      icon: <FaUsers />,
      active: router.pathname.startsWith('/recruiter/my-talent'),
    },
    {
      name: 'Job Post',
      href: '/recruiter/jobs',
      icon: <FaBriefcase />,
      active: router.pathname.startsWith('/recruiter/jobs'),
    },
    {
      name: 'Reports',
      href: '/recruiter/reports',
      icon: <FaChartLine />,
      active: router.pathname.startsWith('/recruiter/reports'),
      roles: ['employer', 'manager', 'employee'],
    },
    {
      name: 'Profile Allocations',
      href: '/recruiter/profile-allocations',
      icon: <FaUserCheck />,
      active: router.pathname.startsWith('/recruiter/profile-allocations'),
      roles: ['manager', 'employee', 'recruiter', 'unassigned'],
    },
    {
      name: 'KPI Tracking',
      href: '/recruiter/manager/kpi-tracking',
      icon: <FaChartLine />,
      active: router.pathname.startsWith('/recruiter/manager/kpi-tracking'),
      roles: ['manager'],
    },
  ];

  // Recruiting menu for employer
  const recruitingNavItems = [
    {
      name: 'Database',
      href: '/recruiter/employer/database',
      icon: <FaDatabase />,
      active: router.pathname.startsWith('/recruiter/employer/database'),
    },
    {
      name: 'TalNurt AI',
      href: '/recruiter/employer/ai',
      icon: <FaRobot />,
      active: router.pathname.startsWith('/recruiter/employer/ai'),
    },
    {
      name: 'Jobs',
      href: '/recruiter/employer/jobs',
      icon: <FaBriefcase />,
      active: router.pathname.startsWith('/recruiter/employer/jobs'),
    },
    {
      name: 'Profile Management',
      icon: <FaUserCog />,
      isExpandable: true,
      active: router.pathname.startsWith('/recruiter/employer/profile-management'),
      children: [
        {
          name: 'Profile Allocation',
          href: '/recruiter/employer/profile-allocation',
          icon: <FaUserCheck />,
          active: router.pathname.startsWith('/recruiter/employer/profile-allocation'),
        },
        {
          name: 'Candidate Management',
          href: '/recruiter/employer/profile-management/candidates',
          icon: <FaUserFriends />,
          active: router.pathname.startsWith('/recruiter/employer/profile-management/candidates'),
        },
        {
          name: 'Matrix',
          href: '/recruiter/employer/profile-management/matrix',
          icon: <FaThList />,
          active: router.pathname.startsWith('/recruiter/employer/profile-management/matrix'),
        },
      ],
    },
  ];

  // Employer-only navigation items
  const employerNavItems = [
    {
      name: 'Company Profile',
      href: '/recruiter/employer/company',
      icon: <FaBuilding />,
      active: router.pathname.startsWith('/recruiter/employer/company'),
    },
    {
      name: 'Teams Management',
      href: '/recruiter/employer/teams',
      icon: <FaUserFriends />,
      active: router.pathname.startsWith('/recruiter/employer/teams'),
    },
    {
      name: 'Company Employees',
      href: '/recruiter/employer/employees',
      icon: <FaUsers />,
      active: router.pathname.startsWith('/recruiter/employer/employees'),
    },
    {
      name: 'Past Employees',
      href: '/recruiter/employer/past-employees',
      icon: <FaUserTie />,
      active: router.pathname.startsWith('/recruiter/employer/past-employees'),
    },
    {
      name: 'User Creation Requests',
      href: '/recruiter/employer/user-requests',
      icon: <FaUserTie />,
      active: router.pathname.startsWith('/recruiter/employer/user-requests'),
    },
  ];

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-blue-100 rounded mb-3"></div>
          <div className="h-3 w-24 bg-blue-50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 md:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar - Fixed position, full height */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 flex flex-col bg-[#4154ef] shadow-lg`}
      >
        <div className="h-full flex flex-col">
          {/* Logo and close button */}
          <div className="p-6 flex items-center justify-between border-b border-white border-opacity-20">
            <div>
              <h1 className="text-xl font-bold text-white">Talnurt</h1>
              <p className="text-sm text-white text-opacity-80">Recruitment Portal</p>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-white hover:text-gray-200"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-grow overflow-y-auto py-6">
            <ul className="space-y-1 px-3">
              {navItems
                .filter(item => !item.roles || item.roles.includes(session.user.role))
                .map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href || '#'}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      item.active
                        ? 'bg-white bg-opacity-20 text-white font-medium'
                        : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }}
                  >
                    <span className="mr-3 text-white">
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.name}</span>
                    
                    {/* Add notification badge for Reports */}
                    {item.name === 'Reports' && unreadReports.total > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium leading-none text-white bg-red-500 rounded-full">
                        {unreadReports.total}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
              
              {/* Recruiting navigation section - Show for employers and managers only */}
              {(hasEmployerAccess || session?.user?.role === 'manager') && (
                <>
                  <li className="my-4">
                    <hr className="border-white border-opacity-30" />
                    <p className="text-xs text-white text-opacity-60 uppercase tracking-wide font-medium px-4 py-2">
                      {hasEmployerAccess ? 'Employer Features' : 'Recruiting'}
                    </p>
                  </li>
                  {/* Recruiting expandable menu */}
                  <li>
                    <button
                      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${
                        recruitingNavItems.some(item => item.active)
                          ? 'bg-white bg-opacity-20 text-white font-medium'
                          : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
                      }`}
                      onClick={() => setNotificationsOpen((open) => !open)}
                    >
                      <span className="mr-3 text-white"><FaDatabase /></span>
                      <span className="flex-1 text-left">Recruiting</span>
                      <span className="ml-auto flex items-center">
                        {notificationsOpen ? <FaChevronDown className="text-white" /> : <FaChevronRight className="text-white" />}
                      </span>
                    </button>
                    {notificationsOpen && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {recruitingNavItems.map((item) => (
                          <li key={item.name}>
                            {item.isExpandable ? (
                              <>
                                <button
                                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${
                                    item.children.some(child => child.active)
                                      ? 'bg-white bg-opacity-20 text-white font-medium'
                                      : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
                                  }`}
                                  onClick={() => setNotificationsOpen((open) => !open)}
                                >
                                  <span className="mr-3 text-white">{item.icon}</span>
                                  <span className="flex-1 text-left">{item.name}</span>
                                  <span className="ml-auto flex items-center">
                                    {notificationsOpen ? <FaChevronDown className="text-white" /> : <FaChevronRight className="text-white" />}
                                  </span>
                                </button>
                                {notificationsOpen && (
                                  <ul className="ml-4 mt-1 space-y-1">
                                    {item.children.map((child) => (
                                      <li key={child.name}>
                                        <Link
                                          href={child.href ?? '#'}
                                          className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                            child.active
                                              ? 'bg-white bg-opacity-20 text-white font-medium'
                                              : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
                                          }`}
                                          onClick={() => {
                                            if (window.innerWidth < 768) {
                                              setSidebarOpen(false);
                                            }
                                          }}
                                        >
                                          <span className="mr-3 text-white">{child.icon}</span>
                                          <span>{child.name}</span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </>
                            ) : (
                              <Link
                                href={item.href || '#'}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                  item.active
                                    ? 'bg-white bg-opacity-20 text-white font-medium'
                                    : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
                                }`}
                                onClick={() => {
                                  if (window.innerWidth < 768) {
                                    setSidebarOpen(false);
                                  }
                                }}
                              >
                                <span className="mr-3 text-white">{item.icon}</span>
                                <span>{item.name}</span>
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                  {/* Keep employer-only items restricted to hasEmployerAccess */}
                  {hasEmployerAccess && employerNavItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href || '#'}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          item.active
                            ? 'bg-white bg-opacity-20 text-white font-medium'
                            : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
                        }`}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <span className="mr-3 text-white">
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </nav>

          {/* User profile and logout */}
          <div className="p-4 border-t border-white border-opacity-20">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
              <div className="ml-3 flex-1 truncate">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
                <p className="text-xs text-white text-opacity-70 truncate">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/recruiter/signin' })}
              className="flex w-full items-center px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <FaSignOutAlt className="mr-3 text-white text-opacity-80" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content - with left margin to account for sidebar */}
      <div className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-hidden">
        {/* Header bar - Fixed at top */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile menu toggle button - only visible on mobile */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-700 hover:text-[#3245df]"
            >
              <FaBars size={20} />
            </button>
            
            {/* User info and logout */}
            <div className="flex items-center space-x-4 ml-auto">
              <SessionRefreshButton className="mr-2" />
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => {}}
                  className="text-gray-700 hover:text-blue-600 relative"
                >
                  <FaBell size={18} />
                  {unreadReports.total > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadReports.total > 9 ? '9+' : unreadReports.total}
                    </span>
                  )}
                </button>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-blue-600" size={14} />
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500">
                    {session?.user?.role === 'unassigned' 
                      ? 'Recruiter' 
                      : session?.user?.role && `${session.user.role.charAt(0).toUpperCase()}${session.user.role.slice(1)}`}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => signOut({ callbackUrl: '/auth/recruiter/signin' })}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                title="Logout"
              >
                <FaSignOutAlt size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
        
        {/* Enhanced footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex flex-col md:flex-row md:justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-500">© 2025 Talnurt Recruitment Portal. All rights reserved.</p>
              </div>
              <div className="flex space-x-6">
                <Link 
                  href="/about" 
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  About Us
                </Link>
                <Link 
                  href="/privacy-policy" 
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms-of-service" 
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default RecruiterLayout; 