import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import type { JobSearchProfile } from "@/features/jobs/lib/search-profile";
import {
  blobHasTerm,
  customItemTitle,
  customSectionEntries,
  flattenSearchableJson,
  tokenize,
} from "@/features/search/lib/match";
import { joinText } from "@/features/search/lib/rank-fields";

export function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function freshnessScore(freshnessAt?: Date | string | null): number {
  if (!freshnessAt) return 0.35;
  const at =
    freshnessAt instanceof Date ? freshnessAt.getTime() : Date.parse(freshnessAt);
  if (Number.isNaN(at)) return 0.35;
  const days = (Date.now() - at) / (24 * 60 * 60 * 1000);
  if (days <= 7) return 1;
  if (days <= 30) return 0.75;
  if (days <= 90) return 0.45;
  if (days <= 365) return 0.25;
  return 0.1;
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
  return clamp01(githubRecentContributions(stats) / 60);
}

function writingActivityScore(
  snapshot: ApplicationSnapshotData | null | undefined,
  reasons: string[],
): number {
  const articles = snapshot?.articles ?? [];
  if (articles.length === 0) return 0;
  const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const recent = articles.filter((a) => {
    const at = a.publishedAt ? Date.parse(a.publishedAt) : Number.NaN;
    return !Number.isNaN(at) && at >= yearAgo;
  }).length;
  const score = clamp01(recent / 6) * 0.6 + clamp01(articles.length / 20) * 0.4;
  if (score > 0.15) {
    reasons.push(
      `${articles.length} published pieces` +
        (recent > 0 ? `, ${recent} in the last year` : ""),
    );
  }
  return score;
}

/** Whether the role has a platform signal to read (coding activity, publishing cadence). */
export function hasPlatformSignal(profile: JobSearchProfile): boolean {
  return profile.gates.github || profile.gates.leetcode || profile.gates.medium;
}

export function platformScore(
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
  if (profile.gates.medium) {
    const score = writingActivityScore(snapshot, reasons);
    if (score > 0.15) parts.push(score);
  }
  if (parts.length === 0) return 0;
  return parts.reduce((sum, value) => sum + value, 0) / parts.length;
}

type ProofItem = {
  label: string;
  text: string;
  weight: number;
  live: boolean;
  /** Skip the skill-term filter: a GitHub/Behance profile is proof even if it does not name the skill. */
  always?: boolean;
};

