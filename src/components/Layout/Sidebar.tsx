import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { 
  FaHome, 
  FaUsers, 
  FaBriefcase, 
  FaNetworkWired, 
  FaFileAlt, 
  FaCog, 
  FaUser, 
  FaSignOutAlt,
  FaTimes,
  FaRobot,
  FaFileUpload,
  FaBlog,
  FaEnvelope,
  FaGlobe,
  FaChevronDown,
  FaChevronRight,
  FaTools,
  FaIndustry,
  FaBuilding,
  FaUserTie,
  FaUserCog,
  FaShieldAlt
} from 'react-icons/fa';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const sidebarItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: <FaHome size={18} /> },
  { name: 'My Talent', path: '/admin/my-talent', icon: <FaUsers size={18} /> },
  { name: 'TalNurt AI', path: '/admin/talnurt-ai', icon: <FaRobot size={18} /> },
  { name: 'Business Development', path: '/admin/business-development', icon: <FaBriefcase size={18} /> },
  { name: 'Connect', path: '/admin/connect', icon: <FaNetworkWired size={18} /> },
  { name: 'Job Post', path: '/admin/job-post', icon: <FaFileAlt size={18} /> },
  { 
    name: 'Administration', 
    icon: <FaCog size={18} />,
    isDropdown: true,
    children: [
      { name: 'Skills', path: '/admin/administration/skills', icon: <FaTools size={16} /> },
      { name: 'Industries', path: '/admin/administration/industries', icon: <FaIndustry size={16} /> },
      { name: 'Companies', path: '/admin/administration/companies', icon: <FaBuilding size={16} /> },
      { name: 'Recruiters', path: '/admin/administration/recruiters', icon: <FaUserTie size={16} /> },
      { name: 'Assign Role', path: '/admin/administration/assign-role', icon: <FaUserCog size={16} /> },
      { name: 'Employer Applications', path: '/admin/employer-applications', icon: <FaShieldAlt size={16} /> },
      { name: 'User Creation Requests', path: '/admin/user-creation-requests', icon: <FaUserTie size={16} /> },
      { name: 'Employee Deletion Requests', path: '/admin/employee-deletion-requests', icon: <FaUserTie size={16} /> }
    ]
  },
  { name: 'Profile', path: '/admin/profile', icon: <FaUser size={18} /> },
  { name: 'Blogs', path: '/admin/blogs', icon: <FaBlog size={18} /> },
  { name: 'Global Talent', path: '/admin/global-talent', icon: <FaGlobe size={18} /> },
  { name: 'Queries', path: '/admin/queries', icon: <FaEnvelope size={18} /> },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const router = useRouter();
  const { logout } = useAdminAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  // Check if the current route matches any child routes to auto-expand parent
  useEffect(() => {
    const currentPath = router.pathname;
    
    sidebarItems.forEach(item => {
      if (item.isDropdown && item.children) {
        const shouldExpand = item.children.some(child => currentPath === child.path);
        if (shouldExpand && !expandedItems.includes(item.name)) {
          setExpandedItems(prev => [...prev, item.name]);
        }
      }
    });
  }, [router.pathname]);
  
  const handleToggleDropdown = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name) 
        : [...prev, name]
    );
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  // Handle navigation for regular menu items
  const handleNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    router.push(path);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 flex flex-col bg-[#4154ef] shadow-lg`}
      >
        {/* Sidebar header with logo and close button for mobile */}
        <div className="p-6 flex items-center justify-between border-b border-white border-opacity-20">
          <div>
            <h1 className="text-xl font-bold text-white">Talnurt</h1>
            <p className="text-sm text-white text-opacity-80">Recruitment Portal</p>
          </div>
          <button 
            className="md:hidden text-white hover:text-gray-200 p-1"
            onClick={toggleSidebar}
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Navigation menu */}
        <nav className="flex-grow overflow-y-auto py-6">
          <ul className="space-y-1 px-3">
            {sidebarItems.map((item) => {
              // For dropdown items
              if (item.isDropdown) {
                const isExpanded = expandedItems.includes(item.name);
                const hasActiveChild = item.children?.some(child => router.pathname === child.path);
                
                return (
                  <li key={item.name} className="space-y-1">
                    {/* Dropdown parent */}
                    <button
                      onClick={() => handleToggleDropdown(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        hasActiveChild
                          ? 'bg-white bg-opacity-20 text-white font-medium'
                          : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-white">
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <span className="text-white">
                        {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                      </span>
                    </button>
                    
                    {/* Dropdown children */}
                    {isExpanded && item.children && (
                      <ul className="ml-7 space-y-1 mt-1">
                        {item.children.map((child) => {
                          const isChildActive = router.pathname === child.path;
                          return (
                            <li key={child.path}>
                              <a
                                href={child.path}
                                onClick={(e) => handleNavigation(e, child.path)}
                                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                                  isChildActive
                                    ? 'bg-white bg-opacity-20 text-white font-medium'
                                    : 'text-white text-opacity-70 hover:bg-white hover:bg-opacity-10 hover:text-white'
                                }`}
                              >
                                <span className="mr-3 text-white text-opacity-80">
                                  {child.icon}
                                </span>
                                <span>{child.name}</span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }
              
              // For regular items
              const isActive = router.pathname === item.path;
                
              return (
                <li key={item.name || item.path}>
                  <a 
                    href={item.path || '#'} 
                    onClick={(e) => handleNavigation(e, item.path || '#')}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-white bg-opacity-20 text-white font-medium' 
                        : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                  >
                    <span className="mr-3 text-white">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Bottom action buttons */}
        <div className="p-4 border-t border-white border-opacity-20">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="mr-3 text-white text-opacity-80" size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 