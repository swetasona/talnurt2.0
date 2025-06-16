-- AlterTable
ALTER TABLE "candidates" ALTER COLUMN "source" SET DEFAULT 'manual';

-- CreateTable
CREATE TABLE "recruiter_profiles" (
    "id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "company_name" VARCHAR(255),
    "position" VARCHAR(100),
    "industry" VARCHAR(100),
    "website" VARCHAR(255),
    "bio" TEXT,
    "phone_number" VARCHAR(50),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_candidates" (
    "id" VARCHAR(36) NOT NULL,
    "recruiter_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36),
    "candidate_id" VARCHAR(36),
    "job_id" VARCHAR(36),
    "notes" TEXT,
    "tags" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "logo" TEXT,
    "industry" VARCHAR(255),
    "website" VARCHAR(255),
    "linkedin" VARCHAR(255),
    "speciality" VARCHAR(255),
    "location" VARCHAR(255),
    "about" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_profiles_user_id_key" ON "recruiter_profiles"("user_id");

-- CreateIndex
CREATE INDEX "saved_candidates_recruiter_id_idx" ON "saved_candidates"("recruiter_id");

-- CreateIndex
CREATE INDEX "saved_candidates_user_id_idx" ON "saved_candidates"("user_id");

-- CreateIndex
CREATE INDEX "saved_candidates_candidate_id_idx" ON "saved_candidates"("candidate_id");

-- CreateIndex
CREATE INDEX "saved_candidates_job_id_idx" ON "saved_candidates"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_candidates_recruiter_id_user_id_candidate_id_key" ON "saved_candidates"("recruiter_id", "user_id", "candidate_id");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE INDEX "industries_name_idx" ON "industries"("name");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_industry_idx" ON "companies"("industry");

-- CreateIndex
CREATE INDEX "job_postings_posted_by_idx" ON "job_postings"("posted_by");

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_candidates" ADD CONSTRAINT "saved_candidates_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
