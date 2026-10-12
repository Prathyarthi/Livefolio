-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "screeningQuestions" JSONB DEFAULT '[]';

-- AlterTable
ALTER TABLE "applications" ADD COLUMN "screeningAnswers" JSONB;
