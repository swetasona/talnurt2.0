import React, { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/Layout/AdminLayout';
import { FaSave, FaTimes } from 'react-icons/fa';
import BlogEditor, { BlogFormData } from '../../components/Blog/BlogEditor';

const CreateBlog = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    category: '',
    imagePath: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'recruitment', label: 'Recruitment' },
    { value: 'technology', label: 'Technology' },
    { value: 'career', label: 'Career Development' },
    { value: 'industry', label: 'Industry Insights' },
    { value: 'workplace', label: 'Workplace Culture' }
  ];

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

    // Basic validation
    if (!formData.title || !formData.content || !formData.category) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting blog data:', formData);
      
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response data:', errorData);
        throw new Error(errorData.error || 'Failed to create blog post');
      }

      const data = await response.json();
      console.log('Success response:', data);

      // Redirect to blogs admin page on success
      router.push('/admin/blogs');
    } catch (err) {
      console.error('Error creating blog:', err);
      setError('Failed to create blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create New Blog</h1>
        </div>

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
                    Save Blog
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

export default CreateBlog; 