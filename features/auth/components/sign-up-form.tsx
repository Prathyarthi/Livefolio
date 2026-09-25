"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OAuthSignInButtons } from "@/features/auth/components/oauth-sign-in-buttons";
import { useAuthCallback } from "@/features/auth/lib/use-auth-callback";

type SignUpFormProps = {
  githubEnabled: boolean;
  googleEnabled: boolean;
};

export function SignUpForm({ githubEnabled, googleEnabled }: SignUpFormProps) {
  const { callbackUrl, hiring, withCallback } = useAuthCallback();

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-h2 text-text-primary">
          Create your account
        </CardTitle>
        <CardDescription>
          {hiring
            ? "Start hiring with Livefolio — one open role is free."
            : "Start building your portfolio in minutes"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthSignInButtons
          googleEnabled={googleEnabled}
          githubEnabled={githubEnabled}
          callbackUrl={callbackUrl}
        />
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-body-sm text-text-muted">
          Already have an account?{" "}
          <Link
            href={withCallback("/sign-in")}
            className="font-medium text-brand-secondary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
