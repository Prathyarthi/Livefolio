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
import { safeCallbackPath } from "@/lib/auth-callback";

const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Try Google or GitHub instead.",
  Configuration:
    "Social sign-in is misconfigured. Check server environment variables (NEXTAUTH_SECRET, NEXTAUTH_URL, Google/GitHub OAuth).",
  OAuthCallback:
    "Sign-in could not finish saving your account. If this persists, the database may be missing a recent migration.",
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

  const queryError = searchParams.get("error");
  const authError = queryError
    ? AUTH_ERRORS[queryError] ?? "Sign in failed. Please try again."
    : "";
  const callbackUrl =
    safeCallbackPath(searchParams.get("callbackUrl")) ?? "/dashboard";
  const signUpHref = `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>Sign in to your {siteConfig.name} account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthSignInButtons
          googleEnabled={googleEnabled}
          githubEnabled={githubEnabled}
          callbackUrl={callbackUrl}
        />

        {authError ? (
          <p className="text-sm text-destructive text-center">{authError}</p>
        ) : null}

        {/* Email/password sign-in disabled — OAuth only.
        <form onSubmit={handleSubmit} className="space-y-4">
          ...
        </form>
        */}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href={signUpHref} className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
