-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "source" VARCHAR(50) NOT NULL DEFAULT 'admin',
ADD COLUMN     "user_id" VARCHAR(36);

-- CreateIndex
CREATE INDEX "candidates_email_idx" ON "candidates"("email");

-- CreateIndex
CREATE INDEX "candidates_user_id_idx" ON "candidates"("user_id");
