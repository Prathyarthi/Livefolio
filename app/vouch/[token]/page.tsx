import type { Metadata } from "next";
import { VouchPage } from "@/features/vouches/components/vouch-page";
import { isGitHubAuthEnabled, isGoogleAuthEnabled } from "@/lib/auth-providers";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Vouch",
  description:
    "Put your name behind someone you have worked with. Two questions, under a minute.",
  path: "/vouch",
  noIndex: true,
});

export default async function VouchTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <VouchPage
      token={token}
      githubEnabled={isGitHubAuthEnabled()}
      googleEnabled={isGoogleAuthEnabled()}
    />
  );
}
