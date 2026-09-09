import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isProSubscription } from "@/lib/entitlements";

type EntitlementDb = Prisma.TransactionClient | typeof prisma;

export function orgUpgradeMessage(
  kind: "organization" | "workspace" | "job",
): string {
  if (kind === "organization") {
    return "Free plans include 1 organization. Upgrade to Org Pro to create more.";
  }
  if (kind === "workspace") {
    return "Free plans include 1 workspace per organization. Upgrade to Org Pro to create more.";
  }
  return "Free plans include 1 open job posting. Upgrade to Org Pro to publish more roles.";
}

export class OrgPlanLimitError extends Error {
  readonly status = 402 as const;
  readonly upgradeRequired = true;

  constructor(
    readonly kind: "organization" | "workspace" | "job",
    readonly upgradeOrgSlug: string,
  ) {
    super(orgUpgradeMessage(kind));
    this.name = "OrgPlanLimitError";
  }

  toBody() {
    return {
      error: this.message,
      upgradeRequired: true as const,
      upgradeOrgSlug: this.upgradeOrgSlug,
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

export type OrgPlan = "free" | "pro";

export type OrgBillingProfile = {
  id: string;
  slug: string;
  subscriptionStatus?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionCurrentPeriodEnd?: Date | null;
};

export type OrgAccessSnapshot = {
  plan: OrgPlan;
  maxOpenJobs: number | null;
  maxWorkspaces: number | null;
  canPublishMoreJobs: boolean;
  canCreateMoreWorkspaces: boolean;
  openJobCount: number;
  workspaceCount: number;
  upgradeRequired: boolean;
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

export async function resolveOrgAccess(
  org: OrgBillingProfile,
  counts?: { openJobCount?: number; workspaceCount?: number },
): Promise<OrgAccessSnapshot> {
  const open = counts?.openJobCount ?? (await countOpenJobs(org.id));
  const workspaces =
    counts?.workspaceCount ?? (await countWorkspaces(org.id));
  const pro = isPaidOrgPro(org);
  const maxOpenJobs = pro ? null : FREE_OPEN_JOB_LIMIT;
  const maxWorkspaces = pro ? null : FREE_WORKSPACE_LIMIT;
  const canPublishMoreJobs = pro || open < FREE_OPEN_JOB_LIMIT;
  const canCreateMoreWorkspaces = pro || workspaces < FREE_WORKSPACE_LIMIT;

  return {
    plan: pro ? "pro" : "free",
    maxOpenJobs,
    maxWorkspaces,
    canPublishMoreJobs,
    canCreateMoreWorkspaces,
    openJobCount: open,
    workspaceCount: workspaces,
    upgradeRequired: !canPublishMoreJobs,
  };
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
