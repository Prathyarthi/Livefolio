import { prisma } from "@/lib/prisma";
import { isProSubscription } from "@/lib/entitlements";

export const FREE_OWNED_ORG_LIMIT = 1;
export const FREE_OPEN_JOB_LIMIT = 1;

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
  canPublishMoreJobs: boolean;
  openJobCount: number;
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
export async function countOpenJobs(organizationId: string): Promise<number> {
  return prisma.job.count({
    where: {
      organizationId,
      status: { in: ["published", "paused"] },
    },
  });
}

export async function resolveOrgAccess(
  org: OrgBillingProfile,
  openJobCount?: number,
): Promise<OrgAccessSnapshot> {
  const open =
    openJobCount ?? (await countOpenJobs(org.id));
  const pro = isPaidOrgPro(org);
  const maxOpenJobs = pro ? null : FREE_OPEN_JOB_LIMIT;
  const canPublishMoreJobs = pro || open < FREE_OPEN_JOB_LIMIT;

  return {
    plan: pro ? "pro" : "free",
    maxOpenJobs,
    canPublishMoreJobs,
    openJobCount: open,
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

export async function canUserCreateOrganization(userId: string): Promise<{
  allowed: boolean;
  ownedCount: number;
  upgradeOrgSlug: string | null;
}> {
  const owned = await prisma.organizationMember.findMany({
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

export function orgUpgradeMessage(kind: "workspace" | "job"): string {
  if (kind === "workspace") {
    return "Free plans include 1 company workspace. Upgrade to Org Pro to create more.";
  }
  return "Free plans include 1 open job posting. Upgrade to Org Pro to publish more roles.";
}
