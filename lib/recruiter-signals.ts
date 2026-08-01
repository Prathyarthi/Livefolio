import { prisma } from "@/lib/prisma";
import type { ParsedResume } from "@/lib/gemini";
import { estimateYearsFromExperiences } from "@/lib/recruiter-enrich";
import type { Prisma } from "@/db/generated/prisma/client";

export type PlatformSignalMap = Record<
  string,
  {
    lastActiveAt?: string | null;
    stats?: Record<string, unknown>;
    fetchStatus?: string;
  }
>;

function uniqLower(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const trimmed = v.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function lastActiveFromGitHubStats(
  stats: Record<string, unknown> | null
): string | null {
  if (!stats) return null;
  const cal = stats.contributionCalendar as
    | {
        weeks?: Array<{
          contributionDays?: Array<{ date: string; contributionCount: number }>;
        }>;
      }
    | undefined;
  if (!cal?.weeks) return null;
  let latest: string | null = null;
  for (const week of cal.weeks) {
    for (const day of week.contributionDays ?? []) {
      if (day.contributionCount > 0) {
        if (!latest || day.date > latest) latest = day.date;
      }
    }
  }
  return latest;
}

export function buildPlatformSignalsFromDossier(
  profiles: Array<{
    platform: string;
    fetchStatus: string;
    cachedStats: unknown;
    lastFetched: Date | null;
  }>
): PlatformSignalMap {
  const map: PlatformSignalMap = {};
  for (const p of profiles) {
    const stats =
      p.cachedStats && typeof p.cachedStats === "object"
        ? (p.cachedStats as Record<string, unknown>)
        : null;
    map[p.platform] = {
      lastActiveAt:
        p.platform === "github"
          ? lastActiveFromGitHubStats(stats)
          : p.lastFetched?.toISOString() ?? null,
      stats: stats ?? undefined,
      fetchStatus: p.fetchStatus,
    };
  }
  return map;
}

export function buildBaselineFromParsed(parsed: ParsedResume): {
  skills: string[];
  titles: string[];
  companies: string[];
  projectTech: string[];
  minYearsEstimate: number | null;
  searchText: string;
  hasLiveDemo: boolean;
  hasPublishedContent: boolean;
} {
  const skills = uniqLower(parsed.skills.map((s) => s.name));
  const titles = uniqLower(parsed.experiences.map((e) => e.role));
  const companies = uniqLower(parsed.experiences.map((e) => e.company));
  const projectTech = uniqLower(parsed.projects.flatMap((p) => p.techStack));
  const hasLiveDemo = parsed.projects.some((p) => Boolean(p.liveUrl));
  const searchText = [
    parsed.name,
    parsed.headline,
    parsed.summary,
    ...parsed.experiences.map(
      (e) => `${e.role} ${e.company} ${e.description}`
    ),
    ...parsed.education.map((e) => `${e.degree} ${e.field ?? ""} ${e.institution}`),
    ...skills,
    ...parsed.projects.map((p) => `${p.title} ${p.description} ${p.techStack.join(" ")}`),
    ...parsed.achievements,
    ...parsed.certifications.map((c) => `${c.name} ${c.issuer}`),
  ]
    .join("\n")
    .slice(0, 50_000);

  return {
    skills,
    titles,
    companies,
    projectTech,
    minYearsEstimate: estimateYearsFromExperiences(parsed.experiences),
    searchText,
    hasLiveDemo,
    hasPublishedContent: false,
  };
}

export async function upsertDossierSignal(candidateId: string) {
  const candidate = await prisma.recruiterCandidate.findUnique({
    where: { id: candidateId },
    include: {
      socialProfiles: true,
      projects: true,
    },
  });
  if (!candidate) return null;

  const parsed = candidate.parsedJson as unknown as ParsedResume;
  const baseline = buildBaselineFromParsed({
    ...parsed,
    projects: [
      ...(parsed.projects ?? []),
      ...candidate.projects.map((p) => ({
        title: p.title,
        description: p.description,
        techStack: p.techStack,
        liveUrl: p.liveUrl,
        sourceUrl: p.sourceUrl,
      })),
    ],
  });

  const platformSignals = buildPlatformSignalsFromDossier(candidate.socialProfiles);
  const hasPublishedContent =
    Boolean(platformSignals.medium?.stats?.articleCount) ||
    baseline.hasPublishedContent;
  const hasLiveDemo =
    baseline.hasLiveDemo || candidate.projects.some((p) => Boolean(p.liveUrl));

  const data = {
    corpusType: "dossier",
    candidateId: candidate.id,
    portfolioId: null as string | null,
    orgId: candidate.orgId,
    displayName: candidate.displayName,
    headline: candidate.headline,
    skills: baseline.skills,
    titles: baseline.titles,
    companies: baseline.companies,
    projectTech: uniqLower([
      ...baseline.projectTech,
      ...candidate.projects.flatMap((p) => p.techStack),
    ]),
    minYearsEstimate: baseline.minYearsEstimate,
    searchText: baseline.searchText,
    platformSignals: platformSignals as Prisma.InputJsonValue,
    hasLiveDemo,
    hasPublishedContent,
  };

  return prisma.candidateSignal.upsert({
    where: { candidateId: candidate.id },
    create: { ...data, updatedAt: new Date() },
    update: { ...data, updatedAt: new Date() },
  });
}

export async function upsertLivefolioSignal(portfolioId: string) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      experiences: true,
      educations: true,
      skills: true,
      projects: true,
      articles: true,
      socialProfiles: true,
      certifications: true,
      achievements: true,
    },
  });
  if (!portfolio) return null;

  const parsedLike: ParsedResume = {
    name: portfolio.title,
    headline: portfolio.headline,
    summary: portfolio.summary,
    contact: {
      email: portfolio.contactEmail,
      phone: portfolio.phone,
      websiteUrl: portfolio.websiteUrl,
      location: portfolio.location,
    },
    socialProfiles: portfolio.socialProfiles.map((s) => ({
      platform: s.platform,
      url: s.url,
      username: s.username,
    })),
    experiences: portfolio.experiences.map((e) => ({
      company: e.company,
      role: e.role,
      description: e.description,
      startDate: e.startDate?.toISOString() ?? null,
      endDate: e.endDate?.toISOString() ?? null,
      location: e.location,
    })),
    education: portfolio.educations.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      startDate: e.startDate?.toISOString() ?? null,
      endDate: e.endDate?.toISOString() ?? null,
      gpa: e.gpa,
    })),
    skills: portfolio.skills.map((s) => ({
      name: s.name,
      category: s.category,
    })),
    projects: portfolio.projects.map((p) => ({
      title: p.title,
      description: p.description,
      techStack: p.techStack,
      liveUrl: p.liveUrl,
      sourceUrl: p.sourceUrl,
    })),
    achievements: portfolio.achievements.map((a) => a.title),
    certifications: portfolio.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      issueDate: c.issueDate?.toISOString() ?? null,
      url: c.url,
    })),
    customSections: [],
  };

  const baseline = buildBaselineFromParsed(parsedLike);
  const platformSignals = buildPlatformSignalsFromDossier(
    portfolio.socialProfiles.map((s) => ({
      platform: s.platform,
      fetchStatus: s.cachedStats ? "enriched" : "link_only",
      cachedStats: s.cachedStats,
      lastFetched: s.lastFetched,
    }))
  );

  const data = {
    corpusType: "livefolio",
    candidateId: null as string | null,
    portfolioId: portfolio.id,
    orgId: null as string | null,
    displayName: portfolio.title,
    headline: portfolio.headline,
    skills: baseline.skills,
    titles: baseline.titles,
    companies: baseline.companies,
    projectTech: baseline.projectTech,
    minYearsEstimate: baseline.minYearsEstimate,
    searchText: baseline.searchText,
    platformSignals: platformSignals as Prisma.InputJsonValue,
    hasLiveDemo:
      baseline.hasLiveDemo || portfolio.livePreviewProjectIds.length > 0,
    hasPublishedContent: portfolio.articles.length > 0,
  };

  return prisma.candidateSignal.upsert({
    where: { portfolioId: portfolio.id },
    create: { ...data, updatedAt: new Date() },
    update: { ...data, updatedAt: new Date() },
  });
}
