import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { csvFilename, portfoliosToCsv } from "@/lib/portfolio-export-csv";

export const dynamic = "force-dynamic";

const sectionInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  },
  experiences: { orderBy: { sortOrder: "asc" as const } },
  educations: { orderBy: { sortOrder: "asc" as const } },
  skills: { orderBy: { sortOrder: "asc" as const } },
  projects: { orderBy: { sortOrder: "asc" as const } },
  articles: { orderBy: { sortOrder: "asc" as const } },
  socialProfiles: true,
  certifications: { orderBy: { sortOrder: "asc" as const } },
  achievements: { orderBy: { sortOrder: "asc" as const } },
  customSections: { orderBy: { sortOrder: "asc" as const } },
} as const;

function parsePublishedFilter(
  value: string | null,
): "all" | "true" | "false" | null {
  if (value == null || value === "" || value === "all") return "all";
  if (value === "true") return "true";
  if (value === "false") return "false";
  return null;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const filter = parsePublishedFilter(
    new URL(request.url).searchParams.get("isPublished"),
  );
  if (!filter) {
    return NextResponse.json(
      { error: "isPublished must be true, false, or all." },
      { status: 400 },
    );
  }

  const rows = await prisma.portfolio.findMany({
    where:
      filter === "all"
        ? undefined
        : { isPublished: filter === "true" },
    orderBy: { updatedAt: "desc" },
    include: sectionInclude,
  });

  const portfolios = rows.map((portfolio) => {
    const {
      user,
      experiences,
      educations,
      skills,
      projects,
      articles,
      socialProfiles,
      certifications,
      achievements,
      customSections,
      ...profile
    } = portfolio;
    return {
      owner: user,
      profile,
      experiences,
      educations,
      skills,
      projects,
      articles,
      socialProfiles,
      certifications,
      achievements,
      customSections,
    };
  });

  const csv = portfoliosToCsv(portfolios);
  const filename = csvFilename(filter);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
