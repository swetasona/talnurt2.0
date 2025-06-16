import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { FaSave, FaTimes } from 'react-icons/fa';
import BlogEditor, { BlogFormData } from '../../../components/Blog/BlogEditor';

const EditBlog = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    category: '',
    imagePath: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    { value: 'recruitment', label: 'Recruitment' },
    { value: 'technology', label: 'Technology' },
    { value: 'career', label: 'Career Development' },
    { value: 'industry', label: 'Industry Insights' },
    { value: 'workplace', label: 'Workplace Culture' }
  ];

  // Fetch blog data when id is available
  useEffect(() => {
    if (!id) return;

    const fetchBlog = async () => {
      try {
        setFetchLoading(true);
        const response = await fetch(`/api/blogs/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch blog post');
        }
        
        const data = await response.json();
        
        setFormData({
          title: data.blog.title,
          content: data.blog.content,
          category: data.blog.category,
          imagePath: data.blog.imagePath || ''
        });
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to load blog post. Please try again later.');
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchBlog();
  }, [id]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleImageUpload = (url: string) => {
    setFormData({
      ...formData,
      imagePath: url
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.title || !formData.content || !formData.category) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update blog post');
      }

      setSuccess('Blog post updated successfully!');
      
      // Wait for a moment before redirecting
      setTimeout(() => {
        router.push('/admin/blogs');
      }, 1500);
    } catch (err) {
      console.error('Error updating blog:', err);
      setError('Failed to update blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <AdminLayout>
        <div className="p-6 flex justify-center items-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Blog</h1>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <BlogEditor
              formData={formData}
              onChange={handleFieldChange}
              categories={categories}
              error={error}
              featuredImage={formData.imagePath}
              onImageUpload={handleImageUpload}
            />

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => router.push('/admin/blogs')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center"
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditBlog; 