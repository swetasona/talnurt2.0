-- AlterTable
ALTER TABLE "job_postings" ADD COLUMN     "posted_by_role" VARCHAR(50) NOT NULL DEFAULT 'admin';
