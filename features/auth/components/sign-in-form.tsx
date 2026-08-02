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
import {
  homePathForAccountType,
  parseAccountType,
  type AccountType,
} from "@/lib/account-type";

const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Try Google or GitHub instead.",
  Configuration:
    "Social sign-in is misconfigured. Check server environment variables.",
  AccessDenied: "Sign-in was cancelled or denied.",
  GitHubEmailRequired:
    "GitHub did not share a verified email. Make one primary in GitHub settings and try again.",
  GoogleEmailRequired:
    "Google did not share an email address. Try another account.",
};

function resolveAccountType(searchParams: URLSearchParams): AccountType {
  const asParam = searchParams.get("as");
  if (asParam) return parseAccountType(asParam);

  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  if (callbackUrl.startsWith("/recruiter")) return "recruiter";

  return "portfolio";
}

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

  const accountType = resolveAccountType(searchParams);
  const isRecruiter = accountType === "recruiter";
  const callbackUrl =
    searchParams.get("callbackUrl") ?? homePathForAccountType(accountType);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {isRecruiter ? "Recruiter sign in" : "Welcome back"}
        </CardTitle>
        <CardDescription>
          {isRecruiter
            ? `Sign in to the ${siteConfig.name} recruiter workspace`
            : `Sign in to your ${siteConfig.name} account`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex rounded-[var(--radius-md)] border border-border-default p-1">
          <Link
            href="/sign-in"
            className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-center text-sm font-medium transition-colors ${
              !isRecruiter
                ? "bg-surface-raised text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Portfolio
          </Link>
          <Link
            href="/sign-in?as=recruiter&callbackUrl=/recruiter"
            className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-center text-sm font-medium transition-colors ${
              isRecruiter
                ? "bg-surface-raised text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Recruiter
          </Link>
        </div>

        <OAuthSignInButtons
          googleEnabled={googleEnabled}
          githubEnabled={githubEnabled}
          accountType={accountType}
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
          <Link
            href={
              isRecruiter
                ? "/sign-up?as=recruiter&callbackUrl=/recruiter"
                : "/sign-up"
            }
            className="text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
