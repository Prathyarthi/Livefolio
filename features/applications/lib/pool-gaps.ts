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
  const poolSize = applicants.length;
  const rows: PoolGapRow[] = requirements.map((req) => {
    const matchedCount = applicants.filter((applicant) =>
      applicant.evidence.requirementMatches.some(
        (match) =>
          match.label === req.label &&
          match.type === req.type &&
          match.matched,
      ),
    ).length;

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
