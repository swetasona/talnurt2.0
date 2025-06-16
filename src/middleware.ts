import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log("Middleware running for path:", pathname);

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth',
    '/api/auth',
    '/jobs',
    '/contact',
    '/blogs',
    '/api/jobs',
    '/api/upload',
    '/uploads',
    '/resume',
    '/upload-resume',
    '/setup',
    '/admin/login', // Only admin login page should be public
  ];

  // Check if path is public
  const isPublicRoute = pathname === '/' || publicRoutes.some(route => {
    if (route === '/api/auth') {
      // Exact match for /api/auth paths but exclude /api/admin
      return pathname.startsWith('/api/auth') && !pathname.startsWith('/api/admin');
    }
    return pathname.startsWith(route);
  });
  
  if (isPublicRoute) {
    console.log("Public route, allowing access:", pathname);
    return NextResponse.next();
  }

  // For admin routes, check for token presence (verification will be done by API routes)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Allow only specific admin auth endpoints
    if (pathname === '/api/admin/auth/login' || pathname === '/api/admin/auth/verify') {
      console.log("Admin auth endpoint, allowing access:", pathname);
      return NextResponse.next();
    }

    // TEMPORARY: Skip token check for user-creation-requests endpoint for testing
    if (pathname === '/api/admin/user-creation-requests' || pathname === '/admin/user-creation-requests') {
      console.log("TEMPORARY: Skipping middleware auth check for user-creation-requests");
      return NextResponse.next();
    }

    console.log("Admin route - checking for admin token presence:", pathname);
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      console.log("No admin token found, redirecting to login");
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'No token found' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    console.log("Admin token found, allowing access (verification will be done by API route):", pathname);
      return NextResponse.next();
  }

  // For recruiter routes, check NextAuth session
  if (pathname.startsWith("/recruiter") || pathname.startsWith("/api/recruiter")) {
    console.log("Recruiter route, checking NextAuth session:", pathname);
    
    // For API routes, let the API handler check authentication
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    
    // Check for next-auth.session-token cookie
    const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                         request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    if (!sessionToken) {
      console.log("No session token found, redirecting to login");
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    
    // Let the page handle detailed session validation
    return NextResponse.next();
  }

  // For protected dashboard and profile routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile")) {
    console.log("Protected route, checking NextAuth session:", pathname);
    
    // For API routes, let the API handler check authentication
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    
    // Check for next-auth.session-token cookie
    const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                         request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    if (!sessionToken) {
      console.log("No session token found, redirecting to login");
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    
    return NextResponse.next();
  }

  // Add a bypass for debug routes
  if (pathname.startsWith('/debug/') || pathname.startsWith('/api/debug/')) {
    console.log('Debug route, bypassing middleware:', pathname);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*", 
    "/recruiter/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/api/admin/:path*",
    "/api/recruiter/:path*",
    "/api/dashboard/:path*",
    "/api/profile/:path*"
  ],
}; 