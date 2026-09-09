import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { CompanyShell } from "@/features/organization/components/company-shell";
import { getMembershipByOrgSlug } from "@/features/organization/lib/org-access";

export default async function CompanyOrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent(`/company/${orgSlug}`)}`,
    );
  }

  const access = await getMembershipByOrgSlug(orgSlug, session.user.id);
  if (!access) {
    notFound();
  }

  return <CompanyShell>{children}</CompanyShell>;
}
