import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createUniqueJobPublicId } from "@/features/jobs/lib/slug-server";
import { requireJobManager, requireOrgMember } from "@/features/organization/lib/org-access";
import {
  orgUpgradeMessage,
  resolveOrgAccess,
} from "@/lib/org-entitlements";
import { deleteObjectQuiet, isR2Configured } from "@/lib/r2";

const OPEN_JOB_STATUSES = new Set(["published", "paused"]);

async function assertCanOpenJob(
  organizationId: string,
  opts?: { excludeJobId?: string },
) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      slug: true,
      subscriptionStatus: true,
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: true,
    },
  });
  if (!org) return { ok: false as const, status: 404 as const, body: { error: "Organization not found" } };

  const openJobCount = await prisma.job.count({
    where: {
      organizationId,
      status: { in: ["published", "paused"] },
      ...(opts?.excludeJobId ? { id: { not: opts.excludeJobId } } : {}),
    },
  });
  const access = await resolveOrgAccess(org, openJobCount);
  if (!access.canPublishMoreJobs) {
    return {
      ok: false as const,
      status: 402 as const,
      body: {
        error: orgUpgradeMessage("job"),
        upgradeRequired: true,
        upgradeOrgSlug: org.slug,
      },
    };
  }
  return { ok: true as const };
}

const JOB_STATUSES = ["draft", "published", "paused", "closed"] as const;
const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
] as const;
const WORKPLACE_TYPES = ["remote", "hybrid", "on_site"] as const;
const REQUIREMENT_TYPES = ["required", "preferred"] as const;
const REQUIREMENT_CATEGORIES = [
  "skill",
  "experience",
  "education",
  "other",
] as const;

const jobPublicInclude = {
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      brandColor: true,
      description: true,
      websiteUrl: true,
      location: true,
    },
  },
  requirements: { orderBy: { sortOrder: "asc" as const } },
} as const;

