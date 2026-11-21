import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const BLOG_API_KEY_ENV = "BLOG_API_KEY";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Constant-time comparison. Hashing first keeps the length check out of the timing. */
export function apiKeysMatch(provided: string, expected: string): boolean {
  return timingSafeEqual(digest(provided), digest(expected));
}

/**
 * Checks `Authorization: Bearer <BLOG_API_KEY>`. Returns a response to send
 * back when the request is not allowed, or null when it may continue.
 * Fails closed: with no key configured every request is rejected.
 */
export function requireBlogApiKey(request: Request): NextResponse | null {
  const expected = process.env[BLOG_API_KEY_ENV]?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: `${BLOG_API_KEY_ENV} is not configured.` },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || !apiKeysMatch(match[1].trim(), expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
