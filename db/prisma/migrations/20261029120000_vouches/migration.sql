-- CreateTable
CREATE TABLE "vouches" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "portfolioId" TEXT,
    "inviteEmail" TEXT NOT NULL,
    "inviteName" TEXT,
    "personalNote" TEXT,
    "refereeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "relationship" TEXT,
    "story" TEXT,
    "wouldWorkAgain" TEXT,
    "lastEmailedAt" TIMESTAMP(3),
    "emailCount" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vouches_token_key" ON "vouches"("token");

-- CreateIndex
CREATE INDEX "vouches_requesterId_status_idx" ON "vouches"("requesterId", "status");

-- CreateIndex
CREATE INDEX "vouches_refereeId_status_idx" ON "vouches"("refereeId", "status");

-- CreateIndex
CREATE INDEX "vouches_inviteEmail_status_idx" ON "vouches"("inviteEmail", "status");

-- CreateIndex
CREATE INDEX "vouches_portfolioId_status_idx" ON "vouches"("portfolioId", "status");

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
