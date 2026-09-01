-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "customJobFields" JSONB DEFAULT '[]';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "customFields" JSONB DEFAULT '[]';