const jobCompanyInclude = {
  ...jobPublicInclude,
  _count: { select: { applications: true } },
  storedFiles: {
    where: { kind: "job_source" },
    select: {
      id: true,
      contentType: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} as const;

function optionalTrim(value?: string | null) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toOptionalDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function toOptionalInt(value?: number | null) {
  if (value == null) return null;
  if (!Number.isFinite(value)) return null;
  return Math.trunc(value);
}

type RequirementInput = {
  type: string;
  category?: string;
  label: string;
  description?: string | null;
  sortOrder?: number;
};

async function replaceRequirements(
  jobId: string,
  requirements: RequirementInput[] | undefined,
) {
  if (requirements === undefined) return;

  await prisma.jobRequirement.deleteMany({ where: { jobId } });

  if (requirements.length === 0) return;

  await prisma.jobRequirement.createMany({
    data: requirements.map((r, index) => ({
      jobId,
      type: r.type,
      category: r.category ?? "skill",
      label: r.label.trim(),
      description: optionalTrim(r.description),
      sortOrder: r.sortOrder ?? index,
    })),
  });
}

export const jobs = new Elysia({ prefix: "/jobs" })
  // Public: get published job by slug
  .get("/public/:slug", async (ctx) => {
    const job = await prisma.job.findUnique({
      where: { slug: ctx.params.slug },
      include: jobPublicInclude,
    });

    if (!job || (job.status !== "published" && job.status !== "paused")) {
      ctx.set.status = 404;
      return { error: "Job not found" };
    }

    return job;
  })

  // Company: list jobs for an organization
  .get("/org/:orgSlug", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const org = await prisma.organization.findUnique({
      where: { slug: ctx.params.orgSlug },
      select: { id: true },
    });
    if (!org) {
      ctx.set.status = 404;
      return { error: "Organization not found" };
    }

    const membership = await requireOrgMember(org.id, session.userId);
    if (!membership) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    const status = ctx.query.status;
    const jobsList = await prisma.job.findMany({
      where: {
        organizationId: org.id,
        ...(status ? { status } : {}),
      },
      include: jobCompanyInclude,
      orderBy: [{ updatedAt: "desc" }],
    });

    return jobsList;
  })

  // Company: get job by id (member)
  .get("/id/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const job = await prisma.job.findUnique({
      where: { id: ctx.params.id },
      include: jobCompanyInclude,
    });
    if (!job) {
      ctx.set.status = 404;
      return { error: "Job not found" };
    }

    const membership = await requireOrgMember(
      job.organizationId,
      session.userId,
    );
    if (!membership) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    return job;
  })

  // Company: create job
  .post(
    "/org/:orgSlug",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const org = await prisma.organization.findUnique({
        where: { slug: ctx.params.orgSlug },
        select: { id: true },
      });
      if (!org) {
        ctx.set.status = 404;
        return { error: "Organization not found" };
      }

      const membership = await requireJobManager(org.id, session.userId);
      if (!membership) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      const title = ctx.body.title.trim();
      if (!title) {
        ctx.set.status = 400;
        return { error: "Job title is required" };
      }

      // Opaque public id — not derived from title (titles collide across companies)
      const slug = await createUniqueJobPublicId();

      const resolvedStatus = (ctx.body.status ?? "draft") as
        | "draft"
        | "published"
        | "paused"
        | "closed";
      if (!(JOB_STATUSES as readonly string[]).includes(resolvedStatus)) {
        ctx.set.status = 400;
        return { error: "Invalid status" };
      }

      if (OPEN_JOB_STATUSES.has(resolvedStatus)) {
        const gate = await assertCanOpenJob(org.id);
        if (!gate.ok) {
          ctx.set.status = gate.status;
          return gate.body;
        }
      }

      const job = await prisma.job.create({
        data: {
          organizationId: org.id,
          createdById: session.userId,
          title,
          slug,
          description: ctx.body.description.trim(),
          department: optionalTrim(ctx.body.department),
          employmentType: optionalTrim(ctx.body.employmentType),
          location: optionalTrim(ctx.body.location),
          workplaceType: optionalTrim(ctx.body.workplaceType),
          experienceMin: toOptionalInt(ctx.body.experienceMin),
          experienceMax: toOptionalInt(ctx.body.experienceMax),
          salaryMin: toOptionalInt(ctx.body.salaryMin),
          salaryMax: toOptionalInt(ctx.body.salaryMax),
          salaryCurrency: optionalTrim(ctx.body.salaryCurrency) ?? "USD",
          responsibilities: optionalTrim(ctx.body.responsibilities),
          qualifications: optionalTrim(ctx.body.qualifications),
          benefits: optionalTrim(ctx.body.benefits),
          applicationDeadline: toOptionalDate(ctx.body.applicationDeadline),
          status: resolvedStatus,
          publishedAt: resolvedStatus === "published" ? new Date() : null,
        },
        include: jobCompanyInclude,
      });

      await replaceRequirements(job.id, ctx.body.requirements);

      return prisma.job.findUniqueOrThrow({
        where: { id: job.id },
        include: jobCompanyInclude,
      });
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        description: t.String({ minLength: 1, maxLength: 50000 }),
        department: t.Optional(t.String({ maxLength: 120 })),
        employmentType: t.Optional(
          t.Union(EMPLOYMENT_TYPES.map((v) => t.Literal(v))),
        ),
        location: t.Optional(t.String({ maxLength: 200 })),
        workplaceType: t.Optional(
          t.Union(WORKPLACE_TYPES.map((v) => t.Literal(v))),
        ),
        experienceMin: t.Optional(t.Nullable(t.Number())),
        experienceMax: t.Optional(t.Nullable(t.Number())),
        salaryMin: t.Optional(t.Nullable(t.Number())),
        salaryMax: t.Optional(t.Nullable(t.Number())),
        salaryCurrency: t.Optional(t.String({ maxLength: 8 })),
        responsibilities: t.Optional(t.String({ maxLength: 20000 })),
        qualifications: t.Optional(t.String({ maxLength: 20000 })),
        benefits: t.Optional(t.String({ maxLength: 10000 })),
        applicationDeadline: t.Optional(t.Nullable(t.String())),
        status: t.Optional(t.Union(JOB_STATUSES.map((v) => t.Literal(v)))),
        requirements: t.Optional(
          t.Array(
            t.Object({
              type: t.Union(REQUIREMENT_TYPES.map((v) => t.Literal(v))),
              category: t.Optional(
                t.Union(REQUIREMENT_CATEGORIES.map((v) => t.Literal(v))),
              ),
              label: t.String({ minLength: 1, maxLength: 200 }),
              description: t.Optional(t.Nullable(t.String({ maxLength: 1000 }))),
              sortOrder: t.Optional(t.Number()),
            }),
          ),
        ),
      }),
    },
  )

  // Company: update job
  .patch(
    "/id/:id",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const existing = await prisma.job.findUnique({
        where: { id: ctx.params.id },
        select: { id: true, organizationId: true, status: true, publishedAt: true },
      });
      if (!existing) {
        ctx.set.status = 404;
        return { error: "Job not found" };
      }

      const membership = await requireJobManager(
        existing.organizationId,
        session.userId,
      );
      if (!membership) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      const nextStatus = ctx.body.status;
      if (
        nextStatus &&
        !(JOB_STATUSES as readonly string[]).includes(nextStatus)
      ) {
        ctx.set.status = 400;
        return { error: "Invalid status" };
      }

      let publishedAt = existing.publishedAt;
      if (nextStatus === "published" && existing.status !== "published") {
        publishedAt = new Date();
      }

      const becomingOpen =
        nextStatus !== undefined &&
        OPEN_JOB_STATUSES.has(nextStatus) &&
        !OPEN_JOB_STATUSES.has(existing.status);
      if (becomingOpen) {
        const gate = await assertCanOpenJob(existing.organizationId, {
          excludeJobId: existing.id,
        });
        if (!gate.ok) {
          ctx.set.status = gate.status;
          return gate.body;
        }
      }

      await prisma.job.update({
        where: { id: existing.id },
        data: {
          ...(ctx.body.title !== undefined
            ? { title: ctx.body.title.trim() }
            : {}),
          ...(ctx.body.description !== undefined
            ? { description: ctx.body.description.trim() }
            : {}),
          ...(ctx.body.department !== undefined
            ? { department: optionalTrim(ctx.body.department) }
            : {}),
          ...(ctx.body.employmentType !== undefined
            ? { employmentType: optionalTrim(ctx.body.employmentType) }
            : {}),
          ...(ctx.body.location !== undefined
            ? { location: optionalTrim(ctx.body.location) }
            : {}),
          ...(ctx.body.workplaceType !== undefined
            ? { workplaceType: optionalTrim(ctx.body.workplaceType) }
            : {}),
          ...(ctx.body.experienceMin !== undefined
            ? { experienceMin: toOptionalInt(ctx.body.experienceMin) }
            : {}),
          ...(ctx.body.experienceMax !== undefined
            ? { experienceMax: toOptionalInt(ctx.body.experienceMax) }
            : {}),
          ...(ctx.body.salaryMin !== undefined
            ? { salaryMin: toOptionalInt(ctx.body.salaryMin) }
            : {}),
          ...(ctx.body.salaryMax !== undefined
            ? { salaryMax: toOptionalInt(ctx.body.salaryMax) }
            : {}),
          ...(ctx.body.salaryCurrency !== undefined
            ? {
                salaryCurrency:
                  optionalTrim(ctx.body.salaryCurrency) ?? "USD",
              }
            : {}),
          ...(ctx.body.responsibilities !== undefined
            ? { responsibilities: optionalTrim(ctx.body.responsibilities) }
            : {}),
          ...(ctx.body.qualifications !== undefined
            ? { qualifications: optionalTrim(ctx.body.qualifications) }
            : {}),
          ...(ctx.body.benefits !== undefined
            ? { benefits: optionalTrim(ctx.body.benefits) }
            : {}),
          ...(ctx.body.applicationDeadline !== undefined
            ? {
                applicationDeadline: toOptionalDate(
                  ctx.body.applicationDeadline,
                ),
              }
            : {}),
          ...(nextStatus !== undefined
            ? { status: nextStatus, publishedAt }
            : {}),
        },
      });

      await replaceRequirements(existing.id, ctx.body.requirements);

      return prisma.job.findUniqueOrThrow({
        where: { id: existing.id },
        include: jobCompanyInclude,
      });
    },
    {
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
        description: t.Optional(t.String({ minLength: 1, maxLength: 50000 })),
        department: t.Optional(t.Nullable(t.String({ maxLength: 120 }))),
        employmentType: t.Optional(
          t.Nullable(t.Union(EMPLOYMENT_TYPES.map((v) => t.Literal(v)))),
        ),
        location: t.Optional(t.Nullable(t.String({ maxLength: 200 }))),
        workplaceType: t.Optional(
          t.Nullable(t.Union(WORKPLACE_TYPES.map((v) => t.Literal(v)))),
        ),
        experienceMin: t.Optional(t.Nullable(t.Number())),
        experienceMax: t.Optional(t.Nullable(t.Number())),
        salaryMin: t.Optional(t.Nullable(t.Number())),
        salaryMax: t.Optional(t.Nullable(t.Number())),
        salaryCurrency: t.Optional(t.Nullable(t.String({ maxLength: 8 }))),
        responsibilities: t.Optional(
          t.Nullable(t.String({ maxLength: 20000 })),
        ),
        qualifications: t.Optional(t.Nullable(t.String({ maxLength: 20000 }))),
        benefits: t.Optional(t.Nullable(t.String({ maxLength: 10000 }))),
        applicationDeadline: t.Optional(t.Nullable(t.String())),
        status: t.Optional(t.Union(JOB_STATUSES.map((v) => t.Literal(v)))),
        requirements: t.Optional(
          t.Array(
            t.Object({
              type: t.Union(REQUIREMENT_TYPES.map((v) => t.Literal(v))),
              category: t.Optional(
                t.Union(REQUIREMENT_CATEGORIES.map((v) => t.Literal(v))),
              ),
              label: t.String({ minLength: 1, maxLength: 200 }),
              description: t.Optional(
                t.Nullable(t.String({ maxLength: 1000 })),
              ),
              sortOrder: t.Optional(t.Number()),
            }),
          ),
        ),
      }),
    },
  )

  // Company: delete draft job
  .delete("/id/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const existing = await prisma.job.findUnique({
      where: { id: ctx.params.id },
      select: { id: true, organizationId: true, status: true },
    });
    if (!existing) {
      ctx.set.status = 404;
      return { error: "Job not found" };
    }

    const membership = await requireJobManager(
      existing.organizationId,
      session.userId,
    );
    if (!membership) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    if (existing.status !== "draft") {
      ctx.set.status = 400;
      return { error: "Only draft jobs can be deleted. Close published jobs instead." };
    }

    const files = isR2Configured()
      ? await prisma.storedFile.findMany({
          where: { jobId: existing.id },
          select: { key: true },
        })
      : [];
    await prisma.job.delete({ where: { id: existing.id } });
    await Promise.all(files.map((file) => deleteObjectQuiet(file.key)));
    return { ok: true };
  });
