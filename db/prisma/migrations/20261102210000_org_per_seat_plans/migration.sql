-- Per-seat hiring plans (Free / Pro / Business). Plan and seat count are set at checkout.
ALTER TABLE "organizations" ADD COLUMN "subscriptionPlan" TEXT;
ALTER TABLE "organizations" ADD COLUMN "subscriptionSeats" INTEGER;
ALTER TABLE "org_billing_checkout_attempts" ADD COLUMN "plan" TEXT;
ALTER TABLE "org_billing_checkout_attempts" ADD COLUMN "seats" INTEGER;
