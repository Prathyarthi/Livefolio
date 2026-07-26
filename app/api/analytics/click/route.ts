import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isClickType,
  MAX_CLICK_LABEL_CHARS,
  MAX_CLICK_URL_CHARS,
  type ClickType,
} from "@/features/analytics/lib/click-types";
import { enforceAnalyticsClickRateLimit } from "@/lib/analytics-rate-limit";

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}

function normalizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return truncate(url.toString(), MAX_CLICK_URL_CHARS);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const rateLimitResponse = await enforceAnalyticsClickRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  let body: {
    slug?: string;
    type?: string;
    label?: string;
    url?: string;
    targetId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const slug = body.slug?.trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const type: ClickType = isClickType(body.type) ? body.type : "outbound";
  const url = typeof body.url === "string" ? normalizeUrl(body.url) : null;
  if (!url) {
    return NextResponse.json({ error: "Valid url is required" }, { status: 400 });
  }

  const label =
    typeof body.label === "string"
      ? truncate(body.label, MAX_CLICK_LABEL_CHARS)
      : "";
  const targetId =
    typeof body.targetId === "string" && body.targetId.trim()
      ? truncate(body.targetId.trim(), 64)
      : null;

  const portfolio = await prisma.portfolio.findFirst({
    where: { slug, isPublished: true },
    select: { id: true },
  });

  if (!portfolio) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.portfolioClick.create({
    data: {
      portfolioId: portfolio.id,
      type,
      label,
      url,
      targetId,
    },
  });

  return NextResponse.json({ ok: true });
}
