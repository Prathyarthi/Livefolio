import type { JobRequirementInput } from "@/features/applications/lib/search";

export type PoolGapRow = {
  label: string;
  type: string;
  category: string;
  matchedCount: number;
  poolSize: number;
  coveragePercent: number;
};

export type PoolGapReport = {
  poolSize: number;
  rows: PoolGapRow[];
};

export function requirementKey(req: { type: string; label: string }): string {
  return `${req.type}|${req.label}`;
}

export function buildPoolGapReport(
  applicants: Array<{
    evidence: {
      requirementMatches: Array<{
        label: string;
        type: string;
        matched: boolean;
      }>;
    };
  }>,
  requirements: JobRequirementInput[],
): PoolGapReport {
  return buildPoolGapReportFromKeys(
    applicants.map((applicant) =>
      applicant.evidence.requirementMatches
        .filter((match) => match.matched)
        .map(requirementKey),
    ),
    requirements,
  );
}

/** Gap report from each applicant's matched "type|label" keys, as stored on the application. */
export function buildPoolGapReportFromKeys(
  matchedKeysPerApplicant: string[][],
  requirements: JobRequirementInput[],
): PoolGapReport {
  const poolSize = matchedKeysPerApplicant.length;
  const counts = new Map<string, number>();
  for (const keys of matchedKeysPerApplicant) {
    for (const key of new Set(keys)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const rows: PoolGapRow[] = requirements.map((req) => {
    const matchedCount = counts.get(requirementKey(req)) ?? 0;

    return {
      label: req.label,
      type: req.type,
      category: req.category,
      matchedCount,
      poolSize,
      coveragePercent:
        poolSize === 0 ? 0 : Math.round((matchedCount / poolSize) * 100),
    };
  });

  rows.sort((a, b) => {
    if (a.type === "required" && b.type !== "required") return -1;
    if (a.type !== "required" && b.type === "required") return 1;
    if (a.coveragePercent !== b.coveragePercent) {
      return a.coveragePercent - b.coveragePercent;
    }
    return a.label.localeCompare(b.label);
  });

  return { poolSize, rows };
}
