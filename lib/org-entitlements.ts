import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isProSubscription } from "@/lib/entitlements";
import {
  PRO_MAX_WORKSPACES,
  PRO_OPEN_JOBS_PER_WORKSPACE,
  canAddSeatHolder,
  PLAN_LIMITS,
  resolvePlanTier,
  seatCap,
  seatsUsed,
  type OrgPlanTier,
} from "@/lib/hiring-plans";

type EntitlementDb = Prisma.TransactionClient | typeof prisma;

export type OrgLimitKind = "organization" | "workspace" | "job" | "workspace_job" | "seat" | "talent";

export function orgUpgradeMessage(kind: OrgLimitKind, tier?: OrgPlanTier): string {
  if (kind === "organization") {
    return "Free plans include 1 organization. Upgrade to Pro to create more.";
  }
  if (kind === "workspace") {
    return tier === "pro"
      ? `Pro includes up to ${PRO_MAX_WORKSPACES} workspaces. Upgrade to Business in Billing for unlimited workspaces.`
      : "Free includes 1 workspace. Upgrade to Pro (up to 5) or Business (unlimited) in Billing.";
  }
  if (kind === "talent") {
    return "Talent search is on Pro and above. Upgrade in Billing to search candidates who opted in.";
  }
  if (kind === "workspace_job") {
    return `Pro allows up to ${PRO_OPEN_JOBS_PER_WORKSPACE} open jobs per workspace. Pause or close a job here, or upgrade to Business in Billing for unlimited open jobs.`;
  }
  if (kind === "seat") {
    return "All paid seats are in use. Add a seat in Billing (or upgrade from Free) to invite more teammates.";
  }
  return "Free plans include 1 open job posting. Upgrade to Pro to publish more roles.";
}

export class OrgPlanLimitError extends Error {
  readonly status = 402 as const;
  readonly upgradeRequired = true;

  constructor(
    readonly kind: OrgLimitKind,
    readonly upgradeOrgSlug: string,
    tier?: OrgPlanTier,
  ) {
    super(orgUpgradeMessage(kind, tier));
    this.name = "OrgPlanLimitError";
  }

  toBody() {
    return {
      error: this.message,
      upgradeRequired: true as const,
      upgradeOrgSlug: this.upgradeOrgSlug,
      limit: this.kind,
    };
  }
}

export function isOrgPlanLimitError(error: unknown): error is OrgPlanLimitError {
  return error instanceof OrgPlanLimitError;
}

export async function withOrganizationLock<T>(
  organizationId: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "organizations"
        WHERE "id" = ${organizationId}
        FOR UPDATE
      `;
      if (locked.length === 0) {
        throw new Error("Organization not found");
      }
      return operation(tx);
    },
    { maxWait: 20_000, timeout: 30_000 },
  );
}

export async function withUserLock<T>(
  userId: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "users"
        WHERE "id" = ${userId}
        FOR UPDATE
      `;
      if (locked.length === 0) {
        throw new Error("User not found");
      }
      return operation(tx);
    },
    { maxWait: 20_000, timeout: 30_000 },
  );
}

export const FREE_OWNED_ORG_LIMIT = 1;
export const FREE_OPEN_JOB_LIMIT = 1;
export const FREE_WORKSPACE_LIMIT = 1;

/** "pro" means any paid hiring plan (Pro or Business); see `tier`. */
export type OrgPlan = "free" | "pro";

export type OrgBillingProfile = {
  id: string;
  slug: string;
  subscriptionStatus?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionCurrentPeriodEnd?: Date | null;
  subscriptionPlan?: string | null;
  subscriptionSeats?: number | null;
};

/** Select these on organization queries that feed entitlement checks. */
export const ORG_BILLING_SELECT = {
  id: true,
  slug: true,
  subscriptionStatus: true,
  subscriptionCancelAtPeriodEnd: true,
  subscriptionCurrentPeriodEnd: true,
  subscriptionPlan: true,
  subscriptionSeats: true,
} as const;

export type OrgAccessSnapshot = {
  plan: OrgPlan;
  maxOpenJobs: number | null;
  /** Pro: open jobs allowed per workspace. null = unlimited. */
  maxOpenJobsPerWorkspace: number | null;
  maxWorkspaces: number | null;
  canPublishMoreJobs: boolean;
  canCreateMoreWorkspaces: boolean;
  openJobCount: number;
  workspaceCount: number;
  upgradeRequired: boolean;
  tier: OrgPlanTier;
  /** Paid seats (or 1 on Free). */
  seatLimit: number | null;
  seatsUsed: number;
  activeMembers: number;
  pendingInvites: number;
  canAddSeatHolder: boolean;
};

function isPaidOrgPro(org: OrgBillingProfile, now = new Date()): boolean {
  const paidThroughCancellation =
    !org.subscriptionCancelAtPeriodEnd ||
    !org.subscriptionCurrentPeriodEnd ||
    now.getTime() < org.subscriptionCurrentPeriodEnd.getTime();
  return isProSubscription(org.subscriptionStatus) && paidThroughCancellation;
}

/** Open roles that count against the free publish cap. */
export async function countOpenJobs(
  organizationId: string,
  db: EntitlementDb = prisma,
  excludeJobId?: string,
): Promise<number> {
  return db.job.count({
    where: {
      organizationId,
      status: { in: ["published", "paused"] },
      ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
    },
  });
}

export async function countWorkspaces(
  organizationId: string,
  db: EntitlementDb = prisma,
): Promise<number> {
  return db.workspace.count({ where: { organizationId } });
}

