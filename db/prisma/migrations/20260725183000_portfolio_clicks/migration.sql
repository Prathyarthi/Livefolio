-- CreateTable
CREATE TABLE "portfolio_clicks" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "targetId" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portfolio_clicks_portfolioId_clickedAt_idx" ON "portfolio_clicks"("portfolioId", "clickedAt");

-- CreateIndex
CREATE INDEX "portfolio_clicks_portfolioId_type_clickedAt_idx" ON "portfolio_clicks"("portfolioId", "type", "clickedAt");

-- AddForeignKey
ALTER TABLE "portfolio_clicks" ADD CONSTRAINT "portfolio_clicks_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
