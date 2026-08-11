import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  isValidOrgSlug,
  sanitizeHiringSlug,
} from "@/features/jobs/lib/slug";
import { uniqueOrgSlug } from "@/features/organization/lib/slug-server";
import {
  getMembershipByOrgSlug,
  requireOrgAdmin,
  requireOrgMember,
} from "@/features/organization/lib/org-access";
import { canManageJobs, canManageOrganization } from "@/features/organization/lib/permissions";
import {
  canUserCreateOrganization,
  orgUpgradeMessage,
} from "@/lib/org-entitlements";

function optionalTrim(value?: string | null) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const organization = new Elysia({ prefix: "/organizations" })
  // List organizations the current user belongs to
  .get("/", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: session.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            brandColor: true,
            description: true,
            _count: { select: { jobs: true, members: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      role: m.role,
      organization: m.organization,
    }));
  })

  // Create a company workspace
  .post(
    "/",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const name = ctx.body.name.trim();
      if (!name) {
        ctx.set.status = 400;
        return { error: "Company name is required" };
      }

      const createAccess = await canUserCreateOrganization(session.userId);
      if (!createAccess.allowed) {
        ctx.set.status = 402;
        return {
          error: orgUpgradeMessage("workspace"),
          upgradeRequired: true,
          upgradeOrgSlug: createAccess.upgradeOrgSlug,
        };
      }

      const requestedSlug = ctx.body.slug
        ? sanitizeHiringSlug(ctx.body.slug)
        : sanitizeHiringSlug(name);

      if (!isValidOrgSlug(requestedSlug)) {
        ctx.set.status = 400;
        return { error: "Invalid company slug" };
      }

      const slugTaken = await prisma.organization.findUnique({
        where: { slug: requestedSlug },
        select: { id: true },
      });

      const slug = slugTaken
        ? await uniqueOrgSlug(requestedSlug)
        : requestedSlug;

      const org = await prisma.organization.create({
        data: {
          name,
          slug,
          description: optionalTrim(ctx.body.description),
          websiteUrl: optionalTrim(ctx.body.websiteUrl),
          location: optionalTrim(ctx.body.location),
          logoUrl: optionalTrim(ctx.body.logoUrl),
          brandColor: optionalTrim(ctx.body.brandColor),
          members: {
            create: {
              userId: session.userId,
              role: "owner",
            },
          },
        },
        include: {
          _count: { select: { jobs: true, members: true } },
        },
      });

      return { role: "owner", organization: org };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 120 }),
        slug: t.Optional(t.String({ maxLength: 60 })),
        description: t.Optional(t.String({ maxLength: 5000 })),
        websiteUrl: t.Optional(t.String({ maxLength: 500 })),
        location: t.Optional(t.String({ maxLength: 200 })),
        logoUrl: t.Optional(t.String({ maxLength: 500 })),
        brandColor: t.Optional(t.String({ maxLength: 32 })),
      }),
    },
  )

  // Get organization by slug (member only)
  .get("/:slug", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const access = await getMembershipByOrgSlug(ctx.params.slug, session.userId);
    if (!access) {
      ctx.set.status = 404;
      return { error: "Organization not found" };
    }

    const jobCounts = await prisma.job.groupBy({
      by: ["status"],
      where: { organizationId: access.organization.id },
      _count: { _all: true },
    });

    const counts = {
      draft: 0,
      published: 0,
      paused: 0,
      closed: 0,
      total: 0,
    };
    for (const row of jobCounts) {
      const n = row._count._all;
      counts.total += n;
      if (row.status in counts) {
        counts[row.status as keyof typeof counts] = n;
      }
    }

    return {
      ...access.organization,
      role: access.role,
      permissions: {
        manageOrganization: canManageOrganization(access.role),
        manageJobs: canManageJobs(access.role),
      },
      jobCounts: counts,
    };
  })

  // Update organization
  .patch(
    "/:slug",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const org = await prisma.organization.findUnique({
        where: { slug: ctx.params.slug },
        select: { id: true },
      });
      if (!org) {
        ctx.set.status = 404;
        return { error: "Organization not found" };
      }

      const membership = await requireOrgAdmin(org.id, session.userId);
      if (!membership) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      const updated = await prisma.organization.update({
        where: { id: org.id },
        data: {
          ...(ctx.body.name !== undefined
            ? { name: ctx.body.name.trim() }
            : {}),
          ...(ctx.body.description !== undefined
            ? { description: optionalTrim(ctx.body.description) }
            : {}),
          ...(ctx.body.websiteUrl !== undefined
            ? { websiteUrl: optionalTrim(ctx.body.websiteUrl) }
            : {}),
          ...(ctx.body.location !== undefined
            ? { location: optionalTrim(ctx.body.location) }
            : {}),
          ...(ctx.body.logoUrl !== undefined
            ? { logoUrl: optionalTrim(ctx.body.logoUrl) }
            : {}),
          ...(ctx.body.brandColor !== undefined
            ? { brandColor: optionalTrim(ctx.body.brandColor) }
            : {}),
        },
      });

      return updated;
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
        description: t.Optional(t.Nullable(t.String({ maxLength: 5000 }))),
        websiteUrl: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
        location: t.Optional(t.Nullable(t.String({ maxLength: 200 }))),
        logoUrl: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
        brandColor: t.Optional(t.Nullable(t.String({ maxLength: 32 }))),
      }),
    },
  )

  // List members
  .get("/:slug/members", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const org = await prisma.organization.findUnique({
      where: { slug: ctx.params.slug },
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

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: org.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return members.map((m) => ({
      id: m.id,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    }));
  });
