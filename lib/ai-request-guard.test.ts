import { beforeEach, describe, expect, mock, test } from "bun:test";

const buckets = new Map<string, { count: number; expiresAt: Date }>();

const rateLimitBucket = {
  deleteMany: mock(async ({ where }: { where: { expiresAt: { lte: Date } } }) => {
    let count = 0;
    for (const [key, bucket] of buckets) {
      if (bucket.expiresAt <= where.expiresAt.lte) {
        buckets.delete(key);
        count += 1;
      }
    }
    return { count };
  }),
  upsert: mock(async (args: {
    where: { key: string };
    create: { key: string; count: number; expiresAt: Date };
    update: { expiresAt: Date };
  }) => {
    const existing = buckets.get(args.where.key);
    const next = existing
      ? { count: existing.count + 1, expiresAt: args.update.expiresAt }
      : { count: args.create.count, expiresAt: args.create.expiresAt };
    buckets.set(args.where.key, next);
    return { count: next.count };
  }),
};

const transaction = mock(async (
  callback: (tx: { rateLimitBucket: typeof rateLimitBucket }) => Promise<unknown>,
) => callback({ rateLimitBucket }));

mock.module("@/lib/prisma", () => ({
  prisma: { $transaction: transaction },
}));

mock.module("@/lib/session", () => ({
  getSession: async (request: Request) => {
    const userId = request.headers.get("x-test-user-id");
    return userId ? { userId } : null;
  },
}));

const {
  AI_IP_REQUESTS_PER_HOUR,
  AI_REQUEST_BODY_LIMIT_BYTES,
  AI_USER_REQUESTS_PER_HOUR,
  guardAiRequest,
} = await import("./ai-request-guard");

function aiRequest({
  userId = "user-a",
  ip = "203.0.113.10",
  body = "{}",
  contentLength,
}: {
  userId?: string | null;
  ip?: string | null;
  body?: string;
  contentLength?: number;
} = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (userId) headers.set("x-test-user-id", userId);
  if (ip) headers.set("x-vercel-forwarded-for", ip);
  if (contentLength !== undefined) {
    headers.set("content-length", String(contentLength));
  }

  return new Request("http://localhost/api/generate-portfolio", {
    method: "POST",
    headers,
    body,
  });
}

beforeEach(() => {
  buckets.clear();
  transaction.mockClear();
  rateLimitBucket.deleteMany.mockClear();
  rateLimitBucket.upsert.mockClear();
});

describe("AI request guard", () => {
  test("rejects unauthenticated requests before rate-limit writes", async () => {
    const result = await guardAiRequest(aiRequest({ userId: null }));

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected request rejection");
    expect(result.response.status).toBe(401);
    expect(transaction).not.toHaveBeenCalled();
  });

  test("rejects a declared oversized body before rate-limit writes", async () => {
    const result = await guardAiRequest(
      aiRequest({ contentLength: AI_REQUEST_BODY_LIMIT_BYTES + 1 }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected request rejection");
    expect(result.response.status).toBe(413);
    expect(transaction).not.toHaveBeenCalled();
  });

  test("rejects an oversized streamed body without content-length", async () => {
    const result = await guardAiRequest(
      aiRequest({ body: "x".repeat(AI_REQUEST_BODY_LIMIT_BYTES + 1) }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected request rejection");
    expect(result.response.status).toBe(413);
  });

  test("preserves an accepted request body", async () => {
    const body = JSON.stringify({ prompt: "Build my portfolio" });
    const result = await guardAiRequest(aiRequest({ body }));

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected request acceptance");
    expect(await result.request.text()).toBe(body);
    expect(result.userId).toBe("user-a");
  });

  test("enforces the shared hourly user quota", async () => {
    for (let index = 0; index < AI_USER_REQUESTS_PER_HOUR; index += 1) {
      const result = await guardAiRequest(aiRequest());
      expect(result.ok).toBe(true);
    }

    const denied = await guardAiRequest(aiRequest());
    expect(denied.ok).toBe(false);
    if (denied.ok) throw new Error("Expected request rejection");
    expect(denied.response.status).toBe(429);
    expect(Number(denied.response.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  test("enforces the shared hourly IP quota across users", async () => {
    for (let index = 0; index < AI_IP_REQUESTS_PER_HOUR; index += 1) {
      const result = await guardAiRequest(
        aiRequest({ userId: `user-${index}` }),
      );
      expect(result.ok).toBe(true);
    }

    const denied = await guardAiRequest(
      aiRequest({ userId: "one-more-user" }),
    );
    expect(denied.ok).toBe(false);
    if (denied.ok) throw new Error("Expected request rejection");
    expect(denied.response.status).toBe(429);
  });
});
