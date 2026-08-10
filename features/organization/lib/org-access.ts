import { prisma } from "@/lib/prisma";
import {
  canManageApplicants,
  canManageJobs,
  canManageOrganization,
  canViewApplicants,
  type OrgRole,
} from "@/features/organization/lib/permissions";

export async function getMembership(organizationId: string, userId: string) {
  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
  });
}

export async function getMembershipByOrgSlug(orgSlug: string, userId: string) {
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      logoUrl: true,
      brandColor: true,
      websiteUrl: true,
      location: true,
      members: {
        where: { userId },
        take: 1,
      },
    },
  });

  if (!org || org.members.length === 0) return null;

  const membership = org.members[0]!;
  return {
    organization: {
      id: org.id,
      slug: org.slug,
      name: org.name,
      description: org.description,
      logoUrl: org.logoUrl,
      brandColor: org.brandColor,
      websiteUrl: org.websiteUrl,
      location: org.location,
    },
    membership,
    role: membership.role as OrgRole,
  };
}

export async function requireOrgMember(organizationId: string, userId: string) {
  const membership = await getMembership(organizationId, userId);
  if (!membership) return null;
  return membership;
}

export async function requireJobManager(organizationId: string, userId: string) {
  const membership = await getMembership(organizationId, userId);
  if (!membership || !canManageJobs(membership.role)) return null;
  return membership;
}

export async function requireOrgAdmin(organizationId: string, userId: string) {
  const membership = await getMembership(organizationId, userId);
  if (!membership || !canManageOrganization(membership.role)) return null;
  return membership;
}

export async function requireApplicantViewer(
  organizationId: string,
  userId: string,
) {
  const membership = await getMembership(organizationId, userId);
  if (!membership || !canViewApplicants(membership.role)) return null;
  return membership;
}

export async function requireApplicantManager(
  organizationId: string,
  userId: string,
) {
  const membership = await getMembership(organizationId, userId);
  if (!membership || !canManageApplicants(membership.role)) return null;
  return membership;
}
