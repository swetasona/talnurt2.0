import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345678',
  port: 5432,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000
});

// Helper function to execute queries
const executeQuery = async (query: string, params?: any[]) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Ensure blog table exists
const ensureBlogTableExists = async () => {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS blogs (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_path VARCHAR(255),
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);
    return true;
  } catch (error) {
    console.error('Error ensuring blog table exists:', error);
    return false;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid blog ID' });
  }

  // For JSON fallback if database connection fails
  const fallbackGetBlog = async (blogId: string) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const DATA_FILE_PATH = path.join(process.cwd(), 'blog-data.json');
      
      if (fs.existsSync(DATA_FILE_PATH)) {
        const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        const blogs = JSON.parse(data);
        return blogs.find((blog: any) => blog.id === blogId);
      }
      return null;
    } catch (err) {
      console.error('Error reading from fallback:', err);
      return null;
    }
  };

  // Helper function to update a blog in the fallback JSON
  const fallbackUpdateBlog = async (blogId: string, updates: any) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const DATA_FILE_PATH = path.join(process.cwd(), 'blog-data.json');
      
      if (fs.existsSync(DATA_FILE_PATH)) {
        const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        const blogs = JSON.parse(data);
        
        const blogIndex = blogs.findIndex((blog: any) => blog.id === blogId);
        if (blogIndex === -1) {
          return null;
        }
        
        // Update the blog
        const updatedBlog = {
          ...blogs[blogIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        blogs[blogIndex] = updatedBlog;
        
        // Save the updated blogs
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(blogs, null, 2), 'utf8');
        
        return updatedBlog;
      }
      return null;
    } catch (err) {
      console.error('Error updating fallback:', err);
      return null;
    }
  };

  // GET request - fetch a single blog post
  if (req.method === 'GET') {
    try {
      console.log('Fetching blog with ID:', id);
      let blog = null;
      
      try {
        // Ensure table exists
        await ensureBlogTableExists();
        
        // Check if blogs table exists in the database
        const tableExists = await executeQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'blogs'
          )
        `);
        
        if (!tableExists[0].exists) {
          console.log('Blogs table does not exist, trying fallback');
          blog = await fallbackGetBlog(id);
        } else {
          // Find blog by ID
          const result = await executeQuery(`
            SELECT * FROM blogs WHERE id = $1
          `, [id]);
          
          if (result.length > 0) {
            blog = {
              id: result[0].id,
              title: result[0].title,
              content: result[0].content,
              category: result[0].category,
              imagePath: result[0].image_path,
              createdAt: result[0].created_at,
              updatedAt: result[0].updated_at
            };
          }
        }
      } catch (dbError) {
        console.error('Database error, trying fallback:', dbError);
        blog = await fallbackGetBlog(id);
      }
      
      if (!blog) {
        console.log('Blog not found');
        return res.status(404).json({ error: 'Blog post not found' });
      }
      
      console.log('Blog found:', blog.title);
      return res.status(200).json({ blog });
    } catch (error) {
      console.error('Error fetching blog:', error);
      return res.status(500).json({ error: 'Failed to fetch blog post' });
    }
  }
  
  // PUT request - update a blog post
  if (req.method === 'PUT') {
    try {
      const { title, content, category, imagePath } = req.body;
      
      // Validate required fields
      if (!title || !content || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      let updatedBlog;
      
      try {
        // Ensure table exists
        await ensureBlogTableExists();
        
        // Check if blogs table exists in the database
        const tableExists = await executeQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'blogs'
          )
        `);
        
        if (!tableExists[0].exists) {
          console.log('Blogs table does not exist, trying fallback');
          updatedBlog = await fallbackUpdateBlog(id, { title, content, category, imagePath });
        } else {
          // Update blog in database
          const now = new Date();
          const result = await executeQuery(`
            UPDATE blogs
            SET title = $1, content = $2, category = $3, image_path = $4, updated_at = $5
            WHERE id = $6
            RETURNING *
          `, [title, content, category, imagePath, now, id]);
          
          if (result.length === 0) {
            return res.status(404).json({ error: 'Blog post not found' });
          }
          
          updatedBlog = {
            id: result[0].id,
            title: result[0].title,
            content: result[0].content,
            category: result[0].category,
            imagePath: result[0].image_path,
            createdAt: result[0].created_at,
            updatedAt: result[0].updated_at
          };
        }
      } catch (dbError) {
        console.error('Database error, trying fallback:', dbError);
        
        updatedBlog = await fallbackUpdateBlog(id, {
          title,
          content,
          category,
          imagePath
        });
        
        if (!updatedBlog) {
          return res.status(404).json({ error: 'Blog post not found' });
        }
      }
      
      return res.status(200).json({ blog: updatedBlog });
    } catch (error) {
      console.error('Error updating blog:', error);
      return res.status(500).json({ error: 'Failed to update blog post' });
    }
  }
  
  // DELETE request - delete a blog post
  if (req.method === 'DELETE') {
    try {
      try {
        // Ensure table exists
        await ensureBlogTableExists();
        
        // Check if blogs table exists in the database
        const tableExists = await executeQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'blogs'
          )
        `);
        
        if (!tableExists[0].exists) {
          console.log('Blogs table does not exist, trying fallback');
        } else {
          // Delete blog from database
          const result = await executeQuery(`
            DELETE FROM blogs WHERE id = $1
            RETURNING id
          `, [id]);
          
          if (result.length === 0) {
            // If the blog wasn't found in the database, try the fallback
            const fallbackBlog = await fallbackGetBlog(id);
            if (!fallbackBlog) {
              return res.status(404).json({ error: 'Blog post not found' });
            }
          }
        }
      } catch (dbError) {
        console.error('Database error, trying fallback:', dbError);
      }
      
      // Always try fallback deletion for consistency
      const fs = require('fs');
      const path = require('path');
      const DATA_FILE_PATH = path.join(process.cwd(), 'blog-data.json');
      
      if (fs.existsSync(DATA_FILE_PATH)) {
        const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        const blogs = JSON.parse(data);
        
        const filteredBlogs = blogs.filter((blog: any) => blog.id !== id);
        
        // If the length didn't change, the blog was not found in fallback
        // But we don't return an error here as it might have been deleted from the database
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(filteredBlogs, null, 2), 'utf8');
      }
      
      return res.status(200).json({ message: 'Blog post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog:', error);
      return res.status(500).json({ error: 'Failed to delete blog post' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
} 