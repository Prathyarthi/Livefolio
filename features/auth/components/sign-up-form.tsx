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
import { safeCallbackPath } from "@/lib/auth-callback";

type SignUpFormProps = {
  githubEnabled: boolean;
  googleEnabled: boolean;
};

export function SignUpForm({ githubEnabled, googleEnabled }: SignUpFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl =
    safeCallbackPath(searchParams.get("callbackUrl")) ?? "/dashboard";
  const signInHref = `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
        <CardDescription>Start building your portfolio in minutes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthSignInButtons
          googleEnabled={googleEnabled}
          githubEnabled={githubEnabled}
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
          <Link href={signInHref} className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
