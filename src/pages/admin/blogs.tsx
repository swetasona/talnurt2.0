import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../components/Layout/AdminLayout';
import { FaEye, FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import { formatDate } from '../../utils/dateFormatter';

interface Blog {
  id: string;
  title: string;
  category: string;
  content: string;
  imagePath?: string;
  createdAt: string;
}

const AdminBlogsPage = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/blogs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch blogs');
        }
        
        const data = await response.json();
        setBlogs(data.blogs || []);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Failed to load blogs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, []);

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete blog post');
      }
      
      // Remove the deleted blog from state
      setBlogs(blogs.filter(blog => blog.id !== id));
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('Failed to delete blog post. Please try again.');
    }
  };

  // Get unique categories
  const categories = Array.from(new Set(blogs.map(blog => blog.category)));

  // Filter blogs based on search and category
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = searchTerm === '' || 
      blog.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Blog Posts</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search blogs..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link href="/admin/create-blog" className="btn btn-primary flex items-center justify-center py-2 px-4">
              <FaPlus className="mr-2" />
              Create New Blog
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            {error}
          </div>
        )}

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-gray-600 font-medium">Filter by:</span>
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                  ${selectedCategory === '' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${selectedCategory === category 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 bg-white rounded-lg shadow">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading blogs...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredBlogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBlogs.map((blog) => (
                      <tr key={blog.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {blog.imagePath && (
                              <div className="flex-shrink-0 h-10 w-10 mr-3">
                                <img 
                                  src={blog.imagePath} 
                                  alt={blog.title}
                                  className="h-10 w-10 rounded-md object-cover" 
                                />
                              </div>
                            )}
                            <div className="truncate max-w-md">
                              <div className="text-sm font-medium text-gray-900 truncate">{blog.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {blog.category.charAt(0).toUpperCase() + blog.category.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(blog.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-3 justify-end">
                            <Link
                              href={`/blogs/${blog.id}`}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-md transition-colors"
                              title="View Blog"
                            >
                              <FaEye />
                            </Link>
                            <Link
                              href={`/admin/edit-blog/${blog.id}`}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 p-2 rounded-md transition-colors"
                              title="Edit Blog"
                            >
                              <FaEdit />
                            </Link>
                            <button
                              onClick={() => handleDeleteBlog(blog.id)}
                              className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-md transition-colors"
                              title="Delete Blog"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-xl font-medium text-gray-600 mb-2">
                  {searchTerm || selectedCategory 
                    ? 'No matching blog posts found' 
                    : 'No blog posts found. Create your first blog post!'}
                </p>
                {(searchTerm || selectedCategory) && (
                  <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
                )}
                <Link href="/admin/create-blog" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  <FaPlus className="mr-2" />
                  Create Blog Post
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBlogsPage; 