import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { summarizeSnapshot } from "@/features/applications/lib/applicant-summary";
import {
  buildApplicantEvidence,
  type ApplicantEvidenceSummary,
} from "@/features/applications/lib/evidence";
import { attachRank } from "@/features/applications/lib/rank";
import {
  applicantPoolWhere,
  filterApplicantsBySearch,
  type ApplicantSearchFilters,
  type JobRequirementInput,
} from "@/features/applications/lib/search";
import { buildPoolGapReportFromKeys } from "@/features/applications/lib/pool-gaps";
import type { JobSearchProfile } from "@/features/jobs/lib/search-profile";
import { buildFacetsFromFields } from "@/features/search/lib/facets";
import { interpretSearchQuery, type SearchSort } from "@/features/search/lib/query";
import { rankCandidate } from "@/features/search/lib/rank";
import { latestResumeIdsByUserId } from "@/features/uploads/server/stored-files";
import { paginateSlice } from "@/lib/pagination";
import { countNamedVouchesByUserIds } from "@/features/vouches/lib/public";

/** Text searches re-rank in memory, so they read at most this many snapshots. */
export const POOL_RECALL_CAP = 500;

const facetSelect = {
  skillNames: true,
  locationLabel: true,
  yearsExperience: true,
  proofKinds: true,
} satisfies Prisma.ApplicationSelect;

const cardSelect = {
  id: true,
  stage: true,
  status: true,
  shortlistedAt: true,
  submittedAt: true,
  coverNote: true,
  searchSummary: true,
  searchEvidence: true,
  user: { select: { id: true, name: true, email: true, avatar: true } },
  _count: { select: { notes: true } },
} satisfies Prisma.ApplicationSelect;

type CardRow = Prisma.ApplicationGetPayload<{ select: typeof cardSelect }>;
type ApplicantSummary = ReturnType<typeof summarizeSnapshot>;

function orderFor(sort: SearchSort): Prisma.ApplicationOrderByWithRelationInput[] {
  return sort === "recent"
    ? [{ submittedAt: "desc" }, { id: "asc" }]
    : [{ rankScore: "desc" }, { submittedAt: "desc" }, { id: "asc" }];
}

function toCard(
  row: CardRow,
  requirements: JobRequirementInput[],
  resumeFileId: string | null,
  evidenceOverride?: ApplicantEvidenceSummary,
  vouchCount = 0,
) {
  const summary =
    (row.searchSummary as ApplicantSummary | null) ?? summarizeSnapshot(null);
  const evidence =
    evidenceOverride ??
    (row.searchEvidence as ApplicantEvidenceSummary | null) ??
    buildApplicantEvidence(null, requirements);
  return {
    id: row.id,
    stage: row.stage,
    status: row.status,
    shortlisted: row.stage === "shortlisted",
    shortlistedAt: row.shortlistedAt,
    submittedAt: row.submittedAt,
    coverNote: row.coverNote,
    noteCount: row._count.notes,
    user: row.user,
    resumeFileId,
    evidence,
    vouchCount,
    summary: {
      ...summary,
      name: summary.name !== "Candidate" ? summary.name : row.user.name || "Candidate",
      avatarUrl: summary.avatarUrl || row.user.avatar,
    },
  };
}

async function resumesFor(rows: CardRow[]) {
  return latestResumeIdsByUserId(rows.map((row) => row.user.id));
}

/**
 * One page of a job's applicant pool. Column-only filters page in SQL over stored
 * scores; text searches recall a capped candidate set in SQL and re-rank it in memory.
 */
export async function loadApplicantPoolPage(input: {
  job: { id: string; requirements: JobRequirementInput[] };
  profile: JobSearchProfile | null;
  stage: string | undefined;
  filters: ApplicantSearchFilters;
  sort: SearchSort;
  page: number;
  pageSize: number;
}) {
  const { job, profile, stage, filters, sort, page, pageSize } = input;
  const { where, exact } = applicantPoolWhere(job.id, stage, filters);

  const gapRows = prisma.application.findMany({
    where: { jobId: job.id, ...(stage ? { stage } : {}) },
    select: { matchedRequirements: true },
  });

  if (exact) {
    const [matches, gapSource] = await Promise.all([
      prisma.application.findMany({
        where,
        select: { id: true, ...facetSelect },
        orderBy: orderFor(sort),
      }),
      gapRows,
    ]);
    const paged = paginateSlice(matches, page, pageSize);
    const ids = paged.items.map((row) => row.id);
    const rows = await prisma.application.findMany({
      where: { id: { in: ids } },
      select: cardSelect,
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    const ordered = ids.map((id) => byId.get(id)).filter((row): row is CardRow => Boolean(row));
    const [resumes, vouchCounts] = await Promise.all([
      resumesFor(ordered),
      countNamedVouchesByUserIds(ordered.map((row) => row.user.id)),
    ]);

    return {
      matchedCount: matches.length,
      truncated: false,
      page: paged.page,
      pageSize: paged.pageSize,
      pageCount: paged.pageCount,
      facets: buildFacetsFromFields(matches),
      gaps: buildPoolGapReportFromKeys(
        gapSource.map((row) => row.matchedRequirements),
        job.requirements,
      ),
      applicants: ordered.map((row) =>
        toCard(
          row,
          job.requirements,
          resumes.get(row.user.id) ?? null,
          undefined,
          vouchCounts.get(row.user.id) ?? 0,
        ),
      ),
    };
  }

  const [recalled, gapSource] = await Promise.all([
    prisma.application.findMany({
      where,
      select: { ...cardSelect, ...facetSelect, snapshot: { select: { data: true } } },
      orderBy: orderFor(sort),
      take: POOL_RECALL_CAP + 1,
    }),
    gapRows,
  ]);
  const truncated = recalled.length > POOL_RECALL_CAP;
  const interpreted = interpretSearchQuery(filters.q);

  const matched = filterApplicantsBySearch(
    recalled.slice(0, POOL_RECALL_CAP).map((row) => ({
      ...row,
      snapshot: (row.snapshot?.data as ApplicationSnapshotData | undefined) ?? null,
    })),
    filters,
  ).map((row) => {
    const rank = rankCandidate(row.snapshot, {
      jobProfile: profile,
      query: interpreted,
      extras: { name: row.user.name, email: row.user.email, coverNote: row.coverNote },
    });
    return { row, rank };
  });

  if (sort === "relevance") {
    matched.sort(
      (a, b) =>
        b.rank.score - a.rank.score ||
        b.row.submittedAt.getTime() - a.row.submittedAt.getTime(),
    );
  }

  const paged = paginateSlice(matched, page, pageSize);
  const pageRows = paged.items.map((item) => item.row);
  const [resumes, vouchCounts] = await Promise.all([
    resumesFor(pageRows),
    countNamedVouchesByUserIds(pageRows.map((row) => row.user.id)),
  ]);

  return {
    matchedCount: matched.length,
    truncated,
    page: paged.page,
    pageSize: paged.pageSize,
    pageCount: paged.pageCount,
    facets: buildFacetsFromFields(matched.map((item) => item.row)),
    gaps: buildPoolGapReportFromKeys(
      gapSource.map((row) => row.matchedRequirements),
      job.requirements,
    ),
    applicants: paged.items.map(({ row, rank }) => {
      const stored =
        (row.searchEvidence as ApplicantEvidenceSummary | null) ??
        buildApplicantEvidence(row.snapshot, job.requirements);
      return toCard(
        row,
        job.requirements,
        resumes.get(row.user.id) ?? null,
        attachRank(stored, rank),
        vouchCounts.get(row.user.id) ?? 0,
      );
    }),
  };
}
