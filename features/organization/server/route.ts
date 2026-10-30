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
  isOrgPlanLimitError,
  orgUpgradeMessage,
  OrgPlanLimitError,
  resolveOrgAccess,
  withOrganizationLock,
  withUserLock,
} from "@/lib/org-entitlements";
import { randomBytes } from "node:crypto";
import { normalizeOAuthEmail } from "@/lib/oauth-users";
import { domainMatchesWebsite } from "@/features/verification/lib/work-email";
import { sendOrgInviteEmail } from "@/features/organization/lib/invite-email";
import { deleteOrgBrandFiles } from "@/features/uploads/server/stored-files";

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

async function emailOrganizationInvite(input: {
  organizationId: string;
  email: string;
  role: string;
  workspaceIds: string[];
  invitedById: string;
  inviterName: string;
}) {
  const pending = await prisma.organizationInvite.findFirst({
    where: {
      organizationId: input.organizationId,
      email: input.email,
      status: "pending",
    },
  });
  const createdNew = !pending;
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const invite = pending
    ? await prisma.organizationInvite.update({
        where: { id: pending.id },
        data: {
          role: input.role,
          workspaceIds: input.workspaceIds,
          invitedById: input.invitedById,
          expiresAt,
        },
      })
    : await prisma.organizationInvite.create({
        data: {
          token: randomBytes(24).toString("hex"),
          organizationId: input.organizationId,
          email: input.email,
          role: input.role,
          workspaceIds: input.workspaceIds,
          invitedById: input.invitedById,
          expiresAt,
        },
      });

  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { name: true },
  });
  const sent = await sendOrgInviteEmail({
    inviteId: invite.id,
    userId: input.invitedById,
    toEmail: input.email,
    inviterName: input.inviterName,
    organizationName: organization?.name || "your company",
    role: invite.role,
    token: invite.token,
  });
  if (!sent.sent) {
    if (createdNew) {
      await prisma.organizationInvite.delete({ where: { id: invite.id } });
    }
    return {
      ok: false as const,
      error: sent.error ?? "Could not send the invite email.",
    };
  }

  return {
    ok: true as const,
    invite: {
      invited: true as const,
      id: invite.id,
      email: invite.email,
      role: invite.role,
    },
  };
}

function storedWorkspaceIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string");
}

async function getWorkspaceIdsForUser(organizationId: string, userId: string) {
  const rows = await prisma.workspaceMember.findMany({
    where: { userId, workspace: { organizationId } },
    select: { workspaceId: true },
  });
  return rows.map((row) => row.workspaceId);
}

async function addUserToWorkspace(workspaceId: string, userId: string) {
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId, userId } },
    create: { workspaceId, userId },
    update: {},
  });
}

