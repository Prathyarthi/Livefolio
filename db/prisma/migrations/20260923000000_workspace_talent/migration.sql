-- CreateTable
CREATE TABLE "workspace_talents" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_talents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_talents_workspaceId_portfolioId_key" ON "workspace_talents"("workspaceId", "portfolioId");

-- CreateIndex
CREATE INDEX "workspace_talents_portfolioId_idx" ON "workspace_talents"("portfolioId");

-- CreateIndex
CREATE INDEX "workspace_talents_addedById_idx" ON "workspace_talents"("addedById");

-- AddForeignKey
ALTER TABLE "workspace_talents"
ADD CONSTRAINT "workspace_talents_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_talents"
ADD CONSTRAINT "workspace_talents_portfolioId_fkey"
FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_talents"
ADD CONSTRAINT "workspace_talents_addedById_fkey"
FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
