-- CreateTable
CREATE TABLE "linkedin_imports" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "profileData" JSONB NOT NULL DEFAULT '{}',
    "posts" JSONB NOT NULL DEFAULT '[]',
    "selection" JSONB NOT NULL DEFAULT '{}',
    "showOnPortfolio" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_imports_portfolioId_key" ON "linkedin_imports"("portfolioId");

-- AddForeignKey
ALTER TABLE "linkedin_imports" ADD CONSTRAINT "linkedin_imports_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
