import { prisma } from "@/lib/prisma";
import {
  RECRUITER_LIMITS,
  recruiterLimitMessage,
} from "@/lib/recruiter-entitlements";

export function slugifyOrgName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "org";
}

export async function uniqueOrgSlug(name: string): Promise<string> {
  const base = slugifyOrgName(name);
  let slug = base;
  let i = 0;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

export async function getMembership(userId: string, orgId?: string) {
  if (orgId) {
    return prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
      include: { organization: true },
    });
  }
  return prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function requireOrgMember(userId: string, orgId?: string) {
  const membership = await getMembership(userId, orgId);
  if (!membership) {
    return { error: "No organization membership", status: 403 as const };
  }
  return { membership, org: membership.organization };
}

export async function countOwnedOrgs(userId: string) {
  return prisma.organizationMember.count({
    where: { userId, role: "owner" },
  });
}

export async function assertCanCreateOrg(userId: string) {
  const owned = await countOwnedOrgs(userId);
  if (owned >= RECRUITER_LIMITS.maxOrgsPerUser) {
    return {
      ok: false as const,
      code: "ORG_LIMIT" as const,
      message: recruiterLimitMessage("ORG_LIMIT"),
    };
  }
  return { ok: true as const };
}

export async function assertCanAddCandidate(orgId: string) {
  const count = await prisma.recruiterCandidate.count({
    where: { orgId, status: "active" },
  });
  if (count >= RECRUITER_LIMITS.maxActiveCandidatesPerOrg) {
    return {
      ok: false as const,
      code: "CANDIDATE_LIMIT" as const,
      message: recruiterLimitMessage("CANDIDATE_LIMIT"),
    };
  }
  return { ok: true as const };
}

export async function assertEnrichmentQuota(orgId: string) {
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);
  const count = await prisma.recruiterCandidate.count({
    where: {
      orgId,
      source: "resume_upload",
      createdAt: { gte: since },
    },
  });
  if (count >= RECRUITER_LIMITS.maxResumeEnrichmentsPerMonth) {
    return {
      ok: false as const,
      code: "ENRICHMENT_LIMIT" as const,
      message: recruiterLimitMessage("ENRICHMENT_LIMIT"),
    };
  }
  return { ok: true as const };
}

export async function assertSearchQuota(orgId: string) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const count = await prisma.recruiterSearchQuery.count({
    where: { orgId, createdAt: { gte: since } },
  });
  if (count >= RECRUITER_LIMITS.maxSearchesPerDay) {
    return {
      ok: false as const,
      code: "SEARCH_LIMIT" as const,
      message: recruiterLimitMessage("SEARCH_LIMIT"),
    };
  }
  return { ok: true as const };
}
