import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  buildApplicationSnapshot,
  snapshotAsJson,
} from "@/features/applications/lib/snapshot";
import {
  requireApplicantManager,
  requireApplicantViewer,
} from "@/features/organization/lib/org-access";
import {
  isPipelineStage,
  statusForStage,
  type PipelineStage,
} from "@/features/applications/lib/pipeline";
import { summarizeSnapshot } from "@/features/applications/lib/applicant-summary";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import {
  filterApplicantsBySearch,
  type ApplicantSearchFilters,
} from "@/features/applications/lib/search";
import { buildApplicantEvidence } from "@/features/applications/lib/evidence";

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
      organization: {
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
  };
}

function parseSnapshot(data: unknown): ApplicationSnapshotData | null {
  if (!data || typeof data !== "object") return null;
  return data as ApplicationSnapshotData;
}

export const applications = new Elysia({ prefix: "/applications" })
  // Candidate: list my applications
  .get("/mine", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const list = await prisma.application.findMany({
      where: { userId: session.userId },
      include: candidateApplicationInclude,
      orderBy: { submittedAt: "desc" },
    });

    return list;
  })

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
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
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
      job,
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
          organization: {
            select: { id: true, name: true, slug: true, logoUrl: true },
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

      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          userId: session.userId,
          portfolioId: snapshot.portfolioId,
          coverNote: optionalTrim(ctx.body.coverNote),
          status: "applied",
          stage: "new",
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

    const membership = await requireApplicantViewer(
      job.organizationId,
      session.userId,
    );
    if (!membership) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    const stageFilter = ctx.query.stage;
    const searchFilters = parseSearchFilters(ctx.query);

    const where = {
      jobId: job.id,
      ...(stageFilter && isPipelineStage(stageFilter)
        ? { stage: stageFilter }
        : {}),
    };

    const [applications, stageGroups] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          snapshot: { select: { data: true } },
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          _count: { select: { notes: true } },
        },
        orderBy: [{ submittedAt: "desc" }],
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

    const enriched = applications.map((app) => {
      const snapshot = parseSnapshot(app.snapshot?.data);
      const summary = summarizeSnapshot(snapshot);
      const evidence = buildApplicantEvidence(snapshot, job.requirements);
      return {
        id: app.id,
        stage: app.stage,
        status: app.status,
        shortlisted: app.stage === "shortlisted",
        shortlistedAt: app.shortlistedAt,
        submittedAt: app.submittedAt,
        coverNote: app.coverNote,
        noteCount: app._count.notes,
        user: app.user,
        snapshot,
        evidence,
        summary: {
          ...summary,
          name:
            summary.name !== "Candidate"
              ? summary.name
              : app.user.name || "Candidate",
          avatarUrl: summary.avatarUrl || app.user.avatar,
        },
      };
    });

    const filtered = filterApplicantsBySearch(enriched, searchFilters).sort(
      (a, b) => {
        const reqDiff =
          b.evidence.matchedRequired - a.evidence.matchedRequired;
        if (reqDiff !== 0) return reqDiff;
        const prefDiff =
          b.evidence.matchedPreferred - a.evidence.matchedPreferred;
        if (prefDiff !== 0) return prefDiff;
        return (
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
      },
    );

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
      matchedCount: filtered.length,
      filters: searchFilters,
      applicants: filtered.map(({ snapshot: _snapshot, ...rest }) => rest),
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

    const membership = await requireApplicantViewer(
      job.organizationId,
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
    const evidence = buildApplicantEvidence(snapshot, job.requirements);

    return {
      id: application.id,
      stage: application.stage,
      status: application.status,
      shortlisted: application.stage === "shortlisted",
      shortlistedAt: application.shortlistedAt,
      coverNote: application.coverNote,
      submittedAt: application.submittedAt,
      user: application.user,
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

      const membership = await requireApplicantManager(
        job.organizationId,
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

      const membership = await requireApplicantManager(
        job.organizationId,
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

      const membership = await requireApplicantManager(
        job.organizationId,
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

  // Company: delete own note (or any note if manager — keep simple: author or manager)
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

    const membership = await requireApplicantManager(
      job.organizationId,
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
