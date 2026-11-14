"use client";

import { useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCompanyVerification,
  useConfirmCompanyVerification,
  useRemoveCompanyVerification,
  useRequestCompanyVerification,
} from "@/features/verification/api/use-workplace-verification";
import { websiteHostname } from "@/features/verification/lib/work-email";

export function CompanyVerificationSection({
  orgSlug,
  websiteUrl,
  verified,
}: {
  orgSlug: string;
  websiteUrl: string | null;
  verified: boolean;
}) {
  const statusQuery = useCompanyVerification(orgSlug);
  const requestCode = useRequestCompanyVerification(orgSlug);
  const confirmCode = useConfirmCompanyVerification(orgSlug);
  const removeVerification = useRemoveCompanyVerification(orgSlug);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailMasked, setEmailMasked] = useState<string | null>(null);

  const host = websiteHostname(websiteUrl);
  const isVerified = verified || statusQuery.data?.verified === true;
  const pendingMasked =
    emailMasked ??
    (statusQuery.data?.status === "pending" ? statusQuery.data.emailMasked : null);
  const pending =
    requestCode.isPending || confirmCode.isPending || removeVerification.isPending;

  async function handleSend() {
    try {
      const result = await requestCode.mutateAsync(email);
      setEmailMasked(result.emailMasked);
      setCode("");
      toast.success(`Code sent to ${result.emailMasked}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the code");
    }
  }

  async function handleConfirm() {
    try {
      await confirmCode.mutateAsync(code);
      setEmailMasked(null);
      setCode("");
      toast.success("Company verified");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not verify that code",
      );
    }
  }

  async function handleRemove() {
    try {
      await removeVerification.mutateAsync();
      setEmail("");
      setCode("");
      setEmailMasked(null);
      toast.success("Verification removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove verification",
      );
    }
  }

  return (
    <section className="space-y-4 border-t border-border-default pt-8">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-h3 text-text-primary">
          Verification
          {isVerified ? (
            <BadgeCheck className="size-5 shrink-0 text-sky-500" aria-label="Verified company" />
          ) : null}
        </h2>
        <p className="text-body-sm text-text-secondary">
          Confirm an email on your website&apos;s domain. A badge then shows
          beside the company name on job pages. The address stays private.
        </p>
      </div>

      {isVerified ? (
        <div className="space-y-3">
          <p className="text-body-sm text-text-secondary">
            This company is verified
            {statusQuery.data?.emailMasked
              ? ` with ${statusQuery.data.emailMasked}`
              : ""}
            . Changing the website to a different domain removes the badge.
          </p>
          <Button variant="outline" onClick={handleRemove} disabled={pending}>
            Remove verification
          </Button>
        </div>
      ) : !host ? (
        <p className="text-body-sm text-text-secondary">
          Add a company website above and save it first. The email has to be
          on that domain.
        </p>
      ) : pendingMasked ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="company-email">Email at {host}</Label>
            <Input
              id="company-email"
              type="email"
              autoComplete="email"
              value={email}
              placeholder={`you@${host}`}
              onChange={(event) => {
                setEmail(event.target.value);
                setCode("");
              }}
            />
            <p className="text-xs text-text-muted">
              Code sent to {pendingMasked}. Wrong address? Enter the correct
              email and send a new code.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-code">Code</Label>
            <Input
              id="company-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              placeholder="6-digit code"
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSend} disabled={pending || !email.trim()}>
              {requestCode.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Email code
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirm}
              disabled={pending || code.length !== 6}
            >
              {confirmCode.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Verify company
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="company-email">Email at {host}</Label>
            <Input
              id="company-email"
              type="email"
              autoComplete="email"
              value={email}
              placeholder={`you@${host}`}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button onClick={handleSend} disabled={pending || !email.trim()}>
            {requestCode.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Email code
          </Button>
        </div>
      )}
    </section>
  );
}