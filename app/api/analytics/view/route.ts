import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceAnalyticsViewRateLimit } from "@/lib/analytics-rate-limit";

export async function POST(request: Request) {
  const rateLimitResponse = await enforceAnalyticsViewRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  let slug: string | undefined;

  try {
    const body = (await request.json()) as { slug?: string };
    slug = body.slug?.trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: { slug, isPublished: true },
    select: { id: true },
  });

  if (!portfolio) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.portfolioView.create({
    data: { portfolioId: portfolio.id },
  });

  return NextResponse.json({ ok: true });
}
