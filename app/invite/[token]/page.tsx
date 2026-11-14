import type { Metadata } from "next";
import { OrgInvitePage } from "@/features/organization/components/org-invite-page";
import { isGitHubAuthEnabled, isGoogleAuthEnabled } from "@/lib/auth-providers";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Team invite",
  description: "Accept an invitation to join a company on Livefolio.",
  path: "/invite",
  noIndex: true,
});

export default async function OrgInviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <OrgInvitePage
      token={token}
      githubEnabled={isGitHubAuthEnabled()}
      googleEnabled={isGoogleAuthEnabled()}
    />
  );
}