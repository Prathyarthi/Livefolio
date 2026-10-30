import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  buildApplicationSnapshot,
  snapshotAsJson,
} from "@/features/applications/lib/snapshot";
import {
  requireWorkspaceApplicantManager,
  requireWorkspaceApplicantViewer,
} from "@/features/organization/lib/org-access";
import {
  isPipelineStage,
  statusForStage,
  type PipelineStage,
} from "@/features/applications/lib/pipeline";
import { summarizeSnapshot } from "@/features/applications/lib/applicant-summary";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { latestResumeIdsByUserId } from "@/features/uploads/server/stored-files";
import type { ApplicantSearchFilters } from "@/features/applications/lib/search";
import { buildApplicantEvidence } from "@/features/applications/lib/evidence";
import { attachRank } from "@/features/applications/lib/rank";
import {
  buildSearchIndexFields,
  searchIndexKey,
} from "@/features/applications/lib/search-index";
import { loadApplicantPoolPage } from "@/features/applications/server/applicant-pool";
import { refreshStaleSearchIndex } from "@/features/applications/server/search-index";
import { isProofKind } from "@/features/search/lib/proof";
import { interpretSearchQuery, parseSearchSort } from "@/features/search/lib/query";
import { RANKING_VERSION, rankAgainstJob } from "@/features/search/lib/rank";
import { refreshJobSearchProfile } from "@/features/jobs/lib/extract-search-profile";
import { listNamedVouchesForUser } from "@/features/vouches/lib/public";
import { parseJobSearchProfile } from "@/features/jobs/lib/search-profile";
import { parsePageParams } from "@/lib/pagination";

/** Stale rows re-scored per pool request; the client polls while `indexing.pending > 0`. */
const INDEX_PER_REQUEST = 300;
import {
  parseScreeningAnswers,
  parseScreeningQuestions,
  validateScreeningAnswers,
} from "@/features/jobs/lib/screening-questions";

function optionalTrim(value?: string | null) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const candidateApplicationInclude = {
  job: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      location: true,
      employmentType: true,
      workplaceType: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          bannerUrl: true,
          brandColor: true,
        },
      },
    },
  },
  snapshot: {
    select: {
      id: true,
      createdAt: true,
      data: true,
    },
  },
} as const;

const companyApplicationInclude = {
  snapshot: {
    select: {
      id: true,
      createdAt: true,
      data: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  },
  notes: {
    orderBy: { createdAt: "desc" as const },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
    },
  },
  job: {
    select: {
      id: true,
      title: true,
      slug: true,
      organizationId: true,
      requirements: { orderBy: { sortOrder: "asc" as const } },
    },
  },
} as const;

async function loadJobForCompany(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      organizationId: true,
      workspaceId: true,
      organization: {
        select: { id: true, name: true, slug: true },
      },
      workspace: {
        select: { id: true, name: true, slug: true },
      },
      requirements: { orderBy: { sortOrder: "asc" as const } },
    },
  });
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseSearchFilters(query: Record<string, string | undefined>): ApplicantSearchFilters {
  return {
    q: query.q?.trim() || undefined,
    location: query.location?.trim() || undefined,
    skill: query.skill?.trim() || undefined,
    role: query.role?.trim() || undefined,
    education: query.education?.trim() || undefined,
    minExperience: parseOptionalNumber(query.minExperience),
    maxExperience: parseOptionalNumber(query.maxExperience),
    appliedAfter: query.appliedAfter?.trim() || undefined,
    appliedBefore: query.appliedBefore?.trim() || undefined,
    proof: isProofKind(query.proof) ? query.proof : undefined,
  };
}

function parseSnapshot(data: unknown): ApplicationSnapshotData | null {
  if (!data || typeof data !== "object") return null;
  return data as ApplicationSnapshotData;
}

