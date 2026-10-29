import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";

export type { ApplicationSnapshotData };

export const applicationSnapshotInclude = {
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

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

export async function buildApplicationSnapshot(
  userId: string,
): Promise<{ portfolioId: string; data: ApplicationSnapshotData } | null> {
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: applicationSnapshotInclude,
  });

  if (!portfolio) return null;

  return { portfolioId: portfolio.id, data: portfolioToSnapshot(portfolio) };
}

export type SnapshotPortfolio = Prisma.PortfolioGetPayload<{
  include: typeof applicationSnapshotInclude;
}>;

export function portfolioToSnapshot(
  portfolio: SnapshotPortfolio,
): ApplicationSnapshotData {
  return {
    version: 1,
    capturedAt: new Date().toISOString(),
    profile: {
      title: portfolio.title,
      headline: portfolio.headline,
      summary: portfolio.summary,
      avatarUrl: portfolio.avatarUrl,
      location: portfolio.location,
      contactEmail: portfolio.contactEmail,
      websiteUrl: portfolio.websiteUrl,
      slug: portfolio.slug,
    },
    experiences: portfolio.experiences.map((e) => ({
      company: e.company,
      role: e.role,
      description: e.description,
      startDate: toIso(e.startDate),
      endDate: toIso(e.endDate),
      location: e.location,
    })),
    educations: portfolio.educations.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      description: e.description,
      startDate: toIso(e.startDate),
      endDate: toIso(e.endDate),
    })),
    skills: portfolio.skills.map((s) => ({
      name: s.name,
      category: s.category,
      level: s.level,
    })),
    projects: portfolio.projects.map((p) => ({
      title: p.title,
      description: p.description,
      liveUrl: p.liveUrl,
      sourceUrl: p.sourceUrl,
      techStack: p.techStack,
      featured: p.featured,
    })),
    articles: portfolio.articles.map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      tags: a.tags,
      publishedAt: toIso(a.publishedAt),
    })),
    certifications: portfolio.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      issueDate: toIso(c.issueDate),
      url: c.url,
    })),
    achievements: portfolio.achievements.map((a) => ({
      title: a.title,
      date: toIso(a.date),
    })),
    socialProfiles: portfolio.socialProfiles.map((s) => ({
      platform: s.platform,
      url: s.url,
      username: s.username,
      cachedStats: s.cachedStats ?? null,
    })),
    customSections: portfolio.customSections.map((c) => ({
      sectionType: c.sectionType,
      label: c.label,
      items: c.items,
    })),
  };
}

export function snapshotAsJson(
  data: ApplicationSnapshotData,
): Prisma.InputJsonValue {
  return data as unknown as Prisma.InputJsonValue;
}
