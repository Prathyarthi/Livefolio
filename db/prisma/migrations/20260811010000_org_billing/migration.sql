-- Organization subscription fields
ALTER TABLE "organizations" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "organizations" ADD COLUMN "razorpaySubscriptionId" TEXT;
ALTER TABLE "organizations" ADD COLUMN "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN "subscriptionCurrentPeriodEnd" TIMESTAMP(3);

-- Link billing subscriptions to organizations (optional)
ALTER TABLE "billing_subscriptions" ADD COLUMN "organizationId" TEXT;
CREATE INDEX "billing_subscriptions_organizationId_status_idx" ON "billing_subscriptions"("organizationId", "status");
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Org-specific checkout attempts
CREATE TABLE "org_billing_checkout_attempts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerSubscriptionId" TEXT,
    "providerPlanId" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'creating',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_billing_checkout_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "org_billing_checkout_attempts_organizationId_key" ON "org_billing_checkout_attempts"("organizationId");
CREATE UNIQUE INDEX "org_billing_checkout_attempts_providerSubscriptionId_key" ON "org_billing_checkout_attempts"("providerSubscriptionId");
CREATE INDEX "org_billing_checkout_attempts_userId_idx" ON "org_billing_checkout_attempts"("userId");

ALTER TABLE "org_billing_checkout_attempts" ADD CONSTRAINT "org_billing_checkout_attempts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_billing_checkout_attempts" ADD CONSTRAINT "org_billing_checkout_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
