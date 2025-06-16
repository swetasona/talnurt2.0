/*
  Warnings:

  - You are about to drop the column `about` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `speciality` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `companies` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to alter the column `industry` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to alter the column `location` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to alter the column `name` on the `industries` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to drop the column `user_id` on the `saved_candidates` table. All the data in the column will be lost.
  - The `tags` column on the `saved_candidates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `name` on the `skills` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to drop the `recruiter_profiles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `industries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[recruiter_id,candidate_id]` on the table `saved_candidates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `skills` will be added. If there are existing duplicate values, this will fail.
  - Made the column `candidate_id` on table `saved_candidates` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "recruiter_profiles" DROP CONSTRAINT "recruiter_profiles_user_id_fkey";

-- DropIndex
DROP INDEX "companies_industry_idx";

-- DropIndex
DROP INDEX "companies_name_idx";

-- DropIndex
DROP INDEX "industries_name_idx";

-- DropIndex
DROP INDEX "job_postings_posted_by_idx";

-- DropIndex
DROP INDEX "saved_candidates_job_id_idx";

-- DropIndex
DROP INDEX "saved_candidates_recruiter_id_user_id_candidate_id_key";

-- DropIndex
DROP INDEX "saved_candidates_user_id_idx";

-- DropIndex
DROP INDEX "skills_name_idx";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "about",
DROP COLUMN "linkedin",
DROP COLUMN "logo",
DROP COLUMN "speciality",
DROP COLUMN "website",
ADD COLUMN     "description" TEXT,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "industry" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "location" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "industries" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "saved_candidates" DROP COLUMN "user_id",
ALTER COLUMN "candidate_id" SET NOT NULL,
DROP COLUMN "tags",
ADD COLUMN     "tags" JSONB;

-- AlterTable
ALTER TABLE "skills" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- DropTable
DROP TABLE "recruiter_profiles";

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "industries_name_key" ON "industries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "saved_candidates_recruiter_id_candidate_id_key" ON "saved_candidates"("recruiter_id", "candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");
