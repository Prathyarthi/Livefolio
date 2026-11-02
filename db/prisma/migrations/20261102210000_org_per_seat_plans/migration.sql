-- Per-seat hiring plans. Additive and nullable: existing Org Pro rows stay legacy.
ALTER TABLE "organizations" ADD COLUMN "subscriptionPlan" TEXT;
ALTER TABLE "organizations" ADD COLUMN "subscriptionSeats" INTEGER;
ALTER TABLE "org_billing_checkout_attempts" ADD COLUMN "plan" TEXT;
ALTER TABLE "org_billing_checkout_attempts" ADD COLUMN "seats" INTEGER;
