import type { ParsedResume } from "@/lib/gemini";

export type ClaimProofItem = {
  claim: string;
  status: "supported" | "partial" | "unsupported" | "unverified";
  evidence: string[];
};

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.]/g, "");
}

function skillMentionedInText(skill: string, texts: string[]): boolean {
  const token = normalizeToken(skill);
  if (token.length < 2) return false;
  return texts.some((t) => normalizeToken(t).includes(token) || t.toLowerCase().includes(skill.toLowerCase()));
}

/**
 * Map resume claims to evidence from structured data + enriched integration stats.
 */
export function buildClaimsVsProof(input: {
  parsed: ParsedResume;
  platformStats: Array<{
    platform: string;
    fetchStatus: string;
    cachedStats: Record<string, unknown> | null;
  }>;
  projectTitles: string[];
  projectTech: string[];
  projectDescriptions: string[];
}): ClaimProofItem[] {
  const items: ClaimProofItem[] = [];
  const corpus = [
    ...input.projectTitles,
    ...input.projectTech,
    ...input.projectDescriptions,
    input.parsed.summary,
    ...input.parsed.experiences.map((e) => `${e.role} ${e.company} ${e.description}`),
  ];

  const github = input.platformStats.find((p) => p.platform === "github");
  const leetcode = input.platformStats.find((p) => p.platform === "leetcode");
  const medium = input.platformStats.find((p) => p.platform === "medium");

  for (const skill of input.parsed.skills.slice(0, 24)) {
    const evidence: string[] = [];
    const inProjects = skillMentionedInText(skill.name, corpus);
    if (inProjects) evidence.push(`Mentioned in experience or work samples`);

    if (github?.fetchStatus === "enriched" && github.cachedStats) {
      const repos = Number(github.cachedStats.public_repos ?? 0);
      if (repos > 0 && inProjects) {
        evidence.push(`Connected source shows ${repos} public repositories`);
      }
    }

    items.push({
      claim: skill.name,
      status: evidence.length
        ? inProjects
          ? "supported"
          : "partial"
        : github || leetcode || medium
          ? "unsupported"
          : "unverified",
      evidence,
    });
  }

  if (github?.fetchStatus === "enriched" && github.cachedStats) {
    const cal = github.cachedStats.contributionCalendar as
      | { totalContributions?: number }
      | undefined;
    const total = cal?.totalContributions;
    items.unshift({
      claim: "Active public contribution history",
      status: typeof total === "number" && total > 0 ? "supported" : "partial",
      evidence:
        typeof total === "number"
          ? [`${total} contributions in the visible activity window`]
          : ["Connected source enriched; contribution totals unavailable"],
    });
  }

  if (leetcode?.fetchStatus === "enriched" && leetcode.cachedStats) {
    const solved = Number(leetcode.cachedStats.totalSolved ?? 0);
    items.unshift({
      claim: "Problem-solving practice",
      status: solved > 0 ? "supported" : "partial",
      evidence: solved > 0 ? [`${solved} problems solved on connected source`] : [],
    });
  }

  if (medium?.fetchStatus === "enriched" && medium.cachedStats) {
    const count = Number(medium.cachedStats.articleCount ?? 0);
    items.unshift({
      claim: "Published writing",
      status: count > 0 ? "supported" : "partial",
      evidence: count > 0 ? [`${count} published articles`] : [],
    });
  }

  for (const exp of input.parsed.experiences.slice(0, 8)) {
    items.push({
      claim: `${exp.role} at ${exp.company}`,
      status: "unverified",
      evidence: exp.description
        ? ["From resume experience section"]
        : ["Listed on resume"],
    });
  }

  return items.slice(0, 40);
}
