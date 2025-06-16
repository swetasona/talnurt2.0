const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteCandidate(id) {
  try {
    console.log(`Starting deletion process for candidate ID: ${id}`);
    
    // First check if the candidate exists in recruiter_candidates
    const recruiterCandidates = await prisma.recruiter_candidates.findMany({
      where: { candidate_id: id }
    });
    
    console.log(`Found ${recruiterCandidates.length} recruiter_candidate entries for this candidate`);
    
    // Delete all recruiter_candidates entries for this candidate
    if (recruiterCandidates.length > 0) {
      await prisma.recruiter_candidates.deleteMany({
        where: { candidate_id: id }
      });
      console.log(`Deleted ${recruiterCandidates.length} recruiter_candidate entries`);
    }
    
    // Delete the candidate's education records
    const deletedEducation = await prisma.education.deleteMany({
      where: { candidate_id: id }
    });
    console.log(`Deleted ${deletedEducation.count} education records`);
    
    // Delete the candidate's experience records
    const deletedExperience = await prisma.experience.deleteMany({
      where: { candidate_id: id }
    });
    console.log(`Deleted ${deletedExperience.count} experience records`);
    
    // Delete the candidate
    const deletedCandidate = await prisma.candidates.delete({
      where: { id }
    });
    
    console.log(`Successfully deleted candidate: ${deletedCandidate.name}`);
    return deletedCandidate;
  } catch (error) {
    console.error(`Error deleting candidate ${id}:`, error);
    return null;
  }
}

// Try to find candidates by name or email
async function findAndDeleteCandidate(nameOrEmail) {
  // Try to find by name first
  let candidate = await prisma.candidates.findFirst({
    where: { name: nameOrEmail }
  });
  
  // If not found by name, try email
  if (!candidate && nameOrEmail.includes('@')) {
    candidate = await prisma.candidates.findFirst({
      where: { email: nameOrEmail }
    });
  }
  
  // Try possible variations of the name
  if (!candidate && nameOrEmail === "DlhfAnFlag") {
    // Try possible variations
    const variations = ["DlhfAnFJag", "DlbfAnFlag", "DIhfAnFlag"];
    
    for (const variation of variations) {
      candidate = await prisma.candidates.findFirst({
        where: { name: variation }
      });
      
      if (candidate) {
        console.log(`Found candidate with name variation: ${variation}`);
        break;
      }
    }
  }
  
  if (candidate) {
    console.log(`Found candidate: ${candidate.name} (${candidate.email}), ID: ${candidate.id}`);
    await deleteCandidate(candidate.id);
  } else {
    console.log(`No candidate found matching: ${nameOrEmail}`);
    
    // As a last resort, list all candidates to help identify the correct one
    console.log("Listing all candidates:");
    const allCandidates = await prisma.candidates.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    allCandidates.forEach(c => {
      console.log(`- ${c.name} (${c.email}), ID: ${c.id}`);
    });
  }
}

async function main() {
  try {
    // Try to delete the candidates from the screenshot
    await findAndDeleteCandidate("DlhfAnFlag");
    await findAndDeleteCandidate("swetasona@gmail.com");
    
    // Second candidate (already deleted in previous run)
    // await findAndDeleteCandidate("test");
  } catch (error) {
    console.error('Error in deletion process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 