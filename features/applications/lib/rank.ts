import type { ApplicantEvidenceSummary } from "@/features/applications/lib/evidence";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { yearsFromRanges } from "@/features/applications/lib/applicant-summary";
import {
  snapshotSearchBlob,
  tokenize,
} from "@/features/applications/lib/search";
import type { JobSearchProfile } from "@/features/jobs/lib/search-profile";

export type ApplicantRank = {
  score: number;
  overlap: number;
  proven: number;
  coding: number;
  seniority: number;
  reasons: string[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function blobHasTerm(blob: string, term: string): boolean {
  const tokens = tokenize(term);
  if (tokens.length === 0) return false;
  return tokens.every((token) => {
    if (token.length <= 3) {
      const pattern = new RegExp(
        `(^|[^a-z0-9+#])${escapeRegExp(token)}([^a-z0-9+#]|$)`,
        "i",
      );
      return pattern.test(blob);
    }
    return blob.includes(token);
  });
}

function matchedTerms(blob: string, terms: string[]): string[] {
  return terms.filter((term) => blobHasTerm(blob, term));
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function socialStats(
  snapshot: ApplicationSnapshotData | null | undefined,
  platform: string,
): Record<string, unknown> | null {
  const profile = snapshot?.socialProfiles.find(
    (item) => item.platform.toLowerCase() === platform,
  );
  return asRecord(profile?.cachedStats);
}

function githubRecentContributions(stats: Record<string, unknown>): number {
  const calendar = asRecord(stats.contributionCalendar);
  const weeks = calendar?.weeks;
  if (!Array.isArray(weeks)) {
    return asNumber(calendar?.totalContributions ?? stats.totalContributions);
  }
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  let total = 0;
  for (const week of weeks) {
    const days = asRecord(week)?.contributionDays;
    if (!Array.isArray(days)) continue;
    for (const day of days) {
      const row = asRecord(day);
      if (!row) continue;
      const date =
        typeof row.date === "string" ? Date.parse(row.date) : Number.NaN;
      if (!Number.isNaN(date) && date >= cutoff) {
        total += asNumber(row.contributionCount);
      }
    }
  }
  return total;
}

function leetcodeScore(stats: Record<string, unknown>): number {
  const hard = clamp01(asNumber(stats.hardSolved) / 40);
  const medium = clamp01(asNumber(stats.mediumSolved) / 100);
  const ranking = asNumber(stats.ranking);
  const rank = ranking > 0 ? clamp01(1 - ranking / 200_000) : 0;
  return hard * 0.5 + medium * 0.3 + rank * 0.2;
}

function githubScore(stats: Record<string, unknown>): number {
  const recent = githubRecentContributions(stats);
  return clamp01(recent / 60);
}

function codingScore(
  snapshot: ApplicationSnapshotData | null | undefined,
  profile: JobSearchProfile,
  reasons: string[],
): number {
  const parts: number[] = [];
  if (profile.gates.leetcode) {
    const stats = socialStats(snapshot, "leetcode");
    if (stats) {
      const score = leetcodeScore(stats);
      if (score > 0.15) {
        parts.push(score);
        const hard = asNumber(stats.hardSolved);
        const medium = asNumber(stats.mediumSolved);
        reasons.push(
          `LeetCode ${hard} hard / ${medium} medium` +
            (asNumber(stats.ranking) > 0 ? ` · rank ${asNumber(stats.ranking)}` : ""),
        );
      }
    }
  }
  if (profile.gates.github) {
    const stats = socialStats(snapshot, "github");
    if (stats) {
      const score = githubScore(stats);
      if (score > 0.15) {
        parts.push(score);
        reasons.push(
          `GitHub ${githubRecentContributions(stats)} contributions in 90 days`,
        );
      }
    }
  }
  if (parts.length === 0) return 0;
  return parts.reduce((sum, value) => sum + value, 0) / parts.length;
}

function projectBlob(project: ApplicationSnapshotData["projects"][number]) {
  return [project.title, project.description, ...project.techStack]
    .join(" ")
    .toLowerCase();
}

function provenScore(
  snapshot: ApplicationSnapshotData | null | undefined,
  terms: string[],
  preferLive: boolean,
  reasons: string[],
): number {
  if (!snapshot || terms.length === 0) return 0;
  const proven = snapshot.projects.filter((project) => {
    const hasProof = Boolean(project.liveUrl || project.sourceUrl);
    if (preferLive && !hasProof) return false;
    if (!preferLive && !hasProof) return false;
    return terms.some((term) => blobHasTerm(projectBlob(project), term));
  });
  if (proven.length === 0) return 0;
  const first = proven[0]!;
  reasons.push(
    first.liveUrl
      ? `Live project: ${first.title}`
      : `Source project: ${first.title}`,
  );
  return clamp01(proven.length / Math.min(3, terms.length));
}

function seniorityScore(
  snapshot: ApplicationSnapshotData | null | undefined,
  minYears: number | null,
  reasons: string[],
): number {
  if (minYears == null || minYears <= 0) return 0.5;
  const years = snapshot ? yearsFromRanges(snapshot.experiences) : null;
  if (years == null) return 0.25;
  const score = clamp01(years / minYears);
  if (years >= minYears) {
    reasons.push(`${years} years experience (JD asked ${minYears}+)`);
  }
  return score;
}

function overlapScore(
  blob: string,
  profile: JobSearchProfile,
  reasons: string[],
): number {
  const must = matchedTerms(blob, profile.mustHaves);
  const nice = matchedTerms(blob, profile.niceToHaves);
  const domains = matchedTerms(blob, profile.domains);
  const responsibilities = matchedTerms(blob, profile.responsibilities);
  const digestHits = matchedTerms(blob, tokenize(profile.digest).slice(0, 12));

  if (must[0]) reasons.push(`Must-have: ${must.slice(0, 3).join(", ")}`);
  else if (nice[0]) reasons.push(`Nice-to-have: ${nice.slice(0, 3).join(", ")}`);
  if (domains[0]) reasons.push(`Domain: ${domains.slice(0, 2).join(", ")}`);
  if (responsibilities[0]) {
    reasons.push(responsibilities[0]!);
  }

  const mustScore =
    profile.mustHaves.length === 0
      ? digestHits.length > 0
        ? 0.4
        : 0.2
      : must.length / profile.mustHaves.length;
  const niceScore =
    profile.niceToHaves.length === 0
      ? 0
      : nice.length / profile.niceToHaves.length;
  const extra =
    (domains.length > 0 ? 0.1 : 0) +
    (responsibilities.length > 0 ? 0.1 : 0) +
    clamp01(digestHits.length / 8) * 0.1;

  return clamp01(mustScore * 0.7 + niceScore * 0.2 + extra);
}

export function rankApplicantAgainstJob(
  snapshot: ApplicationSnapshotData | null | undefined,
  profile: JobSearchProfile | null,
  extras?: { name?: string; email?: string; coverNote?: string | null },
): ApplicantRank {
  if (!profile) {
    return {
      score: 0,
      overlap: 0,
      proven: 0,
      coding: 0,
      seniority: 0,
      reasons: [],
    };
  }

  const blob = snapshotSearchBlob(snapshot, extras);
  const reasons: string[] = [];
  const overlap = overlapScore(blob, profile, reasons);
  const proven = provenScore(
    snapshot,
    [...profile.mustHaves, ...profile.niceToHaves],
    profile.gates.liveUrl,
    reasons,
  );
  const coding = codingScore(snapshot, profile, reasons);
  const seniority = seniorityScore(snapshot, profile.minYears, reasons);

  const score = Math.round(
    (overlap * 0.5 + proven * 0.2 + coding * 0.15 + seniority * 0.1 + 0.05) *
      100,
  );

  const uniqueReasons = [...new Set(reasons)].slice(0, 4);
  return {
    score: Math.min(100, Math.max(0, score)),
    overlap,
    proven,
    coding,
    seniority,
    reasons: uniqueReasons,
  };
}

export function attachRank(
  evidence: ApplicantEvidenceSummary,
  rank: ApplicantRank,
): ApplicantEvidenceSummary {
  const highlights =
    rank.reasons.length > 0
      ? rank.reasons.map((label) => ({ kind: "match" as const, label }))
      : evidence.highlights;
  return {
    ...evidence,
    highlights,
    rankScore: rank.score,
    rankReasons: rank.reasons,
  };
}
