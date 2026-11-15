"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  VOUCH_NOTE_MAX_CHARS,
} from "@/features/vouches/lib/constants";
import {
  useAskForVouch,
  type VouchLimits,
} from "@/features/vouches/api/use-vouches";
import { getAppOrigin } from "@/lib/domain";

export function AskReferenceForm({
  limits,
  disabledReason,
}: {
  limits: VouchLimits | undefined;
  disabledReason?: string | null;
}) {
  const ask = useAskForVouch();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const atLimit = limits != null && limits.remaining <= 0;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await ask.mutateAsync({
        email,
        name: name.trim() || undefined,
        note: note.trim() || undefined,
      });
      const shareUrl = `${getAppOrigin()}${result.vouch.sharePath}`;
      if (result.emailSent) {
        toast.success("Request sent. You can also copy the link.");
      } else {
        toast.message("Email didn't send. Share this link instead.", {
          description: shareUrl,
        });
      }
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // Clipboard is optional.
      }
      setEmail("");
      setName("");
      setNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="vouch-email">Their email</Label>
        <Input
          id="vouch-email"
          type="email"
          required
          autoComplete="email"
          placeholder="alex@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={atLimit || Boolean(disabledReason)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vouch-name">Name (optional)</Label>
        <Input
          id="vouch-name"
          type="text"
          placeholder="Alex"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={atLimit || Boolean(disabledReason)}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="vouch-note">Short note (optional)</Label>
          <span className="text-xs text-text-muted">
            {note.length}/{VOUCH_NOTE_MAX_CHARS}
          </span>
        </div>
        <Textarea
          id="vouch-note"
          rows={3}
          maxLength={VOUCH_NOTE_MAX_CHARS}
          placeholder="Remind them where you worked together."
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={atLimit || Boolean(disabledReason)}
        />
      </div>

      {disabledReason ? (
        <p className="text-body-sm text-text-secondary">{disabledReason}</p>
      ) : atLimit ? (
        <p className="text-body-sm text-text-secondary">
          You&apos;ve used {limits?.used} of {limits?.max} asks.
          {limits?.tier === "free" ? (
            <>
              {" "}
              <Link href="/pricing" className="text-brand-primary hover:underline">
                Upgrade to Pro
              </Link>{" "}
              to ask more people.
            </>
          ) : null}
        </p>
      ) : (
        <p className="text-xs text-text-muted">
          They need a Livefolio account to put their name on it.{" "}
          {limits
            ? `${limits.remaining} of ${limits.max} asks left.`
            : null}
        </p>
      )}

      <Button
        type="submit"
        disabled={ask.isPending || atLimit || Boolean(disabledReason)}
      >
        {ask.isPending ? "Sending…" : "Ask for a reference"}
      </Button>
    </form>
  );
}