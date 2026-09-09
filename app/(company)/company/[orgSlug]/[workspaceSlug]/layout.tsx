import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import {
  getMembershipByOrgSlug,
  requireWorkspaceAccess,
} from "@/features/organization/lib/org-access";

export default async function CompanyWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}) {
  const { orgSlug, workspaceSlug } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent(
        `/company/${orgSlug}/${workspaceSlug}`,
      )}`,
    );
  }

  const access = await getMembershipByOrgSlug(orgSlug, session.user.id);
  if (!access) {
    notFound();
  }

  const workspaceAccess = await requireWorkspaceAccess(
    access.organization.id,
    workspaceSlug,
    session.user.id,
  );
  if (!workspaceAccess) {
    notFound();
  }

  return children;
}