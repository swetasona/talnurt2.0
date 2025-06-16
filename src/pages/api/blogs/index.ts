import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

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

// For JSON fallback if database connection fails
const fallbackGetBlogs = async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const DATA_FILE_PATH = path.join(process.cwd(), 'blog-data.json');
    
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error('Error reading from fallback:', err);
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API request received:', req.method);
  
  // Handle GET request
  if (req.method === 'GET') {
    try {
      console.log('Fetching blogs from database');
      let blogs = [];
      
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
          console.log('Blogs table does not exist in the database, returning empty array');
          return res.status(200).json({ blogs: [] });
        }
        
        // Fetch all blogs
        blogs = await executeQuery(`
          SELECT * FROM blogs ORDER BY created_at DESC
        `);
        
        // Format dates
        blogs = blogs.map(blog => ({
          id: blog.id,
          title: blog.title,
          content: blog.content,
          category: blog.category,
          imagePath: blog.image_path,
          createdAt: blog.created_at,
          updatedAt: blog.updated_at
        }));
      } catch (dbError) {
        console.error('Database error, trying fallback:', dbError);
        blogs = await fallbackGetBlogs();
      }
      
      console.log('Found blogs:', blogs.length);
      return res.status(200).json({ blogs });
    } catch (error) {
      console.error('Error fetching blogs:', error);
      return res.status(500).json({ error: 'Failed to fetch blogs' });
    }
  } 
  
  // Handle POST request
  else if (req.method === 'POST') {
    try {
      console.log('Creating new blog post with data:', req.body);
      const { title, content, category, imagePath } = req.body;
      
      // Validate required fields
      if (!title || !content || !category) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      let blog = null;
      
      try {
        // Ensure table exists
        await ensureBlogTableExists();
        
        const id = uuidv4();
        const now = new Date();
        
        // Create a new blog post
        const result = await executeQuery(`
          INSERT INTO blogs (id, title, content, category, image_path, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [id, title, content, category, imagePath, now, now]);
        
        blog = {
          id: result[0].id,
          title: result[0].title,
          content: result[0].content,
          category: result[0].category,
          imagePath: result[0].image_path,
          createdAt: result[0].created_at,
          updatedAt: result[0].updated_at
        };
      } catch (dbError) {
        console.error('Database error, saving to fallback:', dbError);
        // Fallback to JSON file
        const fs = require('fs');
        const path = require('path');
        const DATA_FILE_PATH = path.join(process.cwd(), 'blog-data.json');
        
        const blogs = await fallbackGetBlogs();
        const newBlog = {
          id: uuidv4(),
          title,
          content,
          category,
          imagePath,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        blogs.push(newBlog);
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(blogs, null, 2), 'utf8');
        blog = newBlog;
      }
      
      console.log('Blog created successfully:', blog.id);
      return res.status(201).json({ blog });
    } catch (error) {
      console.error('Error creating blog:', error);
      return res.status(500).json({ error: 'Failed to create blog post' });
    }
  } 
  
  // Method not allowed
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 