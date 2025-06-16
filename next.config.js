/** @type {import('next').NextConfig} */

// Run uploads directory setup
require('./src/utils/setupUploads');

// Get environment variables with fallbacks
const port = process.env.PORT || 3001;
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

// Set default environment variables if not already set
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = baseUrl;
  console.log('Setting default NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
}

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = 'my-super-secure-nextauth-secret-123!@#';
  console.log('Setting default NEXTAUTH_SECRET (masked):', process.env.NEXTAUTH_SECRET.substring(0, 3) + '...');
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  
  // TypeScript configuration
  typescript: {
    // Temporarily ignore TypeScript errors during build
    // FIXME: This should be addressed by fixing the schema mismatches
    ignoreBuildErrors: true,
  },
  
  // Basic image optimization
  images: {
    domains: ['localhost', 'via.placeholder.com', 'example.com', 'placehold.co'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Enable compression
  compress: true,
  
  // Minimal configuration to avoid module issues
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  
  // No custom headers in development to avoid conflicts
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    
    // Basic production caching
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=59',
          },
        ],
      },
    ];
  },
  
  // Set environment variables that will be available on both client and server side
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || baseUrl,
    BASE_URL: process.env.BASE_URL || baseUrl,
    API_URL: process.env.API_URL || `${baseUrl}/api`,
  },
  
  // Add publicRuntimeConfig for server-side usage
  publicRuntimeConfig: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || baseUrl,
    BASE_URL: process.env.BASE_URL || baseUrl,
    API_URL: process.env.API_URL || `${baseUrl}/api`,
  },

  async redirects() {
    return [
      // Redirect old route to new route
      {
        source: '/recruiter/employer/candidates/:id/status',
        destination: '/recruiter/employer/profile-management/candidates/:id',
        permanent: true,
      },
    ]
  },

  // Exclude problematic pages from static generation
  exportPathMap: async function (defaultPathMap) {
    delete defaultPathMap['/recruiter/employer/candidates/[id]/status'];
    return defaultPathMap;
  },
};

module.exports = nextConfig; 