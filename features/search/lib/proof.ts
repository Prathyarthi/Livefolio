import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { flattenSearchableJson } from "@/features/search/lib/match";

export const PROOF_KINDS = [
  "live",
  "source",
  "writing",
  "certified",
  "awards",
] as const;

export type ProofKind = (typeof PROOF_KINDS)[number];

export const PROOF_LABELS: Record<ProofKind, string> = {
  live: "Live work",
  source: "Code or source",
  writing: "Published writing",
  certified: "Certifications",
  awards: "Awards",
};

export function isProofKind(value: unknown): value is ProofKind {
  return (
    typeof value === "string" && (PROOF_KINDS as readonly string[]).includes(value)
  );
}

const URL_PATTERN = /https?:\/\/[^\s"']+/i;
const LINK_HOSTS_SOURCE = /github\.com|gitlab\.com|bitbucket\.org/i;

/** Proof-of-work a Livefolio carries, for any role: shipped links, source, writing, credentials, awards. */
export function proofKindsOf(
  snapshot: ApplicationSnapshotData | null | undefined,
): ProofKind[] {
  if (!snapshot) return [];
  const kinds = new Set<ProofKind>();
  for (const project of snapshot.projects) {
    if (project.liveUrl) kinds.add("live");
    if (project.sourceUrl) kinds.add("source");
  }
  if (
    snapshot.socialProfiles.some((s) =>
      ["github", "gitlab", "leetcode", "codeforces", "stackoverflow"].includes(
        s.platform.toLowerCase(),
      ),
    )
  ) {
    kinds.add("source");
  }
  if (
    snapshot.socialProfiles.some((s) =>
      ["dribbble", "behance"].includes(s.platform.toLowerCase()),
    )
  ) {
    kinds.add("live");
  }
  if (snapshot.articles.length > 0) kinds.add("writing");
  if (snapshot.certifications.length > 0) kinds.add("certified");
  if (snapshot.achievements.length > 0) kinds.add("awards");
  for (const section of snapshot.customSections) {
    for (const text of flattenSearchableJson(section.items)) {
      const url = text.match(URL_PATTERN)?.[0];
      if (!url) continue;
      kinds.add(LINK_HOSTS_SOURCE.test(url) ? "source" : "live");
    }
  }
  return PROOF_KINDS.filter((kind) => kinds.has(kind));
}
