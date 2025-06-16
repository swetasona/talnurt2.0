import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaCalendarAlt, FaTag, FaSearch } from 'react-icons/fa';
import { formatDate } from '../../utils/dateFormatter';
import PageLayout from '@/components/Layout/PageLayout';
import Head from 'next/head';

interface Blog {
  id: string;
  title: string;
  category: string;
  content: string;
  imagePath?: string;
  createdAt: string;
  excerpt?: string;
}

const BlogsPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch blogs on component mount
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/blogs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch blogs');
        }
        
        const data = await response.json();
        
        // Create excerpt from content for previews
        const blogsWithExcerpts = data.blogs.map((blog: Blog) => ({
          ...blog,
          excerpt: blog.content.replace(/<[^>]*>/g, '').substring(0, 120) + (blog.content.length > 120 ? '...' : '')
        }));
        
        setBlogs(blogsWithExcerpts);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Failed to load blogs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, []);

  // Get unique categories
  const categories = Array.from(new Set(blogs.map(blog => blog.category)));

  // Filter blogs based on search term and category
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = searchTerm === '' || 
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      blog.content.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === '' || blog.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <PageLayout title="Blogs | Talnurt" description="Read the latest articles, tips and insights from Talnurt Recruitment Portal">
      <Head>
        <title>Blogs | Talnurt</title>
        <meta name="description" content="Read the latest articles, tips and insights from Talnurt Recruitment Portal" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-[1px] w-10 bg-primary"></div>
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-primary text-sm font-medium rounded-full">Our Insights</span>
              <div className="h-[1px] w-10 bg-primary"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
              <span className="relative inline-block">
                Talnurt <span className="text-primary">Blogs</span>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-primary/30 rounded-full"></div>
              </span>
            </h1>
            <p className="text-gray-600 mt-6 max-w-2xl mx-auto text-lg">
              Explore our collection of articles on career development, job search tips, and industry insights.
            </p>
          </div>
          
          {/* Search and Filter */}
          <div className="mb-10 max-w-3xl mx-auto">
            <div className="relative flex items-center mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
                <p className="font-medium">{error}</p>
              </div>
            )}
            
            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-wrap gap-2 items-center justify-center">
                  <span className="text-gray-600 font-medium mr-2">Filter by:</span>
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${selectedCategory === '' 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    All
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${selectedCategory === category 
                          ? 'bg-primary text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Blog Posts */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-4 text-gray-600 font-medium">Loading blogs...</span>
            </div>
          ) : filteredBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog) => (
                <div key={blog.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full transform hover:-translate-y-1 transition-transform">
                  {blog.imagePath ? (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={blog.imagePath} 
                        alt={blog.title} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-r from-primary to-indigo-500 flex items-center justify-center">
                      <h3 className="text-2xl font-bold text-white px-4 text-center">{blog.title}</h3>
                    </div>
                  )}
                  
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex items-center mb-3">
                      <FaTag className="text-primary mr-2" />
                      <span className="bg-blue-100 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {blog.category.charAt(0).toUpperCase() + blog.category.slice(1)}
                      </span>
                    </div>
                    
                    {blog.imagePath && (
                      <h2 className="text-xl font-bold mb-3 text-gray-900 line-clamp-2">{blog.title}</h2>
                    )}
                    
                    <p className="text-gray-600 mb-4 flex-grow line-clamp-3">{blog.excerpt}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <div className="flex items-center text-gray-500 text-sm">
                        <FaCalendarAlt className="mr-1" />
                        <span>{formatDate(blog.createdAt)}</span>
                      </div>
                      <Link 
                        href={`/blogs/${blog.id}`}
                        className="text-sm font-medium text-primary hover:text-blue-800 flex items-center transition-colors"
                      >
                        Read More 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-xl font-medium text-gray-600 mb-2">No blog posts found.</p>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </main>
      </div>
    </PageLayout>
  );
};

export default BlogsPage; 