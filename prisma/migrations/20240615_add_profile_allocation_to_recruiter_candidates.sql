-- Add profile_allocation_id column to recruiter_candidates table
ALTER TABLE recruiter_candidates ADD COLUMN profile_allocation_id VARCHAR(36);

-- Add index for performance
CREATE INDEX idx_recruiter_candidates_profile_allocation_id ON recruiter_candidates(profile_allocation_id); 