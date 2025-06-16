-- Add profile_allocation_id, status, and feedback columns to recruiter_candidates table
ALTER TABLE recruiter_candidates ADD COLUMN IF NOT EXISTS profile_allocation_id VARCHAR(36);
ALTER TABLE recruiter_candidates ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE recruiter_candidates ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add foreign key constraints
ALTER TABLE recruiter_candidates 
  ADD CONSTRAINT fk_recruiter_candidates_profile_allocation 
  FOREIGN KEY (profile_allocation_id) 
  REFERENCES profile_allocations(id) 
  ON DELETE SET NULL;

ALTER TABLE recruiter_candidates 
  ADD CONSTRAINT fk_recruiter_candidates_recruiter 
  FOREIGN KEY (recruiter_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE recruiter_candidates 
  ADD CONSTRAINT fk_recruiter_candidates_candidate 
  FOREIGN KEY (candidate_id) 
  REFERENCES candidates(id) 
  ON DELETE CASCADE; 