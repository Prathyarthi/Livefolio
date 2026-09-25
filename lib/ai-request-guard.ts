import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const AI_REQUEST_BODY_LIMIT_BYTES = 256 * 1024;
export const AI_USER_CONTEXT_LIMIT_CHARS = 4_000;
export const AI_USER_REQUESTS_PER_HOUR = 10;
export const AI_IP_REQUESTS_PER_HOUR = 30;

const AI_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

type GuardResult =
  | {
      ok: true;
      request: Request;
      userId: string;
    }
  | {
      ok: false;
      response: Response;
    };

function getClientIp(request: Request) {
  const value =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0];

  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 128) : null;
}

function bucketKey(scope: "user" | "ip", identifier: string, windowStart: number) {
  const digest = createHash("sha256").update(identifier).digest("hex");
  return `ai:${scope}:${digest}:${windowStart}`;
}

async function upsertBucket(key: string, expiresAt: Date) {
  return prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 }, expiresAt },
    select: { count: true },
  });
}

async function consumeAiQuota(
  userId: string,
  ip: string | null,
  now = new Date(),
) {
  const windowStart = Math.floor(now.getTime() / AI_RATE_LIMIT_WINDOW_MS)
    * AI_RATE_LIMIT_WINDOW_MS;
  const expiresAt = new Date(windowStart + AI_RATE_LIMIT_WINDOW_MS);

  const userBucket = await upsertBucket(
    bucketKey("user", userId, windowStart),
    expiresAt,
  );
  const ipBucket = ip
    ? await upsertBucket(bucketKey("ip", ip, windowStart), expiresAt)
    : null;

  return {
    allowed:
      userBucket.count <= AI_USER_REQUESTS_PER_HOUR
      && (ipBucket?.count ?? 0) <= AI_IP_REQUESTS_PER_HOUR,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((expiresAt.getTime() - now.getTime()) / 1000),
    ),
  };
}

export async function enforceAiRateLimit(
  request: Request,
  userId: string,
): Promise<Response | null> {
  try {
    const quota = await consumeAiQuota(userId, getClientIp(request));
    if (quota.allowed) return null;

    return NextResponse.json(
      { error: "Too many AI requests. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(quota.retryAfterSeconds),
        },
      },
    );
  } catch (error) {
    console.error("[AI request guard] Rate limiter failed", error);
    return NextResponse.json(
      { error: "AI service is temporarily unavailable" },
      { status: 503 },
    );
  }
}

async function copyRequestWithBodyLimit(request: Request, limitBytes: number) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > limitBytes) {
    return null;
  }

  if (!request.body) {
    return new Request(request.url, {
      method: request.method,
      headers: request.headers,
      signal: request.signal,
    });
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > limitBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const headers = new Headers(request.headers);
  headers.delete("content-length");

  return new Request(request.url, {
    method: request.method,
    headers,
    body,
    signal: request.signal,
  });
}

export async function guardAiRequest(
  request: Request,
  bodyLimitBytes = AI_REQUEST_BODY_LIMIT_BYTES,
): Promise<GuardResult> {
  const session = await getSession(request);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > bodyLimitBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request body is too large" },
        { status: 413 },
      ),
    };
  }

  const rateLimitResponse = await enforceAiRateLimit(request, session.userId);
  if (rateLimitResponse) {
    return {
      ok: false,
      response: rateLimitResponse,
    };
  }

  const boundedRequest = await copyRequestWithBodyLimit(request, bodyLimitBytes);
  if (!boundedRequest) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request body is too large" },
        { status: 413 },
      ),
    };
  }

  return {
    ok: true,
    request: boundedRequest,
    userId: session.userId,
  };
}