/** Seat holders: active members plus pending, unexpired invites. */
export async function countSeatHolders(
  organizationId: string,
  db: EntitlementDb = prisma,
): Promise<{ activeMembers: number; pendingInvites: number }> {
  const [activeMembers, pendingInvites] = await Promise.all([
    db.organizationMember.count({ where: { organizationId } }),
    db.organizationInvite.count({
      where: { organizationId, status: "pending", expiresAt: { gt: new Date() } },
    }),
  ]);
  return { activeMembers, pendingInvites };
}

export function orgPlanTier(org: OrgBillingProfile): OrgPlanTier {
  return resolvePlanTier({
    paid: isPaidOrgPro(org),
    subscriptionPlan: org.subscriptionPlan,
  });
}

export async function resolveOrgAccess(
  org: OrgBillingProfile,
  counts?: {
    openJobCount?: number;
    workspaceCount?: number;
    activeMembers?: number;
    pendingInvites?: number;
  },
  db: EntitlementDb = prisma,
): Promise<OrgAccessSnapshot> {
  const open = counts?.openJobCount ?? (await countOpenJobs(org.id, db));
  const workspaces =
    counts?.workspaceCount ?? (await countWorkspaces(org.id, db));
  const seats =
    counts?.activeMembers != null && counts?.pendingInvites != null
      ? { activeMembers: counts.activeMembers, pendingInvites: counts.pendingInvites }
      : await countSeatHolders(org.id, db);
  const tier = orgPlanTier(org);
  const limits = PLAN_LIMITS[tier];
  const maxOpenJobs = limits.maxOpenJobs;
  const maxWorkspaces = limits.maxWorkspaces;
  const canPublishMoreJobs = maxOpenJobs === null || open < maxOpenJobs;
  const canCreateMoreWorkspaces =
    maxWorkspaces === null || workspaces < maxWorkspaces;
  const seatLimit = seatCap(tier, org.subscriptionSeats);
  const used = seatsUsed(seats.activeMembers, seats.pendingInvites);

  return {
    plan: tier === "free" ? "free" : "pro",
    maxOpenJobs,
    maxOpenJobsPerWorkspace: limits.maxOpenJobsPerWorkspace,
    maxWorkspaces,
    canPublishMoreJobs,
    canCreateMoreWorkspaces,
    openJobCount: open,
    workspaceCount: workspaces,
    upgradeRequired: !canPublishMoreJobs,
    tier,
    seatLimit,
    seatsUsed: used,
    activeMembers: seats.activeMembers,
    pendingInvites: seats.pendingInvites,
    canAddSeatHolder: canAddSeatHolder(used, seatLimit),
  };
}

/** Throws OrgPlanLimitError("seat") when inviting one more person would exceed paid seats. */
export async function assertSeatAvailable(
  org: OrgBillingProfile,
  db: EntitlementDb = prisma,
  opts?: { excludeInviteEmail?: string },
): Promise<void> {
  const counts = await countSeatHolders(org.id, db);
  let pending = counts.pendingInvites;
  if (opts?.excludeInviteEmail) {
    // Re-sending an existing pending invite doesn't take a new seat.
    const existing = await db.organizationInvite.count({
      where: {
        organizationId: org.id,
        email: opts.excludeInviteEmail,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    });
    pending -= existing;
  }
  const cap = seatCap(orgPlanTier(org), org.subscriptionSeats);
  if (!canAddSeatHolder(seatsUsed(counts.activeMembers, pending), cap)) {
    throw new OrgPlanLimitError("seat", org.slug);
  }
}

export async function userOwnsProOrganization(userId: string): Promise<boolean> {
  const owned = await prisma.organizationMember.findMany({
    where: { userId, role: "owner" },
    select: {
      organization: {
        select: {
          subscriptionStatus: true,
          subscriptionCancelAtPeriodEnd: true,
          subscriptionCurrentPeriodEnd: true,
        },
      },
    },
  });

  return owned.some((row) =>
    isPaidOrgPro({
      id: "",
      slug: "",
      subscriptionStatus: row.organization.subscriptionStatus,
      subscriptionCancelAtPeriodEnd:
        row.organization.subscriptionCancelAtPeriodEnd,
      subscriptionCurrentPeriodEnd:
        row.organization.subscriptionCurrentPeriodEnd,
    }),
  );
}

export async function canUserCreateOrganization(
  userId: string,
  db: EntitlementDb = prisma,
): Promise<{
  allowed: boolean;
  ownedCount: number;
  upgradeOrgSlug: string | null;
}> {
  const owned = await db.organizationMember.findMany({
    where: { userId, role: "owner" },
    select: {
      organization: {
        select: {
          slug: true,
          subscriptionStatus: true,
          subscriptionCancelAtPeriodEnd: true,
          subscriptionCurrentPeriodEnd: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const ownedCount = owned.length;
  if (ownedCount < FREE_OWNED_ORG_LIMIT) {
    return { allowed: true, ownedCount, upgradeOrgSlug: null };
  }

  const hasPro = owned.some((row) =>
    isPaidOrgPro({
      id: "",
      slug: row.organization.slug,
      subscriptionStatus: row.organization.subscriptionStatus,
      subscriptionCancelAtPeriodEnd:
        row.organization.subscriptionCancelAtPeriodEnd,
      subscriptionCurrentPeriodEnd:
        row.organization.subscriptionCurrentPeriodEnd,
    }),
  );

  return {
    allowed: hasPro,
    ownedCount,
    upgradeOrgSlug: hasPro ? null : (owned[0]?.organization.slug ?? null),
  };
}
