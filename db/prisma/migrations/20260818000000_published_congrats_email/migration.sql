-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "publishedCongratsSentAt" TIMESTAMP(3);
