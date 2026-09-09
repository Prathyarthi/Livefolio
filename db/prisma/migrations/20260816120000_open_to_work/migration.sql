-- AlterTable
ALTER TABLE "portfolios" ADD COLUMN "openToWork" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "portfolios_openToWork_isPublished_idx" ON "portfolios"("openToWork", "isPublished");
