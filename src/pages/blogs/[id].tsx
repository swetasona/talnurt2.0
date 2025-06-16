import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { FaArrowLeft, FaCalendarAlt, FaTag, FaUser, FaClock, FaShare, FaLinkedin, FaTwitter, FaFacebook, FaExclamationCircle, FaLink } from 'react-icons/fa';
import { formatDate } from '../../utils/dateFormatter';
import { motion } from 'framer-motion';

interface Blog {
  id: string;
  title: string;
  category: string;
  content: string;
  imagePath?: string;
  createdAt: string;
}

const BlogPost = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Get the current absolute URL for sharing
  const currentUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : '';

  useEffect(() => {
    if (!id) return;

    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/blogs/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch blog post');
        }
        
        const data = await response.json();
        setBlog(data.blog);
        
        // Fetch all blogs to get related content
        const allBlogsRes = await fetch('/api/blogs');
        if (allBlogsRes.ok) {
          const allBlogsData = await allBlogsRes.json();
          // Get blogs with the same category, excluding current blog
          const related = allBlogsData.blogs
            .filter((b: Blog) => b.id !== data.blog.id && b.category === data.blog.category)
            .slice(0, 3); // Limit to 3 related posts
          setRelatedBlogs(related);
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to load blog post. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlog();
  }, [id]);

  // Reset copy status after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Share functions
  const handleShareLinkedIn = () => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const title = blog?.title || 'Check out this blog post!';
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleShareFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopySuccess(true);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaExclamationCircle className="text-red-500 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-8">{error || 'Blog post not found'}</p>
          <Link href="/blogs" className="btn btn-primary inline-flex items-center">
            <FaArrowLeft className="mr-2" />
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  // Estimate reading time
  const readingTime = Math.max(1, Math.ceil(blog.content.replace(/<[^>]*>/g, '').split(' ').length / 200));

  return (
    <>
      <Head>
        <title>{blog.title} | Talnurt Blogs</title>
        <meta name="description" content={blog.content.replace(/<[^>]*>/g, '').substring(0, 160)} />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Header - Modern Redesign */}
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <div className="w-1/3 flex justify-start">
                <Link href="/blogs" className="flex items-center text-gray-600 hover:text-primary transition-colors">
                  <FaArrowLeft className="mr-2" />
                  <span className="font-medium">Back to Home</span>
                </Link>
              </div>
              
              <div className="w-1/3 flex justify-center">
                <h1 className="text-2xl font-bold text-primary">
                  Talnurt Blogs
                </h1>
              </div>
              
              <div className="w-1/3 flex justify-end">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search blogs..."
                    className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Share buttons - now as floating buttons */}
        <div className="fixed right-4 top-24 z-10 flex flex-col gap-2 bg-white p-2 rounded-full shadow-md">
          <div className="relative">
            <div className={`${copySuccess ? 'opacity-100' : 'opacity-0'} absolute -left-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none transition-opacity duration-300`}>
              Copied!
            </div>
            <button 
              onClick={handleCopyLink}
              aria-label="Copy link"
              className="p-2 text-gray-500 hover:text-primary bg-white rounded-full hover:bg-gray-100 transition-colors"
            >
              <FaLink className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={handleShareLinkedIn}
            aria-label="Share on LinkedIn" 
            className="p-2 text-gray-500 hover:text-blue-600 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaLinkedin className="w-4 h-4" />
          </button>
          <button 
            onClick={handleShareTwitter}
            aria-label="Share on Twitter" 
            className="p-2 text-gray-500 hover:text-blue-400 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaTwitter className="w-4 h-4" />
          </button>
          <button 
            onClick={handleShareFacebook}
            aria-label="Share on Facebook" 
            className="p-2 text-gray-500 hover:text-blue-600 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaFacebook className="w-4 h-4" />
          </button>
        </div>
        
        {/* Main Content */}
        <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Blog Category Badge */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-[1px] w-8 bg-primary"></div>
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-primary text-sm font-medium rounded-full flex items-center">
                <FaTag className="mr-2 h-3 w-3" />
                {blog.category.charAt(0).toUpperCase() + blog.category.slice(1)}
              </span>
              <div className="h-[1px] w-8 bg-primary"></div>
            </div>
            
            {/* Blog Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8 leading-tight">
                <span className="relative inline-block">
                  {blog.title}
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-primary/30 rounded-full"></div>
                </span>
              </h1>
              
              <div className="flex flex-wrap items-center justify-center text-gray-600 gap-6 mb-8">
                <div className="flex items-center">
                  <div className="w-9 h-9 bg-gradient-to-tr from-primary to-indigo-600 rounded-full flex items-center justify-center text-white mr-2 shadow-sm">
                    <FaUser className="w-4 h-4" />
                  </div>
                  <span>Talnurt Team</span>
                </div>
                <div className="flex items-center">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-primary mr-2">
                    <FaCalendarAlt className="w-4 h-4" />
                  </div>
                  <span>{formatDate(blog.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-2">
                    <FaClock className="w-4 h-4" />
                  </div>
                  <span>{readingTime} min read</span>
                </div>
              </div>
            </div>
            
            {/* Blog Featured Image */}
            {blog.imagePath && (
              <div className="mb-12 shadow-xl rounded-2xl overflow-hidden transform transition-transform hover:scale-[1.01] mx-auto max-w-3xl">
                <img
                  src={blog.imagePath}
                  alt={blog.title}
                  className="w-full h-auto"
                />
              </div>
            )}
            
            {/* Blog Content */}
            <div className="relative">
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-50 to-transparent -z-10"></div>
              <article className="prose prose-lg lg:prose-xl max-w-none bg-white p-8 sm:p-12 rounded-2xl shadow-lg mb-16 relative z-10">
                <div 
                  dangerouslySetInnerHTML={{ __html: blog.content }} 
                  className="blog-content"
                />
              </article>
            </div>
            
            {/* Tags and Share Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-white rounded-xl shadow-md mb-16">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-600">Tags:</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {blog.category}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">Share:</span>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopyLink}
                    className={`p-2 ${copySuccess ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-primary'} rounded-full hover:bg-blue-200 transition-colors`}
                  >
                    <FaLink className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleShareLinkedIn}
                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <FaLinkedin className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleShareTwitter}
                    className="p-2 bg-blue-100 text-blue-400 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <FaTwitter className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleShareFacebook}
                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <FaFacebook className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Related Posts */}
          {relatedBlogs.length > 0 && (
            <div className="mt-16">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="h-[1px] w-10 bg-primary"></div>
                  <span className="inline-block px-4 py-1.5 bg-blue-100 text-primary text-sm font-medium rounded-full">Discover More</span>
                  <div className="h-[1px] w-10 bg-primary"></div>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-5">
                  <span className="relative inline-block">
                    Related Articles
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-28 h-1.5 bg-primary/30 rounded-full"></div>
                  </span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedBlogs.map((relatedBlog, index) => (
                  <Link 
                    key={relatedBlog.id} 
                    href={`/blogs/${relatedBlog.id}`}
                    className="group"
                  >
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-md overflow-hidden h-full hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                    >
                      <div className="h-3 bg-gradient-to-r from-primary to-indigo-600 w-full"></div>
                      {relatedBlog.imagePath ? (
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={relatedBlog.imagePath} 
                            alt={relatedBlog.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-r from-primary/10 to-indigo-600/10 flex items-center justify-center p-4">
                          <h3 className="text-lg font-bold text-primary text-center">{relatedBlog.title}</h3>
                        </div>
                      )}
                      <div className="p-6">
                        {relatedBlog.imagePath && (
                          <h3 className="font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors line-clamp-2 text-lg">
                            {relatedBlog.title}
                          </h3>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center text-sm text-gray-500">
                            <FaCalendarAlt className="mr-1" />
                            <span>{formatDate(relatedBlog.createdAt)}</span>
                          </div>
                          <span className="text-sm font-medium text-primary group-hover:underline flex items-center">
                            Read More
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="bg-gradient-to-r from-primary to-indigo-600 text-white shadow-inner mt-24">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-8 md:mb-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary font-bold text-xl shadow-md mr-3">
                    T
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Talnurt</h2>
                    <p className="text-sm text-white/80">Recruitment Portal</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-white/80 text-sm">
                &copy; {new Date().getFullYear()} Talnurt. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Add some custom styles for blog content */}
      <style jsx global>{`
        .blog-content img {
          border-radius: 0.75rem;
          margin: 2.5rem auto;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 100%;
          height: auto;
        }
        
        .blog-content a {
          color: #3245df;
          text-decoration: underline;
          font-weight: 500;
          transition: color 0.2s;
        }
        
        .blog-content a:hover {
          color: #4d5ef7;
        }
        
        .blog-content blockquote {
          border-left: 4px solid #3245df;
          padding-left: 1.5rem;
          font-style: italic;
          color: #4b5563;
          background-color: #f3f4ff;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin: 2rem 0;
        }
        
        .blog-content h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: #1f2937;
          position: relative;
          padding-bottom: 0.75rem;
        }
        
        .blog-content h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 3rem;
          height: 0.25rem;
          background: linear-gradient(to right, #3245df, #6366f1);
          border-radius: 0.5rem;
        }
        
        .blog-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #1f2937;
        }
        
        .blog-content p {
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }
        
        .blog-content ul, .blog-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        
        .blog-content li {
          margin-bottom: 0.5rem;
        }
        
        .blog-content pre {
          background-color: #f3f4ff;
          padding: 1.5rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 2rem 0;
          border: 1px solid #e5e7eb;
        }
        
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
        }
        
        .blog-content th, .blog-content td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          text-align: left;
        }
        
        .blog-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        .blog-content tr:nth-child(even) {
          background-color: #f9fafb;
        }
      `}</style>
    </>
  );
};

export default BlogPost; 