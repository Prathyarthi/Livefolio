import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import type { JobRequirementInput } from "@/features/applications/lib/search";
import { yearsFromRanges } from "@/features/applications/lib/applicant-summary";

export type EvidenceItem = {
  kind:
    | "experience"
    | "skill"
    | "project"
    | "education"
    | "certification"
    | "publication"
    | "achievement";
  label: string;
  detail?: string;
};

export type RequirementMatch = {
  label: string;
  type: "required" | "preferred" | string;
  category: string;
  matched: boolean;
  evidence: EvidenceItem[];
};

export type ApplicantEvidenceSummary = {
  highlights: EvidenceItem[];
  requirementMatches: RequirementMatch[];
  matchedRequired: number;
  totalRequired: number;
  matchedPreferred: number;
  totalPreferred: number;
};

const TOKEN_STOP_WORDS = new Set([
  "years",
  "year",
  "yrs",
  "yr",
  "plus",
  "with",
  "and",
  "the",
  "for",
  "of",
  "a",
  "an",
  "in",
  "on",
  "to",
  "at",
  "least",
  "minimum",
  "min",
  "experience",
  "exp",
  "tenure",
]);

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().trim();
}

function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string | undefined {
  if (!startDate) return undefined;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return undefined;
  const startLabel = start.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
  if (!endDate) return `${startLabel} – Present`;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return `${startLabel} – Present`;
  const endLabel = end.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

/**
 * Detect tenure requirements like "5+ years experience", "at least 3 years", "4 yrs".
 * Returns null when the label is not a years-of-experience requirement.
 */
export function parseMinYearsRequirement(label: string): number | null {
  const n = normalize(label);
  const hasYearsWord = /\b(years?|yrs?)\b/.test(n);
  if (!hasYearsWord) return null;

  const looksLikeTenure =
    /\b(experience|exp|tenure)\b/.test(n) ||
    /\d+\s*\+/.test(n) ||
    /\b(at\s+least|minimum|min\.?)\b/.test(n);

  if (!looksLikeTenure) return null;

  const match =
    n.match(/(?:at\s+least|minimum|min\.?)\s+(\d+)\s*\+?\s*(?:years?|yrs?)/) ||
    n.match(/(\d+)\s*\+\s*(?:years?|yrs?)/) ||
    n.match(/(\d+)\s*(?:years?|yrs?)/);

  if (!match) return null;
  const years = Number(match[1]);
  return Number.isFinite(years) && years >= 0 ? years : null;
}

function requirementTokens(label: string): string[] {
  return normalize(label)
    .split(/[^a-z0-9+#.]+/i)
    .map((t) => t.trim())
    .filter(
      (t) =>
        t.length >= 2 &&
        !TOKEN_STOP_WORDS.has(t) &&
        // Bare numbers / "5+" are meaningless for keyword evidence
        !/^\d+\+?$/.test(t),
    );
}

/** All meaningful tokens must appear — avoids half-match false positives. */
function textIncludesTokens(text: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const hay = normalize(text);
  return tokens.every((token) => hay.includes(token));
}

function collectYearsExperienceEvidence(
  snapshot: ApplicationSnapshotData,
  minYears: number,
): EvidenceItem[] {
  const years = yearsFromRanges(snapshot.experiences);
  if (years == null || years < minYears) return [];

  const evidence: EvidenceItem[] = [
    {
      kind: "experience",
      label: `${years} years total tenure`,
      detail: `Calculated from work history dates (requires ${minYears}+)`,
    },
  ];

  for (const exp of snapshot.experiences) {
    if (!exp.startDate) continue;
    evidence.push({
      kind: "experience",
      label: `${exp.role} · ${exp.company}`,
      detail: formatDateRange(exp.startDate, exp.endDate),
    });
    if (evidence.length >= 4) break;
  }

  return evidence;
}

function collectKeywordEvidence(
  snapshot: ApplicationSnapshotData,
  label: string,
): EvidenceItem[] {
  const tokens = requirementTokens(label);
  if (tokens.length === 0) return [];

  const evidence: EvidenceItem[] = [];

  for (const skill of snapshot.skills) {
    if (textIncludesTokens(skill.name, tokens)) {
      evidence.push({ kind: "skill", label: skill.name });
    }
  }

  for (const exp of snapshot.experiences) {
    const blob = [exp.role, exp.company, exp.description, exp.location]
      .filter(Boolean)
      .join(" ");
    if (textIncludesTokens(blob, tokens)) {
      evidence.push({
        kind: "experience",
        label: `${exp.role} · ${exp.company}`,
        detail: exp.description?.slice(0, 160) || undefined,
      });
    }
  }

  for (const project of snapshot.projects) {
    const blob = [project.title, project.description, ...project.techStack].join(
      " ",
    );
    if (textIncludesTokens(blob, tokens)) {
      evidence.push({
        kind: "project",
        label: project.title,
        detail: project.description?.slice(0, 160) || undefined,
      });
    }
  }

  for (const edu of snapshot.educations) {
    const blob = [edu.degree, edu.institution, edu.field, edu.description]
      .filter(Boolean)
      .join(" ");
    if (textIncludesTokens(blob, tokens)) {
      evidence.push({
        kind: "education",
        label: `${edu.degree} · ${edu.institution}`,
      });
    }
  }

  for (const cert of snapshot.certifications) {
    const blob = `${cert.name} ${cert.issuer}`;
    if (textIncludesTokens(blob, tokens)) {
      evidence.push({
        kind: "certification",
        label: `${cert.name} · ${cert.issuer}`,
      });
    }
  }

  for (const article of snapshot.articles) {
    const blob = [article.title, article.description, ...article.tags].join(" ");
    if (textIncludesTokens(blob, tokens)) {
      evidence.push({
        kind: "publication",
        label: article.title,
      });
    }
  }

  for (const achievement of snapshot.achievements) {
    if (textIncludesTokens(achievement.title, tokens)) {
      evidence.push({ kind: "achievement", label: achievement.title });
    }
  }

  const seen = new Set<string>();
  return evidence.filter((item) => {
    const key = `${item.kind}:${item.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectEvidenceForRequirement(
  snapshot: ApplicationSnapshotData,
  label: string,
): EvidenceItem[] {
  const minYears = parseMinYearsRequirement(label);
  if (minYears != null) {
    // Tenure requirements use dated work history only — never keyword/project matches.
    return collectYearsExperienceEvidence(snapshot, minYears);
  }

  return collectKeywordEvidence(snapshot, label);
}

/** General evidence highlights when there are no structured requirements. */
function generalHighlights(snapshot: ApplicationSnapshotData): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  for (const project of snapshot.projects.filter((p) => p.featured).slice(0, 2)) {
    items.push({ kind: "project", label: project.title });
  }
  for (const project of snapshot.projects.slice(0, 3)) {
    if (items.length >= 4) break;
    if (!items.some((i) => i.label === project.title)) {
      items.push({ kind: "project", label: project.title });
    }
  }
  for (const cert of snapshot.certifications.slice(0, 2)) {
    items.push({
      kind: "certification",
      label: `${cert.name} · ${cert.issuer}`,
    });
  }
  for (const article of snapshot.articles.slice(0, 2)) {
    if (items.length >= 6) break;
    items.push({ kind: "publication", label: article.title });
  }
  for (const achievement of snapshot.achievements.slice(0, 2)) {
    if (items.length >= 6) break;
    items.push({ kind: "achievement", label: achievement.title });
  }

  return items.slice(0, 6);
}

export function buildApplicantEvidence(
  snapshot: ApplicationSnapshotData | null | undefined,
  requirements: JobRequirementInput[] = [],
): ApplicantEvidenceSummary {
  if (!snapshot) {
    return {
      highlights: [],
      requirementMatches: [],
      matchedRequired: 0,
      totalRequired: 0,
      matchedPreferred: 0,
      totalPreferred: 0,
    };
  }

  const requirementMatches: RequirementMatch[] = requirements.map((req) => {
    const evidence = collectEvidenceForRequirement(snapshot, req.label);
    return {
      label: req.label,
      type: req.type,
      category: req.category,
      matched: evidence.length > 0,
      evidence: evidence.slice(0, 4),
    };
  });

  const required = requirementMatches.filter((r) => r.type === "required");
  const preferred = requirementMatches.filter((r) => r.type === "preferred");

  const fromRequirements = requirementMatches
    .flatMap((r) => r.evidence)
    .slice(0, 6);

  const highlights =
    fromRequirements.length > 0
      ? (() => {
          const seen = new Set<string>();
          return fromRequirements.filter((item) => {
            const key = `${item.kind}:${item.label}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        })()
      : generalHighlights(snapshot);

  return {
    highlights,
    requirementMatches,
    matchedRequired: required.filter((r) => r.matched).length,
    totalRequired: required.length,
    matchedPreferred: preferred.filter((r) => r.matched).length,
    totalPreferred: preferred.length,
  };
}