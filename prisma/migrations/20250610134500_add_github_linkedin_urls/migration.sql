-- AlterTable
ALTER TABLE "user_profiles"
ADD COLUMN "github_url" VARCHAR(255),
ADD COLUMN "linkedin_url" VARCHAR(255);
 
-- AlterTable
ALTER TABLE "candidates"
ADD COLUMN "github_url" VARCHAR(255),
ADD COLUMN "linkedin_url" VARCHAR(255); 