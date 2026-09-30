import type { Metadata } from "next";
import { isGitHubAuthEnabled, isGoogleAuthEnabled } from "@/lib/auth-providers";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Sign Up Free",
  description:
    "Create a free Livefolio account. Build a professional portfolio from your resume, pick a template, publish on your subdomain, and connect GitHub, Medium, and LeetCode.",
  path: "/sign-up",
  noIndex: true,
});

export default function SignUpPage() {
  return (
    <SignUpForm
      githubEnabled={isGitHubAuthEnabled()}
      googleEnabled={isGoogleAuthEnabled()}
    />
  );
}
