// Role-based access control utilities
import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';

export type UserRole = 'admin' | 'superadmin' | 'super_admin' | 'recruiter' | 'applicant' | 'unassigned' | 'employee' | 'employer' | 'manager';

export const ROLES = {
  ADMIN: 'admin' as const,
  SUPERADMIN: 'superadmin' as const,
  SUPER_ADMIN: 'super_admin' as const,
  RECRUITER: 'recruiter' as const,
  APPLICANT: 'applicant' as const,
  UNASSIGNED: 'unassigned' as const,
  EMPLOYEE: 'employee' as const,
  EMPLOYER: 'employer' as const,
  MANAGER: 'manager' as const,
};

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'admin-super-secret-key-2024!';

// Verify admin JWT token from request
export function verifyAdminToken(req: NextApiRequest): any | null {
  try {
    const token = req.cookies['admin-token'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Check if user can post jobs
export function canPostJobs(role: string): boolean {
  return role === ROLES.ADMIN || 
         role === ROLES.SUPERADMIN || 
         role === ROLES.SUPER_ADMIN ||
         role === ROLES.RECRUITER ||
         role === ROLES.EMPLOYER ||
         role === ROLES.MANAGER ||
         role === ROLES.EMPLOYEE;
}

// Check if user can view all jobs (including those posted by others)
export function canViewAllJobs(role: string): boolean {
  return role === ROLES.ADMIN || 
         role === ROLES.SUPERADMIN || 
         role === ROLES.SUPER_ADMIN;
}

// Check if user is an admin (any level)
export function isAdmin(role: string): boolean {
  return role === ROLES.ADMIN || 
         role === ROLES.SUPERADMIN || 
         role === ROLES.SUPER_ADMIN;
}

// Check if user is a recruiter
export function isRecruiter(role: string): boolean {
  return role === ROLES.RECRUITER || 
         role === ROLES.UNASSIGNED || 
         role === ROLES.EMPLOYEE || 
         role === ROLES.EMPLOYER || 
         role === ROLES.MANAGER;
}

// Check if user is an applicant
export function isApplicant(role: string): boolean {
  return role === ROLES.APPLICANT;
}

// Get user roles that can post jobs
export function getJobPostingRoles(): UserRole[] {
  return [
    ROLES.ADMIN, 
    ROLES.SUPERADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.RECRUITER,
    ROLES.UNASSIGNED,
    ROLES.EMPLOYEE,
    ROLES.EMPLOYER,
    ROLES.MANAGER
  ];
}

// Create posted_by tracking object
export interface PostedBy {
  userId: string;
  role: UserRole;
}

export function createPostedByInfo(userId: string, role: string): PostedBy {
  return {
    userId,
    role: role as UserRole,
  };
} 