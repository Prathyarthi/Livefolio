-- AlterTable
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "shortlisted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "shortlistedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "applications_jobId_shortlisted_idx" ON "applications"("jobId", "shortlisted");

-- CreateTable
CREATE TABLE IF NOT EXISTS "recruiter_notes" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recruiter_notes_applicationId_createdAt_idx" ON "recruiter_notes"("applicationId", "createdAt");
CREATE INDEX IF NOT EXISTS "recruiter_notes_authorId_idx" ON "recruiter_notes"("authorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recruiter_notes_applicationId_fkey'
  ) THEN
    ALTER TABLE "recruiter_notes"
      ADD CONSTRAINT "recruiter_notes_applicationId_fkey"
      FOREIGN KEY ("applicationId") REFERENCES "applications"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recruiter_notes_authorId_fkey'
  ) THEN
    ALTER TABLE "recruiter_notes"
      ADD CONSTRAINT "recruiter_notes_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
