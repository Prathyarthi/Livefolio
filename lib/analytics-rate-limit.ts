import { NextResponse } from "next/server";

const WINDOW_MS = 60 * 60 * 1000;

const ME_USER_LIMIT = 60;
const VIEW_IP_LIMIT = 120;
const CLICK_IP_LIMIT = 240;

type Bucket = { count: number; windowStart: number };
const store = new Map<string, Bucket>();

function getClientIp(request: Request) {
  const value =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0];

  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 128) : null;
}

function checkQuota(key: string, limit: number): boolean {
  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const entry = store.get(key);

  if (!entry || entry.windowStart !== windowStart) {
    store.set(key, { count: 1, windowStart });
    return true;
  }

  entry.count += 1;
  return entry.count <= limit;
}

function tooManyResponse(message: string) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(WINDOW_MS / 1000)),
      },
    }
  );
}

export function enforceAnalyticsMeRateLimit(userId: string) {
  const allowed = checkQuota(`analytics:me:user:${userId}`, ME_USER_LIMIT);
  return allowed ? null : tooManyResponse("Too many analytics requests. Try again later.");
}

export function enforceAnalyticsViewRateLimit(request: Request) {
  const ip = getClientIp(request) ?? "unknown";
  const allowed = checkQuota(`analytics:view:ip:${ip}`, VIEW_IP_LIMIT);
  return allowed ? null : tooManyResponse("Too many view events. Try again later.");
}

export function enforceAnalyticsClickRateLimit(request: Request) {
  const ip = getClientIp(request) ?? "unknown";
  const allowed = checkQuota(`analytics:click:ip:${ip}`, CLICK_IP_LIMIT);
  return allowed ? null : tooManyResponse("Too many click events. Try again later.");
}
