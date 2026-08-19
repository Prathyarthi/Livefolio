import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  isValidOrgSlug,
  isValidWorkspaceSlug,
  sanitizeHiringSlug,
} from "@/features/jobs/lib/slug";
import {
  getMembershipByOrgSlug,
  listAccessibleWorkspaces,
  requireOrgAdmin,
  requireOrgMember,
  requireWorkspaceAccess,
} from "@/features/organization/lib/org-access";
import {
  canManageJobs,
  canManageOrganization,
  isAssignableOrgRole,
} from "@/features/organization/lib/permissions";
import {
  canUserCreateOrganization,
  orgUpgradeMessage,
  resolveOrgAccess,
} from "@/lib/org-entitlements";
import { normalizeOAuthEmail } from "@/lib/oauth-users";

function optionalTrim(value?: string | null) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

const memberUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} as const;

function serializeMember(m: {
  id: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  workspaceIds?: string[];
}) {
  return {
    id: m.id,
    role: m.role,
    createdAt: m.createdAt,
    user: m.user,
    workspaceIds: m.workspaceIds ?? [],
  };
}

async function countOwners(organizationId: string) {
  return prisma.organizationMember.count({
    where: { organizationId, role: "owner" },
  });
}

async function assignUserToWorkspaces(
  organizationId: string,
  userId: string,
  workspaceIds?: string[],
) {
  const orgWorkspaces = await prisma.workspace.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const allowed = new Set(orgWorkspaces.map((ws) => ws.id));
  const ids = (
    workspaceIds && workspaceIds.length > 0
      ? workspaceIds
      : orgWorkspaces.map((ws) => ws.id)
  ).filter((id) => allowed.has(id));

  await prisma.workspaceMember.deleteMany({
    where: { userId, workspace: { organizationId } },
  });
  if (ids.length > 0) {
    await prisma.workspaceMember.createMany({
      data: ids.map((workspaceId) => ({ workspaceId, userId })),
    });
  }
  return ids;
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
            _count: { select: { jobs: true, members: true, workspaces: true } },
            workspaces: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                members: {
                  where: { userId: session.userId },
                  select: { id: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => {
      const workspaces = (
        canManageOrganization(m.role)
          ? m.organization.workspaces
          : m.organization.workspaces.filter((ws) => ws.members.length > 0)
      ).map(({ members: _members, ...workspace }) => workspace);

      return {
        role: m.role,
        organization: {
          ...m.organization,
          workspaces,
        },
      };
    });
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
          error: orgUpgradeMessage("organization"),
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
      if (slugTaken) {
        ctx.set.status = 409;
        return { error: "This organization slug is already in use" };
      }

      try {
        const org = await prisma.organization.create({
          data: {
            name,
            slug: requestedSlug,
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
            workspaces: {
              create: {
                name: "Hiring",
                slug: "general",
                members: {
                  create: { userId: session.userId },
                },
              },
            },
          },
          include: {
            _count: { select: { jobs: true, members: true, workspaces: true } },
            workspaces: {
              select: { id: true, name: true, slug: true },
              orderBy: { createdAt: "asc" },
            },
          },
        });

        return { role: "owner", organization: org };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          ctx.set.status = 409;
          return { error: "This organization slug is already in use" };
        }
        throw error;
      }
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

    const workspaces = await listAccessibleWorkspaces(
      access.organization.id,
      session.userId,
      access.role,
    );

    const accessibleWorkspaceIds = workspaces.map((ws) => ws.id);

    const jobCounts = await prisma.job.groupBy({
      by: ["status"],
      where: {
        organizationId: access.organization.id,
        ...(accessibleWorkspaceIds.length > 0
          ? { workspaceId: { in: accessibleWorkspaceIds } }
          : { id: { in: [] } }),
      },
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
      workspaces: workspaces.map((ws) => ({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        description: ws.description,
      })),
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

  .get("/:slug/workspaces/:workspaceSlug", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const org = await prisma.organization.findUnique({
      where: { slug: ctx.params.slug },
      select: { id: true, slug: true, name: true },
    });
    if (!org) {
      ctx.set.status = 404;
      return { error: "Organization not found" };
    }

    const access = await requireWorkspaceAccess(
      org.id,
      ctx.params.workspaceSlug,
      session.userId,
    );
    if (!access) {
      ctx.set.status = 404;
      return { error: "Workspace not found" };
    }

    const jobCounts = await prisma.job.groupBy({
      by: ["status"],
      where: { workspaceId: access.workspace.id },
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
      id: access.workspace.id,
      name: access.workspace.name,
      slug: access.workspace.slug,
      description: access.workspace.description,
      organization: org,
      role: access.role,
      permissions: {
        manageOrganization: canManageOrganization(access.role),
        manageJobs: canManageJobs(access.role),
      },
      jobCounts: counts,
    };
  })

  .post(
    "/:slug/workspaces",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const org = await prisma.organization.findUnique({
        where: { slug: ctx.params.slug },
        select: {
          id: true,
          slug: true,
          subscriptionStatus: true,
          subscriptionCancelAtPeriodEnd: true,
          subscriptionCurrentPeriodEnd: true,
        },
      });
      if (!org) {
        ctx.set.status = 404;
        return { error: "Organization not found" };
      }

      const actor = await requireOrgAdmin(org.id, session.userId);
      if (!actor) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      const name = ctx.body.name.trim();
      if (!name) {
        ctx.set.status = 400;
        return { error: "Workspace name is required" };
      }

      const entitlement = await resolveOrgAccess(org);
      if (!entitlement.canCreateMoreWorkspaces) {
        ctx.set.status = 402;
        return {
          error: orgUpgradeMessage("workspace"),
          upgradeRequired: true,
          upgradeOrgSlug: org.slug,
        };
      }

      const requestedSlug = ctx.body.slug
        ? sanitizeHiringSlug(ctx.body.slug)
        : sanitizeHiringSlug(name);
      if (!isValidWorkspaceSlug(requestedSlug)) {
        ctx.set.status = 400;
        return { error: "Invalid workspace slug" };
      }

      const slugTaken = await prisma.workspace.findUnique({
        where: {
          organizationId_slug: { organizationId: org.id, slug: requestedSlug },
        },
        select: { id: true },
      });
      if (slugTaken) {
        ctx.set.status = 409;
        return { error: "This workspace slug is already in use" };
      }

      const ownersAndAdmins = await prisma.organizationMember.findMany({
        where: {
          organizationId: org.id,
          role: { in: ["owner", "admin"] },
        },
        select: { userId: true },
      });

      try {
        const workspace = await prisma.workspace.create({
          data: {
            organizationId: org.id,
            name,
            slug: requestedSlug,
            description: optionalTrim(ctx.body.description),
            members: {
              create: ownersAndAdmins.map((row) => ({ userId: row.userId })),
            },
          },
        });

        return workspace;
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          ctx.set.status = 409;
          return { error: "This workspace slug is already in use" };
        }
        throw error;
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 120 }),
        slug: t.Optional(t.String({ maxLength: 60 })),
        description: t.Optional(t.String({ maxLength: 5000 })),
      }),
    },
  )

  .patch(
    "/:slug/workspaces/:workspaceSlug",
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

      const actor = await requireOrgAdmin(org.id, session.userId);
      if (!actor) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      const workspace = await prisma.workspace.findUnique({
        where: {
          organizationId_slug: {
            organizationId: org.id,
            slug: ctx.params.workspaceSlug,
          },
        },
      });
      if (!workspace) {
        ctx.set.status = 404;
        return { error: "Workspace not found" };
      }

      const nextSlug =
        ctx.body.slug !== undefined
          ? sanitizeHiringSlug(ctx.body.slug)
          : undefined;
      if (nextSlug !== undefined && !isValidWorkspaceSlug(nextSlug)) {
        ctx.set.status = 400;
        return { error: "Invalid workspace slug" };
      }

      if (nextSlug !== undefined && nextSlug !== workspace.slug) {
        const slugTaken = await prisma.workspace.findUnique({
          where: {
            organizationId_slug: {
              organizationId: org.id,
              slug: nextSlug,
            },
          },
          select: { id: true },
        });
        if (slugTaken) {
          ctx.set.status = 409;
          return { error: "This workspace slug is already in use" };
        }
      }

      try {
        const updated = await prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            ...(ctx.body.name !== undefined
              ? { name: ctx.body.name.trim() }
              : {}),
            ...(ctx.body.description !== undefined
              ? { description: optionalTrim(ctx.body.description) }
              : {}),
            ...(nextSlug && nextSlug !== workspace.slug
              ? { slug: nextSlug }
              : {}),
          },
        });

        return updated;
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          ctx.set.status = 409;
          return { error: "This workspace slug is already in use" };
        }
        throw error;
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
        slug: t.Optional(t.String({ maxLength: 60 })),
        description: t.Optional(t.Nullable(t.String({ maxLength: 5000 }))),
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
      include: { user: { select: memberUserSelect } },
      orderBy: { createdAt: "asc" },
    });

    const assignments = await prisma.workspaceMember.findMany({
      where: {
        workspace: { organizationId: org.id },
        userId: { in: members.map((m) => m.userId) },
      },
      select: { userId: true, workspaceId: true },
    });
    const workspaceIdsByUser = new Map<string, string[]>();
    for (const row of assignments) {
      const current = workspaceIdsByUser.get(row.userId) ?? [];
      current.push(row.workspaceId);
      workspaceIdsByUser.set(row.userId, current);
    }

    return members.map((m) =>
      serializeMember({
        ...m,
        workspaceIds: workspaceIdsByUser.get(m.userId) ?? [],
      }),
    );
  })

  // Add member
  .post(
    "/:slug/members",
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

      const actor = await requireOrgAdmin(org.id, session.userId);
      if (!actor) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      if (!isAssignableOrgRole(ctx.body.role)) {
        ctx.set.status = 400;
        return { error: "Invalid role" };
      }

      const email = normalizeOAuthEmail(ctx.body.email);
      if (!email.includes("@")) {
        ctx.set.status = 400;
        return { error: "A valid email is required" };
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: memberUserSelect,
      });
      if (!user) {
        ctx.set.status = 404;
        return {
          error:
            "No Livefolio account found for that email. They need to sign up first.",
        };
      }

      const existing = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: user.id,
          },
        },
        select: { id: true },
      });
      if (existing) {
        ctx.set.status = 409;
        return { error: "That person is already a member of this company." };
      }

      const member = await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: ctx.body.role,
        },
        include: { user: { select: memberUserSelect } },
      });

      const workspaceIds = await assignUserToWorkspaces(
        org.id,
        user.id,
        ctx.body.workspaceIds,
      );

      return serializeMember({ ...member, workspaceIds });
    },
    {
      body: t.Object({
        email: t.String({ minLength: 3, maxLength: 320 }),
        role: t.String({ minLength: 1, maxLength: 32 }),
        workspaceIds: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // Update member role
  .patch(
    "/:slug/members/:memberId",
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

      const actor = await requireOrgAdmin(org.id, session.userId);
      if (!actor) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      if (ctx.body.role !== undefined && !isAssignableOrgRole(ctx.body.role)) {
        ctx.set.status = 400;
        return { error: "Invalid role" };
      }

      const target = await prisma.organizationMember.findFirst({
        where: { id: ctx.params.memberId, organizationId: org.id },
        include: { user: { select: memberUserSelect } },
      });
      if (!target) {
        ctx.set.status = 404;
        return { error: "Member not found" };
      }

      if (target.role === "owner") {
        ctx.set.status = 403;
        return { error: "Owner role cannot be changed from here." };
      }

      // Only owners may change another admin's role
      if (
        ctx.body.role &&
        target.role === "admin" &&
        actor.role !== "owner"
      ) {
        ctx.set.status = 403;
        return { error: "Only the owner can change an admin's role." };
      }

      const updated = await prisma.organizationMember.update({
        where: { id: target.id },
        data: ctx.body.role ? { role: ctx.body.role } : {},
        include: { user: { select: memberUserSelect } },
      });

      const workspaceIds =
        ctx.body.workspaceIds !== undefined
          ? await assignUserToWorkspaces(
              org.id,
              updated.userId,
              ctx.body.workspaceIds,
            )
          : (
              await prisma.workspaceMember.findMany({
                where: {
                  userId: updated.userId,
                  workspace: { organizationId: org.id },
                },
                select: { workspaceId: true },
              })
            ).map((row) => row.workspaceId);

      return serializeMember({ ...updated, workspaceIds });
    },
    {
      body: t.Object({
        role: t.Optional(t.String({ minLength: 1, maxLength: 32 })),
        workspaceIds: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // Remove member (admin) or leave (self)
  .delete("/:slug/members/:memberId", async (ctx) => {
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

    const actor = await requireOrgMember(org.id, session.userId);
    if (!actor) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    const target = await prisma.organizationMember.findFirst({
      where: { id: ctx.params.memberId, organizationId: org.id },
      select: { id: true, role: true, userId: true },
    });
    if (!target) {
      ctx.set.status = 404;
      return { error: "Member not found" };
    }

    const isSelf = target.userId === session.userId;
    const actorIsAdmin = canManageOrganization(actor.role);

    if (!isSelf && !actorIsAdmin) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    if (target.role === "owner") {
      const owners = await countOwners(org.id);
      if (owners <= 1) {
        ctx.set.status = 403;
        return {
          error: "Cannot remove the only owner of this company.",
        };
      }
      if (!isSelf && actor.role !== "owner") {
        ctx.set.status = 403;
        return { error: "Only an owner can remove another owner." };
      }
    }

    if (!isSelf && target.role === "admin" && actor.role !== "owner") {
      ctx.set.status = 403;
      return { error: "Only the owner can remove an admin." };
    }

    await prisma.organizationMember.delete({ where: { id: target.id } });
    return { ok: true };
  });
