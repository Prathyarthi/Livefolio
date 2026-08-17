import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { getAutomatedEmailDemos } from "@/lib/email-templates";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(200),
  bodyHtml: z.string().trim().min(1).max(200_000),
});

const DEFAULT_TEMPLATE_NAMES = [
  "Welcome (on signup)",
  "No portfolio reminder",
  "Unpublished reminder",
  "Portfolio published",
] as const;

async function ensureDefaultTemplates() {
  const existing = await prisma.emailTemplate.findMany({
    where: { name: { in: [...DEFAULT_TEMPLATE_NAMES] } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((row) => row.name));
  const missing = getAutomatedEmailDemos("{{name}}", { preview: false }).filter(
    (demo) => !existingNames.has(demo.label),
  );
  if (missing.length === 0) return;

  await prisma.emailTemplate.createMany({
    data: missing.map((demo) => ({
      name: demo.label,
      subject: demo.subject,
      bodyHtml: demo.html,
    })),
  });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  await ensureDefaultTemplates();

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    templates,
    defaults: DEFAULT_TEMPLATE_NAMES,
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const template = await prisma.emailTemplate.create({
    data: parsed.data,
  });

  return NextResponse.json({ template }, { status: 201 });
}
