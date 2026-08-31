-- Resolve partial state from prior recruiter MVP leftovers + failed apply.
-- Extend existing organizations / organization_members, then create hiring tables.

-- Organizations: add branding fields
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "brandColor" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "location" TEXT;

-- organization_members: align with new schema (orgId -> organizationId)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'orgId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_members' AND column_name = 'organizationId'
  ) THEN
    ALTER TABLE "organization_members" RENAME COLUMN "orgId" TO "organizationId";
  END IF;
END $$;

ALTER TABLE "organization_members" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "organization_members" SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);
ALTER TABLE "organization_members" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "organization_members" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "organization_members" ALTER COLUMN "role" SET DEFAULT 'recruiter';

-- Unique membership constraint (drop old if present, recreate)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_members_orgId_userId_key'
  ) THEN
    ALTER TABLE "organization_members" DROP CONSTRAINT "organization_members_orgId_userId_key";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_members_organizationId_userId_key'
  ) THEN
    ALTER TABLE "organization_members"
      ADD CONSTRAINT "organization_members_organizationId_userId_key"
      UNIQUE ("organizationId", "userId");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "organization_members_userId_idx" ON "organization_members"("userId");
CREATE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations"("slug");

-- Jobs
CREATE TABLE IF NOT EXISTS "jobs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT,
    "employmentType" TEXT,
    "location" TEXT,
    "workplaceType" TEXT,
    "experienceMin" INTEGER,
    "experienceMax" INTEGER,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT DEFAULT 'USD',
    "responsibilities" TEXT,
    "qualifications" TEXT,
    "benefits" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "jobs_slug_key" ON "jobs"("slug");
CREATE INDEX IF NOT EXISTS "jobs_organizationId_status_idx" ON "jobs"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "jobs_slug_idx" ON "jobs"("slug");
CREATE INDEX IF NOT EXISTS "jobs_status_publishedAt_idx" ON "jobs"("status", "publishedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_organizationId_fkey'
  ) THEN
    ALTER TABLE "jobs"
      ADD CONSTRAINT "jobs_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_createdById_fkey'
  ) THEN
    ALTER TABLE "jobs"
      ADD CONSTRAINT "jobs_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Job requirements
CREATE TABLE IF NOT EXISTS "job_requirements" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'skill',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "job_requirements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "job_requirements_jobId_idx" ON "job_requirements"("jobId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'job_requirements_jobId_fkey'
  ) THEN
    ALTER TABLE "job_requirements"
      ADD CONSTRAINT "job_requirements_jobId_fkey"
      FOREIGN KEY ("jobId") REFERENCES "jobs"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Applications
CREATE TABLE IF NOT EXISTS "applications" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "portfolioId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "stage" TEXT NOT NULL DEFAULT 'new',
    "coverNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "applications_userId_submittedAt_idx" ON "applications"("userId", "submittedAt");
CREATE INDEX IF NOT EXISTS "applications_jobId_stage_idx" ON "applications"("jobId", "stage");
CREATE INDEX IF NOT EXISTS "applications_jobId_status_idx" ON "applications"("jobId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "applications_jobId_userId_key" ON "applications"("jobId", "userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_jobId_fkey'
  ) THEN
    ALTER TABLE "applications"
      ADD CONSTRAINT "applications_jobId_fkey"
      FOREIGN KEY ("jobId") REFERENCES "jobs"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_userId_fkey'
  ) THEN
    ALTER TABLE "applications"
      ADD CONSTRAINT "applications_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Application snapshots
CREATE TABLE IF NOT EXISTS "application_snapshots" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "application_snapshots_applicationId_key" ON "application_snapshots"("applicationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'application_snapshots_applicationId_fkey'
  ) THEN
    ALTER TABLE "application_snapshots"
      ADD CONSTRAINT "application_snapshots_applicationId_fkey"
      FOREIGN KEY ("applicationId") REFERENCES "applications"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
