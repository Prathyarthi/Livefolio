import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 60 * 60 * 1000;

/** Dashboard stats fetches (including forced refresh). */
const ME_USER_LIMIT = 60;
/** Public portfolio view beacons. */
const VIEW_IP_LIMIT = 120;
/** Public link-click beacons. */
const CLICK_IP_LIMIT = 240;

function getClientIp(request: Request) {
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

async function consumeQuota(
  keyPrefix: string,
  identifier: string,
  limit: number,
  errorMessage: string
) {
  const now = new Date();
  const windowStart = Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS;
  const expiresAt = new Date(windowStart + WINDOW_MS);
  const key = bucketKey(keyPrefix, identifier, windowStart);

  try {
    const bucket = await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: { increment: 1 }, expiresAt },
      select: { count: true },
    });

    if (bucket.count <= limit) return null;

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(
              1,
              Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)
            )
          ),
        },
      }
    );
  } catch (error) {
    console.error(`[analytics.rate-limit] ${keyPrefix} failed`, error);
    return NextResponse.json(
      { error: "Analytics is temporarily unavailable." },
      { status: 503 }
    );
  }
}

export async function enforceAnalyticsMeRateLimit(userId: string) {
  return consumeQuota(
    "analytics:me:user",
    userId,
    ME_USER_LIMIT,
    "Too many analytics requests. Try again later."
  );
}

export async function enforceAnalyticsViewRateLimit(request: Request) {
  const ip = getClientIp(request) ?? "unknown";
  return consumeQuota(
    "analytics:view:ip",
    ip,
    VIEW_IP_LIMIT,
    "Too many view events. Try again later."
  );
}

export async function enforceAnalyticsClickRateLimit(request: Request) {
  const ip = getClientIp(request) ?? "unknown";
  return consumeQuota(
    "analytics:click:ip",
    ip,
    CLICK_IP_LIMIT,
    "Too many click events. Try again later."
  );
}