export const applications = new Elysia({ prefix: "/applications" })
  // Candidate: list my applications
  .get(
    "/mine",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const where = { userId: session.userId };
      const { page: requestedPage, pageSize } = parsePageParams(ctx.query);
      const total = await prisma.application.count({ where });
      const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
      const page = Math.min(requestedPage, pageCount);

      const applications = await prisma.application.findMany({
        where,
        include: candidateApplicationInclude,
        orderBy: [{ submittedAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return { applications, total, page, pageSize, pageCount };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        pageSize: t.Optional(t.String()),
      }),
    },
  )

  // Candidate: get one application (never includes recruiter notes)
  .get("/mine/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const application = await prisma.application.findFirst({
      where: { id: ctx.params.id, userId: session.userId },
      include: candidateApplicationInclude,
    });

    if (!application) {
      ctx.set.status = 404;
      return { error: "Application not found" };
    }

    return application;
  })

  // Candidate: preview what would be shared (before submit)
  .get("/preview/:jobSlug", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const job = await prisma.job.findUnique({
      where: { slug: ctx.params.jobSlug },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        screeningQuestions: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            bannerUrl: true,
          },
        },
      },
    });

    if (!job || job.status !== "published") {
      ctx.set.status = 404;
      return { error: "Job not found or not open for applications" };
    }

    const existing = await prisma.application.findUnique({
      where: {
        jobId_userId: { jobId: job.id, userId: session.userId },
      },
      select: { id: true, submittedAt: true, status: true },
    });

    const snapshot = await buildApplicationSnapshot(session.userId);
    if (!snapshot) {
      ctx.set.status = 400;
      return {
        error: "Create your Livefolio before applying",
        code: "NO_PORTFOLIO",
      };
    }

    return {
      job: {
        ...job,
        screeningQuestions: parseScreeningQuestions(job.screeningQuestions),
      },
      alreadyApplied: Boolean(existing),
      existingApplication: existing,
      snapshot: snapshot.data,
      portfolioId: snapshot.portfolioId,
    };
  })

  // Candidate: submit application
  .post(
    "/apply/:jobSlug",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const job = await prisma.job.findUnique({
        where: { slug: ctx.params.jobSlug },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          applicationDeadline: true,
          screeningQuestions: true,
          searchProfile: true,
          requirements: { orderBy: { sortOrder: "asc" as const } },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              bannerUrl: true,
            },
          },
        },
      });

      if (!job || job.status !== "published") {
        ctx.set.status = 404;
        return { error: "Job not found or not open for applications" };
      }

      if (
        job.applicationDeadline &&
        job.applicationDeadline.getTime() < Date.now()
      ) {
        ctx.set.status = 400;
        return { error: "The application deadline has passed" };
      }

      const existing = await prisma.application.findUnique({
        where: {
          jobId_userId: { jobId: job.id, userId: session.userId },
        },
        select: { id: true },
      });

      if (existing) {
        ctx.set.status = 409;
        return { error: "You have already applied to this job" };
      }

      const snapshot = await buildApplicationSnapshot(session.userId);
      if (!snapshot) {
        ctx.set.status = 400;
        return {
          error: "Create your Livefolio before applying",
          code: "NO_PORTFOLIO",
        };
      }

      const screeningQuestions = parseScreeningQuestions(job.screeningQuestions);
      const screening = validateScreeningAnswers(
        screeningQuestions,
        ctx.body.screeningAnswers,
      );
      if (!screening.ok) {
        ctx.set.status = 400;
        return { error: screening.error };
      }

      const coverNote = optionalTrim(ctx.body.coverNote);
      const applicant = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true },
      });
      // Stored profile only: a submit burst must not trigger AI extraction. A stale
      // profile hash makes the pool re-score this row later.
      const storedProfile = parseJobSearchProfile(job.searchProfile);
      const searchIndex = buildSearchIndexFields(snapshot.data, {
        key: searchIndexKey(storedProfile, job.requirements),
        profile: storedProfile,
        requirements: job.requirements,
        name: applicant?.name,
        email: applicant?.email,
        coverNote,
      });

      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          userId: session.userId,
          portfolioId: snapshot.portfolioId,
          coverNote,
          screeningAnswers: screening.answers,
          status: "applied",
          stage: "new",
          ...searchIndex,
          snapshot: {
            create: {
              data: snapshotAsJson(snapshot.data),
            },
          },
        },
        include: candidateApplicationInclude,
      });

      return application;
    },
    {
      body: t.Object({
        coverNote: t.Optional(t.String({ maxLength: 5000 })),
        screeningAnswers: t.Optional(t.Any()),
      }),
    },
  )

  // Company: applicant pool for a job
  .get("/job/:jobId", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const job = await loadJobForCompany(ctx.params.jobId);
    if (!job) {
      ctx.set.status = 404;
      return { error: "Job not found" };
    }

    const membership = await requireWorkspaceApplicantViewer(
      job.organizationId,
      job.workspaceId,
      session.userId,
    );
    if (!membership) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    const stageFilter =
      ctx.query.stage && isPipelineStage(ctx.query.stage)
        ? ctx.query.stage
        : undefined;
    const searchFilters = parseSearchFilters(ctx.query);
    const sort = parseSearchSort(ctx.query.sort);
    const { page: requestedPage, pageSize } = parsePageParams(ctx.query);

    const searchProfile = await refreshJobSearchProfile(job.id);
    const index = await refreshStaleSearchIndex(
      job,
      searchProfile,
      INDEX_PER_REQUEST,
    );

    const [pool, stageGroups] = await Promise.all([
      loadApplicantPoolPage({
        job,
        profile: searchProfile,
        stage: stageFilter,
        filters: searchFilters,
        sort,
        page: requestedPage,
        pageSize,
      }),
      prisma.application.groupBy({
        by: ["stage"],
        where: { jobId: job.id },
        _count: { _all: true },
      }),
    ]);

    const stageCounts: Record<string, number> = {
      all: 0,
      new: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
    };
    for (const row of stageGroups) {
      stageCounts.all += row._count._all;
      stageCounts[row.stage] = row._count._all;
    }

    return {
      job: {
        id: job.id,
        title: job.title,
        slug: job.slug,
        status: job.status,
        organizationId: job.organizationId,
        organization: job.organization,
        requirements: job.requirements,
      },
      stageCounts,
      matchedCount: pool.matchedCount,
      truncated: pool.truncated,
      page: pool.page,
      pageSize: pool.pageSize,
      pageCount: pool.pageCount,
      filters: searchFilters,
      sort,
      rankingVersion: RANKING_VERSION,
      indexing: { pending: index.pending },
      interpreted: interpretSearchQuery(searchFilters.q),
      facets: pool.facets,
      gaps: pool.gaps,
      applicants: pool.applicants,
    };
  })

  // Company: applicant detail
  .get("/job/:jobId/:applicationId", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const job = await loadJobForCompany(ctx.params.jobId);
    if (!job) {
      ctx.set.status = 404;
      return { error: "Job not found" };
    }

    const membership = await requireWorkspaceApplicantViewer(
      job.organizationId,
      job.workspaceId,
      session.userId,
    );
    if (!membership) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    const application = await prisma.application.findFirst({
      where: {
        id: ctx.params.applicationId,
        jobId: job.id,
      },
      include: companyApplicationInclude,
    });

    if (!application) {
      ctx.set.status = 404;
      return { error: "Application not found" };
    }

    const snapshot = parseSnapshot(application.snapshot?.data);
    const summary = summarizeSnapshot(snapshot);
    const searchProfile = await refreshJobSearchProfile(job.id);
    const rank = rankAgainstJob(snapshot, searchProfile, {
      name: application.user.name,
      email: application.user.email,
      coverNote: application.coverNote,
      freshnessAt: application.submittedAt,
    });
    const evidence = attachRank(
      buildApplicantEvidence(snapshot, job.requirements),
      rank,
    );

    const [resumeByUser, vouches] = await Promise.all([
      latestResumeIdsByUserId([application.user.id]),
      listNamedVouchesForUser(application.user.id),
    ]);

    return {
      id: application.id,
      stage: application.stage,
      status: application.status,
      shortlisted: application.stage === "shortlisted",
      shortlistedAt: application.shortlistedAt,
      coverNote: application.coverNote,
      screeningAnswers: parseScreeningAnswers(application.screeningAnswers),
      submittedAt: application.submittedAt,
      user: application.user,
      resumeFileId: resumeByUser.get(application.user.id) ?? null,
      notes: application.notes,
      job: {
        ...job,
        requirements: application.job.requirements,
      },
      summary: {
        ...summary,
        name:
          summary.name !== "Candidate"
            ? summary.name
            : application.user.name || "Candidate",
        avatarUrl: summary.avatarUrl || application.user.avatar,
      },
      snapshotData: snapshot,
      evidence,
      vouches,
    };
  })

  // Company: move pipeline stage
  .patch(
    "/job/:jobId/:applicationId/stage",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const job = await loadJobForCompany(ctx.params.jobId);
      if (!job) {
        ctx.set.status = 404;
        return { error: "Job not found" };
      }

      const membership = await requireWorkspaceApplicantManager(
        job.organizationId,
        job.workspaceId,
        session.userId,
      );
      if (!membership) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      if (!isPipelineStage(ctx.body.stage)) {
        ctx.set.status = 400;
        return { error: "Invalid stage" };
      }

      const stage = ctx.body.stage as PipelineStage;
      const existing = await prisma.application.findFirst({
        where: { id: ctx.params.applicationId, jobId: job.id },
        select: { id: true },
      });
      if (!existing) {
        ctx.set.status = 404;
        return { error: "Application not found" };
      }

      const updated = await prisma.application.update({
        where: { id: existing.id },
        data: {
          stage,
          status: statusForStage(stage),
          shortlisted: stage === "shortlisted",
          shortlistedAt: stage === "shortlisted" ? new Date() : null,
        },
        select: {
          id: true,
          stage: true,
          status: true,
          shortlisted: true,
          shortlistedAt: true,
          updatedAt: true,
        },
      });

      return updated;
    },
    {
      body: t.Object({
        stage: t.String(),
      }),
    },
  )

  // Company: toggle shortlist
  .patch(
    "/job/:jobId/:applicationId/shortlist",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const job = await loadJobForCompany(ctx.params.jobId);
      if (!job) {
        ctx.set.status = 404;
        return { error: "Job not found" };
      }

      const membership = await requireWorkspaceApplicantManager(
        job.organizationId,
        job.workspaceId,
        session.userId,
      );
      if (!membership) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      const existing = await prisma.application.findFirst({
        where: { id: ctx.params.applicationId, jobId: job.id },
        select: { id: true, stage: true },
      });
      if (!existing) {
        ctx.set.status = 404;
        return { error: "Application not found" };
      }

      const shortlisted = Boolean(ctx.body.shortlisted);
      const nextStage: PipelineStage = shortlisted
        ? "shortlisted"
        : existing.stage === "shortlisted"
          ? "reviewing"
          : (existing.stage as PipelineStage);

      const updated = await prisma.application.update({
        where: { id: existing.id },
        data: {
          shortlisted,
          shortlistedAt: shortlisted ? new Date() : null,
          stage: nextStage,
          status: statusForStage(nextStage),
        },
        select: {
          id: true,
          stage: true,
          status: true,
          shortlisted: true,
          shortlistedAt: true,
          updatedAt: true,
        },
      });

      return updated;
    },
    {
      body: t.Object({
        shortlisted: t.Boolean(),
      }),
    },
  )

  // Company: add private recruiter note
  .post(
    "/job/:jobId/:applicationId/notes",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const job = await loadJobForCompany(ctx.params.jobId);
      if (!job) {
        ctx.set.status = 404;
        return { error: "Job not found" };
      }

      const membership = await requireWorkspaceApplicantManager(
        job.organizationId,
        job.workspaceId,
        session.userId,
      );
      if (!membership) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      const body = optionalTrim(ctx.body.body);
      if (!body) {
        ctx.set.status = 400;
        return { error: "Note cannot be empty" };
      }

      const existing = await prisma.application.findFirst({
        where: { id: ctx.params.applicationId, jobId: job.id },
        select: { id: true },
      });
      if (!existing) {
        ctx.set.status = 404;
        return { error: "Application not found" };
      }

      const note = await prisma.recruiterNote.create({
        data: {
          applicationId: existing.id,
          authorId: session.userId,
          body,
        },
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });

      return note;
    },
    {
      body: t.Object({
        body: t.String({ minLength: 1, maxLength: 5000 }),
      }),
    },
  )

  // Company: author or workspace hiring manager can delete a note
  .delete("/job/:jobId/:applicationId/notes/:noteId", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const job = await loadJobForCompany(ctx.params.jobId);
    if (!job) {
      ctx.set.status = 404;
      return { error: "Job not found" };
    }

    const membership = await requireWorkspaceApplicantManager(
      job.organizationId,
      job.workspaceId,
      session.userId,
    );
    if (!membership) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    const note = await prisma.recruiterNote.findFirst({
      where: {
        id: ctx.params.noteId,
        applicationId: ctx.params.applicationId,
        application: { jobId: job.id },
      },
      select: { id: true },
    });

    if (!note) {
      ctx.set.status = 404;
      return { error: "Note not found" };
    }

    await prisma.recruiterNote.delete({ where: { id: note.id } });
    return { ok: true };
  });
