import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const ATTEMPT_LIMIT = 8;

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "600",
  Vary: "Origin",
} as const;

export function portfolioExportOrigins(): string[] {
  return (process.env.PORTFOLIO_EXPORT_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function requestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) return null;
  return origin.replace(/\/$/, "");
}

export function isAllowedExportOrigin(origin: string | null): origin is string {
  if (!origin) return false;
  return portfolioExportOrigins().includes(origin);
}

export function exportCorsHeaders(origin: string): HeadersInit {
  return {
    ...CORS_HEADERS,
    "Access-Control-Allow-Origin": origin,
  };
}

function secretsMatch(provided: string, expected: string): boolean {
  const left = createHash("sha256").update(provided, "utf8").digest();
  const right = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(left, right);
}

export function exportCredentialsConfigured(): boolean {
  const username = process.env.PORTFOLIO_EXPORT_USERNAME?.trim() ?? "";
  const password = process.env.PORTFOLIO_EXPORT_PASSWORD ?? "";
  return username.length > 0 && password.length > 0 && portfolioExportOrigins().length > 0;
}

export function credentialsMatch(username: string, password: string): boolean {
  const expectedUsername = process.env.PORTFOLIO_EXPORT_USERNAME?.trim() ?? "";
  const expectedPassword = process.env.PORTFOLIO_EXPORT_PASSWORD ?? "";
  if (!expectedUsername || !expectedPassword) return false;
  const usernameOk = secretsMatch(username, expectedUsername);
  const passwordOk = secretsMatch(password, expectedPassword);
  return usernameOk && passwordOk;
}

function clientIp(request: Request): string {
  const value =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0];
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 128) : "unknown";
}

export async function consumeExportAttempt(
  request: Request,
): Promise<{ ok: true } | { ok: false; retryAfter: number } | { ok: false; unavailable: true }> {
  const now = new Date();
  const windowStart = Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS;
  const expiresAt = new Date(windowStart + WINDOW_MS);
  const digest = createHash("sha256").update(clientIp(request)).digest("hex");
  const key = `portfolio-export:ip:${digest}:${windowStart}`;

  try {
    const bucket = await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: { increment: 1 }, expiresAt },
      select: { count: true },
    });
    if (bucket.count <= ATTEMPT_LIMIT) return { ok: true };
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
    };
  } catch (error) {
    console.error("[portfolio-export] rate limiter failed", error);
    return { ok: false, unavailable: true };
  }
}
