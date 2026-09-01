-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "bannerUrl" TEXT;

-- CreateIndex
CREATE INDEX "stored_files_organizationId_kind_idx" ON "stored_files"("organizationId", "kind");
