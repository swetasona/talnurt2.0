-- Add new fields to users table
ALTER TABLE "users" ADD COLUMN "company_id" VARCHAR(36);
ALTER TABLE "users" ADD COLUMN "manager_id" VARCHAR(36);
ALTER TABLE "users" ADD COLUMN "team_id" VARCHAR(36);

-- Create teams table
CREATE TABLE "teams" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "company_id" VARCHAR(36),
    "manager_id" VARCHAR(36),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- Create employer_applications table
CREATE TABLE "employer_applications" (
    "id" VARCHAR(36) NOT NULL,
    "recruiter_id" VARCHAR(36),
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_applications_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "teams_company_id_idx" ON "teams"("company_id");
CREATE INDEX "teams_manager_id_idx" ON "teams"("manager_id");
CREATE INDEX "employer_applications_recruiter_id_idx" ON "employer_applications"("recruiter_id");

-- Add foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "teams" ADD CONSTRAINT "teams_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employer_applications" ADD CONSTRAINT "employer_applications_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; 