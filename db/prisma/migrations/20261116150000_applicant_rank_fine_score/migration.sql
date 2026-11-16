-- Applicant ranking: unrounded score plus the two subscores used to break ties, and the
-- profile update time that feeds the recency signal. The pool sorts on these in SQL.
-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "profileUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "rankOverlap" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rankProof" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rankScoreFine" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Rows scored before this change keep their order: the fine score starts as the stored
-- integer score until the ranking version bump re-indexes them.
UPDATE "applications" SET "rankScoreFine" = "rankScore";

-- CreateIndex
CREATE INDEX "applications_pool_order_idx" ON "applications"("jobId", "rankScoreFine" DESC, "rankProof" DESC, "rankOverlap" DESC, "submittedAt", "id");