const URL_PATTERN = /https?:\/\/[^\s"']+/i;
const SOURCE_PLATFORMS = new Set([
  "github",
  "gitlab",
  "leetcode",
  "codeforces",
  "stackoverflow",
]);
const LIVE_PLATFORMS = new Set(["dribbble", "behance"]);

/**
 * Work shown anywhere on a Livefolio. A live link is strongest; a job in the
 * experience section still counts. One strong item is most of the score; a
 * second and third fill the rest.
 */
function proofItems(snapshot: ApplicationSnapshotData): ProofItem[] {
  const items: ProofItem[] = [];
  for (const exp of snapshot.experiences) {
    items.push({
      label: `${exp.role} at ${exp.company}`,
      text: joinText([exp.role, exp.company, exp.description]),
      weight: 0.7,
      live: false,
    });
  }
  for (const p of snapshot.projects) {
    const live = Boolean(p.liveUrl);
    const linked = Boolean(p.liveUrl || p.sourceUrl);
    items.push({
      label: live ? `Live project: ${p.title}` : `Project: ${p.title}`,
      text: joinText([p.title, p.description, ...p.techStack]),
      weight: live ? 1 : linked ? 0.9 : 0.55,
      live,
    });
  }
  for (const a of snapshot.articles) {
    items.push({
      label: `Published: ${a.title}`,
      text: joinText([a.title, a.description, ...a.tags]),
      weight: a.url ? 0.85 : 0.5,
      live: Boolean(a.url),
    });
  }
  for (const c of snapshot.certifications) {
    items.push({
      label: `Certified: ${c.name}`,
      text: joinText([c.name, c.issuer]),
      weight: c.url ? 0.7 : 0.45,
      live: false,
    });
  }
  for (const a of snapshot.achievements) {
    items.push({
      label: `Award: ${a.title}`,
      text: joinText([a.title]),
      weight: 0.4,
      live: false,
    });
  }
  for (const section of snapshot.customSections) {
    for (const entry of customSectionEntries(section)) {
      const strings = flattenSearchableJson(entry);
      const url = strings.find((s) => URL_PATTERN.test(s));
      items.push({
        label: `${section.label}: ${customItemTitle(entry, section.label)}`,
        text: joinText([section.label, ...strings]),
        weight: url ? 1 : 0.55,
        live: Boolean(url),
      });
    }
  }
  for (const social of snapshot.socialProfiles) {
    const platform = social.platform.toLowerCase();
    if (SOURCE_PLATFORMS.has(platform)) {
      items.push({
        label: `${social.platform} profile`,
        text: joinText([social.platform, social.username]),
        weight: 0.75,
        live: false,
        always: true,
      });
    } else if (LIVE_PLATFORMS.has(platform)) {
      items.push({
        label: `${social.platform} portfolio`,
        text: joinText([social.platform, social.username]),
        weight: 0.8,
        live: true,
        always: true,
      });
    }
  }
  return items;
}

export function provenScore(
  snapshot: ApplicationSnapshotData | null | undefined,
  terms: string[],
  preferLive: boolean,
  reasons: string[],
): number {
  if (!snapshot) return 0;
  const proven = proofItems(snapshot).filter((item) => {
    if (item.always) return true;
    if (terms.length === 0) return item.weight >= 0.7 || item.live;
    return terms.some((term) => blobHasTerm(item.text, term));
  });
  if (proven.length === 0) return 0;
  const ranked = [...proven].sort(
    (a, b) => b.weight - a.weight || Number(b.live) - Number(a.live),
  );
  const lead = ranked.find((item) => item.live) ?? ranked[0]!;
  reasons.push(lead.label);
  const extras = [1, 0.4, 0.2];
  let score = 0;
  for (let i = 0; i < Math.min(3, ranked.length); i++) {
    score += ranked[i]!.weight * extras[i]!;
  }
  if (preferLive && ranked.some((item) => item.live)) score += 0.08;
  return clamp01(score);
}

const FIT_FILLER = new Set([
  "strong",
  "hands",
  "handson",
  "experience",
  "experienced",
  "years",
  "year",
  "join",
  "team",
  "role",
  "candidate",
  "looking",
  "someone",
  "with",
  "and",
  "the",
  "for",
  "our",
  "end",
  "own",
]);

function mean(parts: number[]): number {
  if (parts.length === 0) return 0.5;
  return parts.reduce((sum, n) => sum + n, 0) / parts.length;
}

/**
 * Context fit: have they actually done this kind of work, in this domain,
 * with the education the job asked for. Not how many years they have —
 * the JD already filters on years.
 */
export function fitScore(
  snapshot: ApplicationSnapshotData | null | undefined,
  profile: JobSearchProfile,
  reasons: string[],
): number {
  if (!snapshot) return 0.25;

  const roleBlob = joinText([
    snapshot.profile.headline,
    ...snapshot.experiences.map((e) => e.role),
  ]);
  const worldBlob = joinText([
    roleBlob,
    snapshot.profile.summary,
    ...snapshot.experiences.flatMap((e) => [e.company, e.description]),
    ...snapshot.educations.flatMap((e) => [e.degree, e.field, e.institution]),
  ]);
  const eduBlob = joinText([
    ...snapshot.educations.flatMap((e) => [e.degree, e.field, e.institution, e.description]),
    ...snapshot.certifications.map((c) => c.name),
  ]);

  const parts: number[] = [];

  const identityTerms = [
    ...profile.responsibilities,
    ...tokenize(profile.digest).filter((t) => t.length >= 4 && !FIT_FILLER.has(t)),
  ];
  if (identityTerms.length > 0) {
    const hits = identityTerms.filter((term) => blobHasTerm(roleBlob, term));
    const score = clamp01(hits.length / Math.min(4, identityTerms.length));
    parts.push(hits.length > 0 ? Math.max(0.55, score) : 0.35);
    if (hits[0]) reasons.push(`Role: ${hits.slice(0, 2).join(", ")}`);
  } else if (snapshot.experiences.length > 0) {
    parts.push(0.5);
  }

  if (profile.domains.length > 0) {
    const hits = profile.domains.filter((d) => blobHasTerm(worldBlob, d));
    parts.push(hits.length > 0 ? 1 : 0.35);
    if (hits[0]) reasons.push(`Domain: ${hits[0]}`);
  }

  if (profile.education?.trim()) {
    const hit = blobHasTerm(eduBlob, profile.education);
    parts.push(hit ? 1 : 0.2);
    if (hit) reasons.push(`Education: ${profile.education}`);
  }

  return mean(parts);
}
