import type { Metadata } from "next";
import { Suspense } from "react";
import { isGitHubAuthEnabled, isGoogleAuthEnabled } from "@/lib/auth-providers";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Sign In",
  description:
    "Sign in to Livefolio to edit your portfolio, publish updates, manage billing, and import from resume, GitHub, Medium, or LeetCode.",
  path: "/sign-in",
  noIndex: true,
});

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm
        githubEnabled={isGitHubAuthEnabled()}
        googleEnabled={isGoogleAuthEnabled()}
      />
    </Suspense>
  );
}
