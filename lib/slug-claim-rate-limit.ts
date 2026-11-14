import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const TEN_MINUTE_LIMIT = 6;
const HOUR_LIMIT = 15;

export function getClientIp(request: Request) {
  const value =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0];

  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 128) : null;
}

function bucketKey(prefix: string, identifier: string, windowStart: number) {
  const digest = createHash("sha256").update(identifier).digest("hex");
  return `${prefix}:${digest}:${windowStart}`;
}

async function consume(
  keyPrefix: string,
  identifier: string,
  windowMs: number,
  limit: number,
) {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const expiresAt = new Date(windowStart + windowMs);
  const key = bucketKey(keyPrefix, identifier, windowStart);

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 }, expiresAt },
    select: { count: true },
  });

  if (bucket.count <= limit) return null;
  return Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000));
}

/** Public name checks. Fail closed so a limiter outage does not open the endpoint. */
export async function enforceSlugClaimRateLimit(request: Request) {
  const ip = getClientIp(request) ?? "unknown";

  try {
    const retryAfter =
      (await consume("slug-claim:10m", ip, TEN_MINUTES_MS, TEN_MINUTE_LIMIT)) ??
      (await consume("slug-claim:1h", ip, HOUR_MS, HOUR_LIMIT));

    return retryAfter;
  } catch (error) {
    console.error("[slug-claim.rate-limit] failed", error);
    return 60;
  }
}