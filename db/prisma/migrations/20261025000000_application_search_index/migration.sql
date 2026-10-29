-- Trigram index makes ILIKE '%term%' recall fast on large applicant pools.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AlterTable
ALTER TABLE "applications"
  ADD COLUMN "searchKey" TEXT,
  ADD COLUMN "rankScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "rankReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "searchText" TEXT,
  ADD COLUMN "searchSummary" JSONB,
  ADD COLUMN "searchEvidence" JSONB,
  ADD COLUMN "matchedRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "yearsExperience" INTEGER,
  ADD COLUMN "proofKinds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "skillNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "locationLabel" TEXT;

-- CreateIndex
CREATE INDEX "applications_jobId_rankScore_idx" ON "applications"("jobId", "rankScore");
CREATE INDEX "applications_jobId_submittedAt_idx" ON "applications"("jobId", "submittedAt");
CREATE INDEX "applications_jobId_searchKey_idx" ON "applications"("jobId", "searchKey");
CREATE INDEX "applications_searchText_idx" ON "applications" USING GIN ("searchText" gin_trgm_ops);
