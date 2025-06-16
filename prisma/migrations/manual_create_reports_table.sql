-- Create reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS "reports" (
  "id" VARCHAR(36) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'Unread',
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "authorId" VARCHAR(36) NOT NULL,
  "recipientId" VARCHAR(36) NOT NULL,
  
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reports_author_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "reports_recipient_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "reports_authorId_idx" ON "reports"("authorId");
CREATE INDEX IF NOT EXISTS "reports_recipientId_idx" ON "reports"("recipientId"); 