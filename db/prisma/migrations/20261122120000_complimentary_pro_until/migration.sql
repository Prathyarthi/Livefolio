-- AlterTable
ALTER TABLE "users" ADD COLUMN "complimentaryProUntil" TIMESTAMP(3);

-- Backfill: grant 3 months of complimentary Pro to every user that exists
-- at migration time. New signups after this migration are not included.
UPDATE "users"
SET "complimentaryProUntil" = NOW() + INTERVAL '3 months'
WHERE "complimentaryProUntil" IS NULL;
