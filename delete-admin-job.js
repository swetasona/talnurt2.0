const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAdminJob() {
  try {
    // Find the job posted by Admin User (with role 'admin')
    const job = await prisma.job_postings.findFirst({
      where: {
        posted_by_role: 'admin'
      }
    });

    if (!job) {
      console.log('No job found with posted_by_role "admin"');
      return;
    }

    console.log(`Found job to delete: ${job.id} - ${job.title}`);

    // First delete all applications associated with this job
    console.log(`Deleting applications for job ${job.id}...`);
    
    // Delete from applications table
    const deletedApplications = await prisma.applications.deleteMany({
      where: {
        job_id: job.id
      }
    });
    console.log(`Deleted ${deletedApplications.count} applications from 'applications' table`);
    
    // Delete from job_applications table if it exists
    try {
      const deletedJobApplications = await prisma.job_applications.deleteMany({
        where: {
          job_id: job.id
        }
      });
      console.log(`Deleted ${deletedJobApplications.count} applications from 'job_applications' table`);
    } catch (err) {
      console.log(`No entries in job_applications table or table doesn't exist`);
    }

    // Now delete the job
    await prisma.job_postings.delete({
      where: {
        id: job.id
      }
    });

    console.log(`Successfully deleted job: ${job.id} - ${job.title}`);
  } catch (error) {
    console.error('Error deleting job:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
deleteAdminJob(); 