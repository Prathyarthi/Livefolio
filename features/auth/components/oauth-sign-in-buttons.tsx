"use client";

import { useState, type ReactNode } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon, GithubIcon as Github } from "@/components/icons";
import {
  homePathForAccountType,
  setLoginIntentCookie,
  type AccountType,
} from "@/lib/account-type";

type OAuthProviderButtonProps = {
  provider: "google" | "github";
  accountType: AccountType;
  callbackUrl?: string;
  label: string;
  icon: ReactNode;
};

function OAuthProviderButton({
  provider,
  accountType,
  callbackUrl,
  label,
  icon,
}: OAuthProviderButtonProps) {
  const [loading, setLoading] = useState(false);
  const resolvedCallback =
    callbackUrl ?? homePathForAccountType(accountType);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        setLoginIntentCookie(accountType);
        void signIn(provider, { callbackUrl: resolvedCallback });
      }}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <span className="mr-2 flex h-4 w-4 items-center justify-center">{icon}</span>
      )}
      {label}
    </Button>
  );
}

type OAuthSignInButtonsProps = {
  googleEnabled: boolean;
  githubEnabled: boolean;
  accountType?: AccountType;
  callbackUrl?: string;
};

export function OAuthSignInButtons({
  googleEnabled,
  githubEnabled,
  accountType = "portfolio",
  callbackUrl,
}: OAuthSignInButtonsProps) {
  if (!googleEnabled && !githubEnabled) {
    return (
      <p className="rounded-[var(--radius-md)] border border-border-default bg-surface-sunken px-3 py-2 text-center text-xs text-text-muted">
        Social sign-in is not configured. Add Google or GitHub OAuth credentials
        to your <code className="font-mono">.env</code>.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {googleEnabled ? (
        <OAuthProviderButton
          provider="google"
          accountType={accountType}
          callbackUrl={callbackUrl}
          label="Continue with Google"
          icon={<GoogleIcon className="h-4 w-4" />}
        />
      ) : null}
      {githubEnabled ? (
        <OAuthProviderButton
          provider="github"
          accountType={accountType}
          callbackUrl={callbackUrl}
          label="Continue with GitHub"
          icon={<Github className="h-4 w-4" />}
        />
      ) : null}
    </div>
  );
}
