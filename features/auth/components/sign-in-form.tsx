"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/lib/site";
import { OAuthSignInButtons } from "@/features/auth/components/oauth-sign-in-buttons";
import { useAuthCallback } from "@/features/auth/lib/use-auth-callback";

const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Try Google or GitHub instead.",
  Configuration:
    "Sign-in is temporarily unavailable. Please try again in a few minutes, or contact support if it keeps happening.",
  OAuthCallback:
    "Sign-in didn’t finish. Please try again. If this keeps happening, contact support.",
  AccessDenied: "Sign-in was cancelled or denied.",
  GitHubEmailRequired:
    "GitHub did not share a verified email. Make one primary in GitHub settings and try again.",
  GoogleEmailRequired:
    "Google did not share an email address. Try another account.",
};

type SignInFormProps = {
  githubEnabled: boolean;
  googleEnabled: boolean;
};

export function SignInForm({ githubEnabled, googleEnabled }: SignInFormProps) {
  const searchParams = useSearchParams();
  const { callbackUrl, hiring, withCallback } = useAuthCallback();

  const queryError = searchParams.get("error");
  const authError = queryError
    ? AUTH_ERRORS[queryError] ?? "Sign in failed. Please try again."
    : "";

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-h2 text-text-primary">Welcome back</CardTitle>
        <CardDescription>
          {hiring
            ? "Sign in to post jobs and review Livefolio applications."
            : `Sign in to your ${siteConfig.name} account`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthSignInButtons
          googleEnabled={googleEnabled}
          githubEnabled={githubEnabled}
          callbackUrl={callbackUrl}
        />

        {authError ? (
          <p className="text-center text-body-sm text-danger">{authError}</p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-body-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href={withCallback("/sign-up")}
            className="font-medium text-brand-secondary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