function memberHasWorkspaceAccess(
  role: string,
  workspaceIds: string[],
  workspaceId: string,
) {
  return canManageOrganization(role) || workspaceIds.includes(workspaceId);
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
            bannerUrl: true,
            brandColor: true,
            description: true,
            verified: true,
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
        const organizationId = await withUserLock(session.userId, async (tx) => {
          const lockedAccess = await canUserCreateOrganization(
            session.userId,
            tx,
          );
          if (!lockedAccess.allowed) {
            throw new OrgPlanLimitError(
              "organization",
              lockedAccess.upgradeOrgSlug ?? "",
            );
          }

          const created = await tx.organization.create({
            data: {
              name,
              slug: requestedSlug,
              description: optionalTrim(ctx.body.description),
              websiteUrl: optionalTrim(ctx.body.websiteUrl),
              location: optionalTrim(ctx.body.location),
              logoUrl: optionalTrim(ctx.body.logoUrl),
              brandColor: optionalTrim(ctx.body.brandColor),
            },
            select: { id: true },
          });

          await tx.organizationMember.create({
            data: {
              organizationId: created.id,
              userId: session.userId,
              role: "owner",
            },
          });

          return created.id;
        });

        // Relation reads run through the pool after the transaction is released.
        const org = await prisma.organization.findUniqueOrThrow({
          where: { id: organizationId },
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
        if (isOrgPlanLimitError(error)) {
          ctx.set.status = error.status;
          return error.toBody();
        }
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

  // Check organization slug availability
  .post(
    "/slug/check",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const requestedSlug = sanitizeHiringSlug(ctx.body.slug);
      if (!isValidOrgSlug(requestedSlug)) {
        return {
          available: false,
          reason: "invalid" as const,
          slug: requestedSlug,
        };
      }

      const existing = await prisma.organization.findUnique({
        where: { slug: requestedSlug },
        select: { id: true },
      });

      return {
        available: !existing,
        slug: requestedSlug,
        ...(existing ? { reason: "taken" as const } : {}),
      };
    },
    {
      body: t.Object({ slug: t.String({ maxLength: 60 }) }),
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
        customJobFields: ws.customJobFields,
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

      if (
        ctx.body.logoUrl !== undefined &&
        optionalTrim(ctx.body.logoUrl) == null
      ) {
        await deleteOrgBrandFiles(org.id, "org_logo");
      }
      if (
        ctx.body.bannerUrl !== undefined &&
        optionalTrim(ctx.body.bannerUrl) == null
      ) {
        await deleteOrgBrandFiles(org.id, "org_banner");
      }

      const nextWebsite =
        ctx.body.websiteUrl !== undefined
          ? optionalTrim(ctx.body.websiteUrl)
          : undefined;

      const updated = await prisma.$transaction(async (tx) => {
        const saved = await tx.organization.update({
          where: { id: org.id },
          data: {
            ...(ctx.body.name !== undefined
              ? { name: ctx.body.name.trim() }
              : {}),
            ...(ctx.body.description !== undefined
              ? { description: optionalTrim(ctx.body.description) }
              : {}),
            ...(nextWebsite !== undefined ? { websiteUrl: nextWebsite } : {}),
            ...(ctx.body.location !== undefined
              ? { location: optionalTrim(ctx.body.location) }
              : {}),
            ...(ctx.body.logoUrl !== undefined
              ? { logoUrl: optionalTrim(ctx.body.logoUrl) }
              : {}),
            ...(ctx.body.bannerUrl !== undefined
              ? { bannerUrl: optionalTrim(ctx.body.bannerUrl) }
              : {}),
            ...(ctx.body.brandColor !== undefined
              ? { brandColor: optionalTrim(ctx.body.brandColor) }
              : {}),
          },
        });

        if (nextWebsite === undefined) return saved;

        const proof = await tx.organizationVerification.findUnique({
          where: { organizationId: org.id },
        });
        if (
          proof?.status === "verified" &&
          !domainMatchesWebsite(proof.domain, nextWebsite)
        ) {
          await tx.organizationVerification.delete({ where: { id: proof.id } });
          return tx.organization.update({
            where: { id: org.id },
            data: { verified: false },
          });
        }
        return saved;
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
        bannerUrl: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
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
      customJobFields: access.workspace.customJobFields,
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

      const requestedSlug = ctx.body.slug
        ? sanitizeHiringSlug(ctx.body.slug)
        : sanitizeHiringSlug(name);
      if (!isValidWorkspaceSlug(requestedSlug)) {
        ctx.set.status = 400;
        return { error: "Invalid workspace slug" };
      }

      const ownersAndAdmins = await prisma.organizationMember.findMany({
        where: {
          organizationId: org.id,
          role: { in: ["owner", "admin"] },
        },
        select: { userId: true },
      });

      try {
        return await withOrganizationLock(org.id, async (tx) => {
          const workspaceCount = await tx.workspace.count({
            where: { organizationId: org.id },
          });
          const entitlement = await resolveOrgAccess(org, { workspaceCount });
          if (!entitlement.canCreateMoreWorkspaces) {
            throw new OrgPlanLimitError("workspace", org.slug);
          }

          const slugTaken = await tx.workspace.findUnique({
            where: {
              organizationId_slug: {
                organizationId: org.id,
                slug: requestedSlug,
              },
            },
            select: { id: true },
          });
          if (slugTaken) {
            const error = new Error("WORKSPACE_SLUG_TAKEN");
            error.name = "WORKSPACE_SLUG_TAKEN";
            throw error;
          }

          return tx.workspace.create({
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
        });
      } catch (error) {
        if (isOrgPlanLimitError(error)) {
          ctx.set.status = error.status;
          return error.toBody();
        }
        if (
          isUniqueConstraintError(error) ||
          (error instanceof Error && error.name === "WORKSPACE_SLUG_TAKEN")
        ) {
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
            ...(ctx.body.customJobFields !== undefined
              ? { customJobFields: ctx.body.customJobFields }
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
        customJobFields: t.Optional(t.Any()),
      }),
    },
  )

  .get("/:slug/workspaces/:workspaceSlug/members", async (ctx) => {
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

    const access = await requireWorkspaceAccess(
      org.id,
      ctx.params.workspaceSlug,
      session.userId,
    );
    if (!access) {
      ctx.set.status = 404;
      return { error: "Workspace not found" };
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

    return members
      .map((m) =>
        serializeMember({
          ...m,
          workspaceIds: workspaceIdsByUser.get(m.userId) ?? [],
        }),
      )
      .filter((m) =>
        memberHasWorkspaceAccess(m.role, m.workspaceIds, access.workspace.id),
      );
  })

  .post(
    "/:slug/workspaces/:workspaceSlug/members",
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
        select: { id: true },
      });
      if (!workspace) {
        ctx.set.status = 404;
        return { error: "Workspace not found" };
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

      const existing = user
        ? await prisma.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId: org.id,
                userId: user.id,
              },
            },
            include: { user: { select: memberUserSelect } },
          })
        : null;

      if (existing) {
        if (canManageOrganization(existing.role)) {
          ctx.set.status = 409;
          return {
            error: "Owners and admins already have access to every workspace.",
          };
        }

        const alreadyAssigned = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: workspace.id,
              userId: existing.userId,
            },
          },
          select: { id: true },
        });
        if (alreadyAssigned) {
          ctx.set.status = 409;
          return { error: "That person is already a member of this workspace." };
        }

        await addUserToWorkspace(workspace.id, existing.userId);
        return serializeMember({
          ...existing,
          workspaceIds: await getWorkspaceIdsForUser(org.id, existing.userId),
        });
      }

      const pending = await prisma.organizationInvite.findFirst({
        where: { organizationId: org.id, email, status: "pending" },
        select: { workspaceIds: true },
      });
      const workspaceIds = [
        ...new Set([...storedWorkspaceIds(pending?.workspaceIds), workspace.id]),
      ];
      const invited = await emailOrganizationInvite({
        organizationId: org.id,
        email,
        role: ctx.body.role,
        workspaceIds,
        invitedById: session.userId,
        inviterName: session.name?.trim() || "A teammate",
      });
      if (!invited.ok) {
        ctx.set.status = 502;
        return { error: invited.error };
      }
      return invited.invite;
    },
    {
      body: t.Object({
        email: t.String({ minLength: 3, maxLength: 320 }),
        role: t.String({ minLength: 1, maxLength: 32 }),
      }),
    },
  )

  .delete(
    "/:slug/workspaces/:workspaceSlug/members/:memberId",
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

      const actor = await requireOrgMember(org.id, session.userId);
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
        select: { id: true },
      });
      if (!workspace) {
        ctx.set.status = 404;
        return { error: "Workspace not found" };
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

      if (canManageOrganization(target.role)) {
        ctx.set.status = 403;
        return {
          error: "Owners and admins have access to every workspace.",
        };
      }

      await prisma.workspaceMember.deleteMany({
        where: { workspaceId: workspace.id, userId: target.userId },
      });

      return { ok: true };
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

  // Email an invite. Membership is created only after they accept.
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

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingUser) {
        const alreadyMember = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: org.id,
              userId: existingUser.id,
            },
          },
          select: { id: true },
        });
        if (alreadyMember) {
          ctx.set.status = 409;
          return { error: "That person is already a member of this company." };
        }
      }

      const orgWorkspaces = await prisma.workspace.findMany({
        where: { organizationId: org.id },
        select: { id: true },
      });
      const allowed = new Set(orgWorkspaces.map((ws) => ws.id));
      const workspaceIds = (
        ctx.body.workspaceIds && ctx.body.workspaceIds.length > 0
          ? ctx.body.workspaceIds
          : orgWorkspaces.map((ws) => ws.id)
      ).filter((id) => allowed.has(id));

      const invited = await emailOrganizationInvite({
        organizationId: org.id,
        email,
        role: ctx.body.role,
        workspaceIds,
        invitedById: session.userId,
        inviterName: session.name?.trim() || "A teammate",
      });
      if (!invited.ok) {
        ctx.set.status = 502;
        return { error: invited.error };
      }
      return invited.invite;
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
  })

  .get("/:slug/invites", async (ctx) => {
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

    const invites = await prisma.organizationInvite.findMany({
      where: { organizationId: org.id, status: "pending" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
      },
    });
    return invites;
  })

  .delete("/:slug/invites/:inviteId", async (ctx) => {
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

    const invite = await prisma.organizationInvite.findFirst({
      where: {
        id: ctx.params.inviteId,
        organizationId: org.id,
        status: "pending",
      },
      select: { id: true },
    });
    if (!invite) {
      ctx.set.status = 404;
      return { error: "Invite not found" };
    }

    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { status: "revoked" },
    });
    return { ok: true };
  })

  .get("/join/:token", async (ctx) => {
    const invite = await prisma.organizationInvite.findUnique({
      where: { token: ctx.params.token },
      include: { organization: { select: { name: true, slug: true } } },
    });
    if (!invite || invite.status === "revoked") {
      ctx.set.status = 404;
      return { error: "This invite is no longer available." };
    }
    if (invite.status === "accepted") {
      return {
        status: "accepted",
        organizationName: invite.organization.name,
        organizationSlug: invite.organization.slug,
        email: invite.email,
        role: invite.role,
      };
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      ctx.set.status = 410;
      return { error: "This invite has expired." };
    }
    return {
      status: "pending",
      organizationName: invite.organization.name,
      organizationSlug: invite.organization.slug,
      email: invite.email,
      role: invite.role,
    };
  })

  .post("/join/:token", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session?.email) {
      ctx.set.status = 401;
      return { error: "Sign in to accept this invite." };
    }

    const invite = await prisma.organizationInvite.findUnique({
      where: { token: ctx.params.token },
    });
    if (!invite || invite.status !== "pending") {
      ctx.set.status = 404;
      return { error: "This invite is no longer available." };
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      ctx.set.status = 410;
      return { error: "This invite has expired." };
    }

    const sessionEmail = normalizeOAuthEmail(session.email);
    if (sessionEmail !== invite.email) {
      ctx.set.status = 403;
      return {
        error: `Sign in as ${invite.email} to accept this invite.`,
      };
    }

    const workspaceIds = Array.isArray(invite.workspaceIds)
      ? invite.workspaceIds.filter((id): id is string => typeof id === "string")
      : [];

    await prisma.$transaction(async (tx) => {
      const existing = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: invite.organizationId,
            userId: session.userId,
          },
        },
        select: { id: true },
      });
      if (!existing) {
        await tx.organizationMember.create({
          data: {
            organizationId: invite.organizationId,
            userId: session.userId,
            role: invite.role,
          },
        });
      }
      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: { status: "accepted", acceptedAt: new Date() },
      });
    });

    if (workspaceIds.length > 0) {
      await assignUserToWorkspaces(
        invite.organizationId,
        session.userId,
        workspaceIds,
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: invite.organizationId },
      select: { slug: true },
    });
    return { ok: true, organizationSlug: organization?.slug ?? null };
  });
