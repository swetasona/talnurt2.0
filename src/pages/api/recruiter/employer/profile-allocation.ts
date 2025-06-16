import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || session.user.role !== 'employer') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      // Basic Job Information (matching frontend field names)
      title, // Frontend sends 'title', we'll map to 'jobTitle'
      description, // Frontend sends 'description', we'll map to 'jobDescription'
      
      // Job Details
      location,
      jobType,
      workMode, // Map to remoteStatus
      experience,
      
      // Salary and Compensation
      salary, // We'll parse this for budgetMin/budgetMax
      currency,
      
      // Job Requirements
      skills, // Frontend sends as array or string
      
      // Profile Allocation Specific
      selectedEmployees,
      emailNotifications,
      portalNotifications,
      priority,
      responseDeadline, // Map to deadline
      additionalNotes, // Map to notes
    } = req.body;

    // Get the user's company_id and company from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        company_id: true,
        company: true,
        role: true 
      }
    });

    console.log('Received profile allocation data:', {
      title,
      description: description?.length,
      selectedEmployees: selectedEmployees?.length,
      userId: session.user.id,
      userRole: session.user.role,
      company_id: user?.company_id,
      company: user?.company
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Validation
    if (!title || !description || !selectedEmployees || selectedEmployees.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, description, and at least one selected employee' 
      });
    }

    // Parse salary if provided (expecting format like "50000-80000" or just "60000")
    let budgetMin: number | null = null;
    let budgetMax: number | null = null;
    if (salary && typeof salary === 'string') {
      if (salary.includes('-')) {
        const [min, max] = salary.split('-').map(s => parseFloat(s.trim()));
        budgetMin = min || null;
        budgetMax = max || null;
      } else {
        const parsedSalary = parseFloat(salary);
        if (!isNaN(parsedSalary)) {
          budgetMin = parsedSalary;
        }
      }
    }

    // Validate selected employees exist and are active
    const employeeIds: string[] = selectedEmployees;
    console.log('Looking for employees with IDs:', employeeIds);

    // Build the where clause for employee validation
    let employeeWhereClause: any = {
      id: { in: employeeIds },
      role: { in: ['employee', 'manager', 'recruiter', 'unassigned'] }, // Allow all these roles
      is_active: true
    };

    // If the employer has a company_id, use it for validation
    // Otherwise, allow any active employee (single-tenant assumption)
    if (user.company_id) {
      employeeWhereClause.company_id = user.company_id;
      console.log('Using company_id filter:', user.company_id);
    } else {
      console.log('No company_id found, using single-tenant mode - allowing all active employees');
    }

    const validEmployees = await prisma.user.findMany({
      where: employeeWhereClause,
      select: { id: true, name: true, email: true, role: true, company_id: true }
    });

    console.log('Found valid employees:', validEmployees.length, 'out of', employeeIds.length);

    if (validEmployees.length === 0) {
      // Provide more specific error message
      if (user.company_id) {
        return res.status(400).json({ 
          message: 'No valid employees found. Please ensure the selected employees are from your company and are active.' 
        });
      } else {
        return res.status(400).json({ 
          message: 'No valid employees found. Please ensure the selected employees exist and are active.' 
        });
      }
    }

    if (validEmployees.length !== employeeIds.length) {
      console.log('Some employees are invalid. Valid:', validEmployees.map((e: any) => e.id), 'Requested:', employeeIds);
      return res.status(400).json({ 
        message: `Only ${validEmployees.length} out of ${employeeIds.length} selected employees are valid. Please check your selections.` 
      });
    }

    // Process skills - ensure it's an array
    let processedSkills: string[] = [];
    if (skills) {
      if (Array.isArray(skills)) {
        processedSkills = skills.filter((skill: any) => skill && skill.trim());
      } else if (typeof skills === 'string') {
        processedSkills = skills.split('\n').map((s: string) => s.trim()).filter((s: string) => s);
      }
    }

    console.log('Creating profile allocation with data:', {
      jobTitle: title,
      jobDescription: description?.substring(0, 100) + '...',
      location,
      jobType,
      remoteStatus: workMode,
      experience,
      budgetMin,
      budgetMax,
      currency,
      skills: processedSkills,
      priority,
      deadline: responseDeadline,
      notes: additionalNotes,
      createdById: session.user.id
    });

    // Create the profile allocation using Prisma transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the main profile allocation
      const profileAllocation = await tx.profileAllocation.create({
        data: {
          jobTitle: title, // Map frontend 'title' to database 'jobTitle'
          jobDescription: description, // Map frontend 'description' to database 'jobDescription'
          location: location || null,
          jobType: jobType || 'full-time',
          remoteStatus: workMode || 'on-site', // Map workMode to remoteStatus
          experience: experience || null,
          budgetMin,
          budgetMax,
          currency: currency || 'USD',
          skills: processedSkills,
          emailNotification: emailNotifications !== false, // Fixed field name
          portalNotification: portalNotifications !== false, // Fixed field name
          priority: priority || 'medium',
          deadline: responseDeadline ? new Date(responseDeadline) : null,
          notes: additionalNotes || null,
          status: 'active',
          createdById: session.user.id
        }
      });

      console.log('Created profile allocation:', profileAllocation.id);

      // Create employee allocation records
      const employeeAllocations = await Promise.all(
        validEmployees.map((employee: any) => 
          tx.profileAllocationEmployee.create({
            data: {
              profileAllocationId: profileAllocation.id,
              employeeId: employee.id,
              status: 'pending',
              notifiedAt: new Date()
            }
          })
        )
      );

      console.log('Created employee allocations:', employeeAllocations.length);

      // Create notifications for assigned employees
      if (portalNotifications !== false) {
        await Promise.all(
          validEmployees.map((employee: any) =>
            tx.notification.create({
              data: {
                userId: employee.id,
                title: `New Profile Allocation: ${title}`,
                message: `You have been assigned a new profile allocation for "${title}". Please review and respond.`,
                type: 'profile_allocation',
                relatedId: profileAllocation.id,
                isRead: false
              }
            })
          )
        );
        console.log('Created notifications for employees');
      }

      return {
        profileAllocation,
        employeeAllocations,
        assignedEmployees: validEmployees
      };
    });

    // TODO: Send email notifications if enabled
    if (emailNotifications !== false) {
      console.log(`Email notifications would be sent to ${validEmployees.length} employees`);
      // Implement email service here (SendGrid, AWS SES, etc.)
    }

    res.status(201).json({ 
      message: 'Profile allocation created successfully',
      allocation: {
        id: result.profileAllocation.id,
        jobTitle: result.profileAllocation.jobTitle,
        assignedEmployees: result.assignedEmployees.map((emp: any) => ({
          id: emp.id,
          name: emp.name,
          email: emp.email
        })),
        createdAt: result.profileAllocation.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error creating profile allocation:', error);
    
    // Provide more specific error messages
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'Duplicate entry error. Please try again.' });
    }
    if (error?.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid reference. Please check your data.' });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'Record not found. Please check your selections.' });
    }
    
    res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
} 