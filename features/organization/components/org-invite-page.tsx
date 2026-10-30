"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { OAuthSignInButtons } from "@/features/auth/components/oauth-sign-in-buttons";
import { safeCallbackPath } from "@/lib/auth-callback";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  recruiter: "Recruiter",
  hiring_manager: "Hiring manager",
};

type InviteDetails = {
  status: "pending" | "accepted";
  organizationName: string;
  organizationSlug: string;
  email: string;
  role: string;
};

async function loadInvite(token: string): Promise<InviteDetails> {
  const res = await fetch(`/api/organizations/join/${token}`, {
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as
    | (InviteDetails & { error?: string })
    | null;
  if (!res.ok) {
    throw new Error(body?.error ?? "This invite is no longer available.");
  }
  return body as InviteDetails;
}

export function OrgInvitePage({
  token,
  githubEnabled,
  googleEnabled,
}: {
  token: string;
  githubEnabled: boolean;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ["org-invite", token],
    queryFn: () => loadInvite(token),
  });
  const [accepting, setAccepting] = useState(false);
  const callbackUrl = safeCallbackPath(`/invite/${token}`) ?? `/invite/${token}`;
  const sessionEmail = session?.user?.email?.trim().toLowerCase() ?? "";
  const matches =
    Boolean(data?.email) && sessionEmail === data?.email.trim().toLowerCase();

  async function accept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/organizations/join/${token}`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        organizationSlug?: string | null;
      } | null;
      if (!res.ok) {
        throw new Error(body?.error ?? "Could not accept this invite.");
      }
      toast.success("You joined the team");
      router.push(
        body?.organizationSlug
          ? `/company/${body.organizationSlug}`
          : "/company",
      );
    } catch (acceptError) {
      toast.error(
        acceptError instanceof Error
          ? acceptError.message
          : "Could not accept this invite.",
      );
      setAccepting(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-4 py-10">
      <div className="flex justify-center">
        <Logo />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : error || !data ? (
        <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 text-center">
          <h1 className="text-h3 text-text-primary">Invite unavailable</h1>
          <p className="mt-2 text-body-sm text-text-secondary">
            {error instanceof Error
              ? error.message
              : "This link may have expired or been withdrawn."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
            <p className="eyebrow uppercase">Team invite</p>
            <h1 className="text-h2 text-text-primary">
              Join {data.organizationName}
            </h1>
            <p className="mt-2 text-body-sm text-text-secondary">
              You&apos;ll join as {ROLE_LABELS[data.role] ?? "a teammate"}. Use{" "}
              {data.email} to accept.
            </p>
          </div>

          {data.status === "accepted" ? (
            <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6">
              <p className="text-h3 text-text-primary">Already accepted</p>
              <Button className="mt-4" asChild>
                <Link href={`/company/${data.organizationSlug}`}>
                  Open {data.organizationName}
                </Link>
              </Button>
            </div>
          ) : status === "unauthenticated" ? (
            <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6">
              <h2 className="text-h3 text-text-primary">Sign in to accept</h2>
              <p className="mt-2 mb-4 text-body-sm text-text-secondary">
                Sign in with {data.email}. That address is the one this invite
                was sent to.
              </p>
              <OAuthSignInButtons
                googleEnabled={googleEnabled}
                githubEnabled={githubEnabled}
                callbackUrl={callbackUrl}
              />
              <p className="mt-4 text-center text-sm text-text-muted">
                New here?{" "}
                <Link
                  href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  className="text-brand-primary hover:underline"
                >
                  Create an account
                </Link>{" "}
                with that email.
              </p>
            </div>
          ) : status === "loading" ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            </div>
          ) : !matches ? (
            <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6">
              <h2 className="text-h3 text-text-primary">Wrong account</h2>
              <p className="mt-2 mb-4 text-body-sm text-text-secondary">
                This invite was sent to {data.email}. Sign in with that account
                to join.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void signOut({ callbackUrl: `/invite/${token}` })}
              >
                Switch account
              </Button>
            </div>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6">
              <Button
                type="button"
                disabled={accepting}
                onClick={() => void accept()}
              >
                {accepting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Accept invite
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}