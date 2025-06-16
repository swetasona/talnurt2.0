import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FaImage, FaSpinner } from 'react-icons/fa';

// Import ReactQuill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-60 border border-gray-300 rounded-md animate-pulse bg-gray-50"></div>
});

export interface BlogFormData {
  title: string;
  content: string;
  category: string;
  imagePath?: string;
}

interface BlogEditorProps {
  formData: BlogFormData;
  onChange: (field: string, value: string) => void;
  categories: { value: string; label: string }[];
  error?: string;
  featuredImage?: string;
  onImageUpload: (url: string) => void;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ 
  formData, 
  onChange, 
  categories,
  error,
  featuredImage,
  onImageUpload
}) => {
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Quill styles only on client side
  useEffect(() => {
    // This ensures the CSS is only loaded in the browser, not during SSR
    if (typeof window !== 'undefined') {
      require('react-quill/dist/quill.snow.css');
    }
  }, []);

  // Quill editor modules and formats configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],      
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image', 'align'
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file
    if (!file.type.includes('image')) {
      setImageError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size should be less than 5MB');
      return;
    }

    try {
      setImageUploading(true);
      setImageError('');

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-blog-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      // Call the callback to update parent component
      onImageUpload(data.fileUrl);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setImageError(err.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title*
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category*
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={(e) => onChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Featured Image
        </label>
        <div className="mb-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={imageUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 flex items-center"
            disabled={imageUploading}
          >
            {imageUploading ? (
              <>
                <FaSpinner className="mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FaImage className="mr-2" />
                {featuredImage ? 'Change Image' : 'Upload Image'}
              </>
            )}
          </button>
          
          {imageError && (
            <p className="mt-1 text-sm text-red-600">{imageError}</p>
          )}
        </div>
        
        {featuredImage && (
          <div className="mt-2 mb-4">
            <div className="w-full max-h-60 overflow-hidden rounded-md border border-gray-300">
              <img 
                src={featuredImage} 
                alt="Featured" 
                className="w-full h-auto object-cover" 
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content*
        </label>
        <div className="min-h-[300px]">
          <ReactQuill
            theme="snow"
            value={formData.content}
            onChange={(value) => onChange('content', value)}
            modules={modules}
            formats={formats}
            placeholder="Write your blog content here..."
            className="h-64"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default BlogEditor; 