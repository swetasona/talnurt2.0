import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getConnection, releaseConnection } from '@/lib/db-connection-manager';
import { authOptions } from '../auth/[...nextauth]';

interface ResultDetail {
  id: string;
  candidateId: string;
  candidateName: string | undefined;
  status: string;
  error?: string;
}

interface ResultsData {
  total: number;
  fixed: number;
  alreadyOk: number;
  errors: number;
  details: ResultDetail[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let prisma;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'This endpoint is only available in development mode' });
    }

    // Get a database connection
    prisma = await getConnection();

    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.id) {
      releaseConnection();
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check if user is authorized (only allow employers or admins)
    if (!['employer', 'admin'].includes(session.user.role)) {
      releaseConnection();
      return res.status(403).json({ error: 'Access denied. You do not have permission to access this resource.' });
    }

    // Get all recruiter_candidates records
    const recruiterCandidates = await prisma.recruiter_candidates.findMany({
      include: {
        candidate: true
      }
    });

    console.log(`Found ${recruiterCandidates.length} recruiter_candidates records`);

    // Keep track of fixed records
    const results: ResultsData = {
      total: recruiterCandidates.length,
      fixed: 0,
      alreadyOk: 0,
      errors: 0,
      details: []
    };

    // Process each record
    for (const rc of recruiterCandidates) {
      try {
        // Parse existing feedback data (if any)
        let existingFeedback = {};
        if (rc.feedback) {
          try {
            existingFeedback = JSON.parse(rc.feedback);
          } catch (e) {
            console.error(`Error parsing feedback for candidate ${rc.candidate_id}:`, e);
            existingFeedback = {};
          }
        }

        // Check if feedback needs fixing (empty or missing fields)
        const needsFix = !rc.feedback || 
          rc.feedback === '{}' || 
          Object.keys(existingFeedback).length === 0;

        if (needsFix) {
          // Create a clean feedback object with default values
          const cleanFeedback = {
            companyName: rc.candidate?.name || '',
            dateOfBirth: '',
            clientName: '',
            positionApplied: '',
            totalExperience: '',
            relevantExperience: '',
            currentOrganization: '',
            currentDesignation: '',
            duration: '',
            reasonOfLeaving: '',
            reportingTo: '',
            numberOfDirectReportees: '',
            currentSalary: '',
            expectedSalary: '',
            education: '',
            maritalStatus: '',
            passportAvailable: '',
            currentLocation: '',
            medicalIssues: '',
            ...existingFeedback // Keep any existing values
          };

          // Update the record
          await prisma.recruiter_candidates.update({
            where: { id: rc.id },
            data: { feedback: JSON.stringify(cleanFeedback) }
          });

          console.log(`Fixed feedback for candidate ${rc.candidate_id}`);
          results.fixed++;
          results.details.push({
            id: rc.id,
            candidateId: rc.candidate_id,
            candidateName: rc.candidate?.name,
            status: 'fixed'
          });
        } else {
          console.log(`Feedback already OK for candidate ${rc.candidate_id}`);
          results.alreadyOk++;
          results.details.push({
            id: rc.id,
            candidateId: rc.candidate_id,
            candidateName: rc.candidate?.name,
            status: 'already_ok'
          });
        }
      } catch (error) {
        console.error(`Error processing candidate ${rc.candidate_id}:`, error);
        results.errors++;
        results.details.push({
          id: rc.id,
          candidateId: rc.candidate_id,
          candidateName: rc.candidate?.name,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    releaseConnection();
    return res.status(200).json({ 
      success: true, 
      results
    });
  } catch (error) {
    console.error('Error fixing feedback data:', error);
    
    // Always release connection, even on error
    if (prisma) {
      releaseConnection();
    }
    
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 