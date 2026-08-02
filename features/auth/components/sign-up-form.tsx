"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OAuthSignInButtons } from "@/features/auth/components/oauth-sign-in-buttons";
import {
  homePathForAccountType,
  parseAccountType,
  type AccountType,
} from "@/lib/account-type";

function resolveAccountType(searchParams: URLSearchParams): AccountType {
  const asParam = searchParams.get("as");
  if (asParam) return parseAccountType(asParam);

  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  if (callbackUrl.startsWith("/recruiter")) return "recruiter";

  return "portfolio";
}

type SignUpFormProps = {
  githubEnabled: boolean;
  googleEnabled: boolean;
};

export function SignUpForm({ githubEnabled, googleEnabled }: SignUpFormProps) {
  const searchParams = useSearchParams();
  const accountType = resolveAccountType(searchParams);
  const isRecruiter = accountType === "recruiter";
  const callbackUrl =
    searchParams.get("callbackUrl") ?? homePathForAccountType(accountType);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {isRecruiter ? "Create recruiter account" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {isRecruiter
            ? "Start hiring from living proof in minutes"
            : "Start building your portfolio in minutes"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex rounded-[var(--radius-md)] border border-border-default p-1">
          <Link
            href="/sign-up"
            className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-center text-sm font-medium transition-colors ${
              !isRecruiter
                ? "bg-surface-raised text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Portfolio
          </Link>
          <Link
            href="/sign-up?as=recruiter&callbackUrl=/recruiter"
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

        {/* Email/password registration disabled — OAuth only.
        <form onSubmit={handleSubmit} className="space-y-4">
          ...
        </form>
        */}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={
              isRecruiter
                ? "/sign-in?as=recruiter&callbackUrl=/recruiter"
                : "/sign-in"
            }
            className="text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
