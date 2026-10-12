import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  adminEmailAudienceWhere,
  audienceForTemplateName,
} from "@/lib/admin-email-audience";

const MAX_LIST = 200;

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const template = searchParams.get("template")?.trim() ?? "";
  const take = Math.min(
    MAX_LIST,
    Math.max(1, Number(searchParams.get("limit") ?? "30") || 30),
  );

  const filters = [];
  if (q) {
    filters.push({
      OR: [
        { email: { contains: q, mode: "insensitive" as const } },
        { name: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }
  const audience = adminEmailAudienceWhere(audienceForTemplateName(template));
  if (audience) filters.push(audience);

  const where = filters.length > 0 ? { AND: filters } : undefined;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        portfolio: { select: { id: true, isPublished: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total });
}
