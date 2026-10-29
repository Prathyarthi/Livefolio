import { prisma } from "@/lib/prisma";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import type { JobRequirementInput } from "@/features/applications/lib/search";
import {
  buildSearchIndexFields,
  searchIndexKey,
} from "@/features/applications/lib/search-index";
import type { JobSearchProfile } from "@/features/jobs/lib/search-profile";

const BATCH_SIZE = 100;

function staleWhere(jobId: string, key: string) {
  return {
    jobId,
    OR: [{ searchKey: null }, { searchKey: { not: key } }],
  };
}

/**
 * Re-score applications whose stored search fields are out of date, at most
 * `limit` per call so a request or cron tick stays bounded. Returns how many
 * are still pending; callers keep calling until it reaches zero.
 */
export async function refreshStaleSearchIndex(
  job: { id: string; requirements: JobRequirementInput[] },
  profile: JobSearchProfile | null,
  limit: number,
): Promise<{ key: string; pending: number }> {
  const key = searchIndexKey(profile, job.requirements);
  let processed = 0;

  while (processed < limit) {
    const rows = await prisma.application.findMany({
      where: staleWhere(job.id, key),
      select: {
        id: true,
        coverNote: true,
        user: { select: { name: true, email: true } },
        snapshot: { select: { data: true } },
      },
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
      take: Math.min(BATCH_SIZE, limit - processed),
    });
    if (rows.length === 0) break;

    const batch = rows.map((row) => ({
      id: row.id,
      ...buildSearchIndexFields(
        (row.snapshot?.data as ApplicationSnapshotData | undefined) ?? null,
        {
          key,
          profile,
          requirements: job.requirements,
          name: row.user.name,
          email: row.user.email,
          coverNote: row.coverNote,
        },
      ),
    }));
    // A single statement per batch: per-row updates in one transaction can outlive Prisma's 5s transaction timeout.
    await prisma.$executeRaw`
      UPDATE applications AS a SET
        "searchKey" = x."searchKey",
        "rankScore" = x."rankScore",
        "rankReasons" = x."rankReasons",
        "searchText" = x."searchText",
        "searchSummary" = x."searchSummary",
        "searchEvidence" = x."searchEvidence",
        "matchedRequirements" = x."matchedRequirements",
        "yearsExperience" = x."yearsExperience",
        "proofKinds" = x."proofKinds",
        "skillNames" = x."skillNames",
        "locationLabel" = x."locationLabel"
      FROM jsonb_to_recordset(${JSON.stringify(batch)}::jsonb) AS x(
        id text,
        "searchKey" text,
        "rankScore" int,
        "rankReasons" text[],
        "searchText" text,
        "searchSummary" jsonb,
        "searchEvidence" jsonb,
        "matchedRequirements" text[],
        "yearsExperience" int,
        "proofKinds" text[],
        "skillNames" text[],
        "locationLabel" text
      )
      WHERE a.id = x.id AND a."jobId" = ${job.id}
    `;
    processed += rows.length;
  }

  const pending = await prisma.application.count({
    where: staleWhere(job.id, key),
  });
  return { key, pending };
}
