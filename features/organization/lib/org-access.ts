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

export async function listAccessibleWorkspaces(
  organizationId: string,
  userId: string,
  role: string,
) {
  if (canManageOrganization(role)) {
    return prisma.workspace.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });
  }

  return prisma.workspace.findMany({
    where: {
      organizationId,
      members: { some: { userId } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWorkspaceBySlug(
  organizationId: string,
  workspaceSlug: string,
) {
  return prisma.workspace.findUnique({
    where: {
      organizationId_slug: { organizationId, slug: workspaceSlug },
    },
  });
}

export async function requireWorkspaceAccess(
  organizationId: string,
  workspaceSlug: string,
  userId: string,
) {
  const membership = await getMembership(organizationId, userId);
  if (!membership) return null;

  const workspace = await getWorkspaceBySlug(organizationId, workspaceSlug);
  if (!workspace) return null;

  if (canManageOrganization(membership.role)) {
    return { membership, role: membership.role as OrgRole, workspace };
  }

  const assigned = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId,
      },
    },
    select: { id: true },
  });
  if (!assigned) return null;

  return { membership, role: membership.role as OrgRole, workspace };
}

export async function requireWorkspaceJobManager(
  organizationId: string,
  workspaceSlug: string,
  userId: string,
) {
  const access = await requireWorkspaceAccess(
    organizationId,
    workspaceSlug,
    userId,
  );
  if (!access || !canManageJobs(access.role)) return null;
  return access;
}

export async function requireWorkspaceApplicantViewer(
  organizationId: string,
  workspaceId: string,
  userId: string,
) {
  const membership = await requireApplicantViewer(organizationId, userId);
  if (!membership) return null;
  if (canManageOrganization(membership.role)) return membership;

  const assigned = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    select: { id: true },
  });
  if (!assigned) return null;
  return membership;
}

export async function requireWorkspaceApplicantManager(
  organizationId: string,
  workspaceId: string,
  userId: string,
) {
  const membership = await requireApplicantManager(organizationId, userId);
  if (!membership) return null;
  if (canManageOrganization(membership.role)) return membership;

  const assigned = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    select: { id: true },
  });
  if (!assigned) return null;
  return membership;
}
