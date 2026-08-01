import { prisma } from "@/lib/prisma";
import type { PlatformSignalMap } from "@/lib/recruiter-signals";

export type FilterAst = {
  skills?: string[];
  minYears?: number;
  titles?: string[];
  companies?: string[];
  keywords?: string[];
  activeOnPlatformWithinDays?: { platform: string; days: number; must?: boolean };
  minPlatformStat?: {
    platform: string;
    key: string;
    min: number;
    must?: boolean;
  };
  requiresLiveDemo?: boolean;
  requiresPublishedContent?: boolean;
};

export type SearchMatchReason = {
  type: "baseline" | "amplifier";
  label: string;
};

export type SearchHit = {
  signalId: string;
  corpusType: string;
  candidateId: string | null;
  portfolioId: string | null;
  displayName: string;
  headline: string;
  score: number;
  reasons: SearchMatchReason[];
  skills: string[];
  slug?: string | null;
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function includesSkill(haystack: string[], needle: string): boolean {
  const n = normalize(needle);
  return haystack.some(
    (h) => normalize(h) === n || normalize(h).includes(n) || n.includes(normalize(h))
  );
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (24 * 60 * 60 * 1000);
}

export function scoreSignalAgainstAst(
  signal: {
    id: string;
    corpusType: string;
    candidateId: string | null;
    portfolioId: string | null;
    displayName: string;
    headline: string;
    skills: string[];
    titles: string[];
    companies: string[];
    projectTech: string[];
    minYearsEstimate: number | null;
    searchText: string;
    platformSignals: unknown;
    hasLiveDemo: boolean;
    hasPublishedContent: boolean;
  },
  ast: FilterAst
): SearchHit | null {
  const reasons: SearchMatchReason[] = [];
  let score = 0;
  const platformSignals = (signal.platformSignals ?? {}) as PlatformSignalMap;
  const searchLower = signal.searchText.toLowerCase();

  // Must-have amplifiers
  if (ast.requiresLiveDemo && !signal.hasLiveDemo) return null;
  if (ast.requiresPublishedContent && !signal.hasPublishedContent) return null;

  if (ast.activeOnPlatformWithinDays?.must) {
    const { platform, days } = ast.activeOnPlatformWithinDays;
    const last = platformSignals[platform]?.lastActiveAt;
    const age = daysSince(last);
    if (age == null || age > days) return null;
  }

  if (ast.minPlatformStat?.must) {
    const { platform, key, min } = ast.minPlatformStat;
    const stats = platformSignals[platform]?.stats;
    const value = Number(stats?.[key] ?? 0);
    if (!(value >= min)) return null;
  }

  if (typeof ast.minYears === "number") {
    const years = signal.minYearsEstimate ?? 0;
    if (years + 0.5 < ast.minYears) {
      // soft miss unless no other baseline matches later
    } else {
      score += 12;
      reasons.push({
        type: "baseline",
        label: `~${years} years experience (asked ${ast.minYears}+)`,
      });
    }
  }

  for (const skill of ast.skills ?? []) {
    const hit =
      includesSkill(signal.skills, skill) ||
      includesSkill(signal.projectTech, skill) ||
      searchLower.includes(normalize(skill));
    if (hit) {
      score += 10;
      reasons.push({ type: "baseline", label: `Skill match: ${skill}` });
    }
  }

  for (const title of ast.titles ?? []) {
    if (signal.titles.some((t) => normalize(t).includes(normalize(title)))) {
      score += 8;
      reasons.push({ type: "baseline", label: `Title match: ${title}` });
    }
  }

  for (const company of ast.companies ?? []) {
    if (signal.companies.some((c) => normalize(c).includes(normalize(company)))) {
      score += 6;
      reasons.push({ type: "baseline", label: `Company: ${company}` });
    }
  }

  for (const kw of ast.keywords ?? []) {
    if (searchLower.includes(normalize(kw))) {
      score += 4;
      reasons.push({ type: "baseline", label: `Keyword: ${kw}` });
    }
  }

  if (ast.activeOnPlatformWithinDays && !ast.activeOnPlatformWithinDays.must) {
    const { platform, days } = ast.activeOnPlatformWithinDays;
    const age = daysSince(platformSignals[platform]?.lastActiveAt);
    if (age != null && age <= days) {
      score += 15;
      reasons.push({
        type: "amplifier",
        label: `Active on ${platform} within ${days}d`,
      });
    }
  }

  if (ast.minPlatformStat && !ast.minPlatformStat.must) {
    const { platform, key, min } = ast.minPlatformStat;
    const value = Number(platformSignals[platform]?.stats?.[key] ?? 0);
    if (value >= min) {
      score += 10;
      reasons.push({
        type: "amplifier",
        label: `${platform}.${key} ≥ ${min} (${value})`,
      });
    }
  }

  if (ast.requiresLiveDemo === false && signal.hasLiveDemo) {
    score += 3;
  } else if (signal.hasLiveDemo && (ast.skills?.length || ast.keywords?.length)) {
    score += 2;
  }

  // Require at least some baseline relevance when filters exist
  const hasBaselineFilters =
    (ast.skills?.length ?? 0) > 0 ||
    (ast.titles?.length ?? 0) > 0 ||
    (ast.companies?.length ?? 0) > 0 ||
    (ast.keywords?.length ?? 0) > 0 ||
    typeof ast.minYears === "number";

  if (hasBaselineFilters && reasons.filter((r) => r.type === "baseline").length === 0) {
    return null;
  }

  if (!hasBaselineFilters && score === 0 && !ast.activeOnPlatformWithinDays && !ast.minPlatformStat) {
    // empty AST — include with low score
    score = 1;
    reasons.push({ type: "baseline", label: "In searchable corpus" });
  }

  if (score <= 0) return null;

  return {
    signalId: signal.id,
    corpusType: signal.corpusType,
    candidateId: signal.candidateId,
    portfolioId: signal.portfolioId,
    displayName: signal.displayName,
    headline: signal.headline,
    score,
    reasons: reasons.slice(0, 8),
    skills: signal.skills.slice(0, 12),
  };
}

export async function executeRecruiterSearch(input: {
  orgId: string;
  ast: FilterAst;
  limit?: number;
}): Promise<SearchHit[]> {
  const limit = input.limit ?? 40;

  const dossierSignals = await prisma.candidateSignal.findMany({
    where: { corpusType: "dossier", orgId: input.orgId },
  });

  const livefolioSignals = await prisma.candidateSignal.findMany({
    where: {
      corpusType: "livefolio",
      portfolio: {
        isPublished: true,
        openToOpportunities: true,
      },
    },
  });

  const hits: SearchHit[] = [];
  for (const signal of [...dossierSignals, ...livefolioSignals]) {
    const hit = scoreSignalAgainstAst(signal, input.ast);
    if (hit) hits.push(hit);
  }

  hits.sort((a, b) => b.score - a.score);

  // Attach slugs for livefolio hits
  const portfolioIds = hits
    .map((h) => h.portfolioId)
    .filter((id): id is string => Boolean(id));
  if (portfolioIds.length) {
    const portfolios = await prisma.portfolio.findMany({
      where: { id: { in: portfolioIds } },
      select: { id: true, slug: true },
    });
    const slugById = new Map(portfolios.map((p) => [p.id, p.slug]));
    for (const hit of hits) {
      if (hit.portfolioId) hit.slug = slugById.get(hit.portfolioId) ?? null;
    }
  }

  return hits.slice(0, limit);
}

/** Heuristic fallback when AI compile is unavailable. */
export function heuristicCompileQuery(text: string): FilterAst {
  const lower = text.toLowerCase();
  const skills: string[] = [];
  const keywords: string[] = [];
  const titles: string[] = [];

  const skillHints = [
    "react",
    "typescript",
    "javascript",
    "python",
    "java",
    "figma",
    "product",
    "marketing",
    "design",
    "node",
    "aws",
    "sql",
    "kubernetes",
    "golang",
    "rust",
  ];
  for (const hint of skillHints) {
    if (lower.includes(hint)) skills.push(hint);
  }

  const yearsMatch = lower.match(/(\d+)\+?\s*\+?\s*years?/);
  const minYears = yearsMatch ? Number(yearsMatch[1]) : undefined;

  let activeOnPlatformWithinDays: FilterAst["activeOnPlatformWithinDays"];
  if (lower.includes("active on github") || lower.includes("active github")) {
    activeOnPlatformWithinDays = { platform: "github", days: 90 };
  }

  if (lower.includes("designer")) titles.push("designer");
  if (lower.includes("engineer") || lower.includes("developer")) {
    titles.push("engineer");
  }
  if (lower.includes("product manager") || lower.includes("pm ")) {
    titles.push("product");
  }

  const words = text
    .split(/[^a-zA-Z0-9+#.]/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);
  for (const w of words.slice(0, 20)) {
    if (!skills.includes(w.toLowerCase())) keywords.push(w);
  }

  return {
    skills: skills.length ? skills : undefined,
    minYears,
    titles: titles.length ? titles : undefined,
    keywords: keywords.slice(0, 12),
    activeOnPlatformWithinDays,
    requiresLiveDemo: lower.includes("live demo") || lower.includes("live project"),
    requiresPublishedContent:
      lower.includes("published") || lower.includes("writing") || lower.includes("articles"),
  };
}
