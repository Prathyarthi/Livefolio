"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OAuthSignInButtons } from "@/features/auth/components/oauth-sign-in-buttons";
import {
  VOUCH_RELATIONSHIPS,
  VOUCH_RELATIONSHIP_LABELS,
  VOUCH_STORY_MAX_CHARS,
  VOUCH_STORY_MIN_CHARS,
  type VouchRelationship,
} from "@/features/vouches/lib/constants";
import { useSubmitVouch, useVouchToken } from "@/features/vouches/api/use-vouches";
import { isVouchRelationship } from "@/features/vouches/lib/validation";
import { safeCallbackPath } from "@/lib/auth-callback";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function VouchPage({
  token,
  githubEnabled,
  googleEnabled,
}: {
  token: string;
  githubEnabled: boolean;
  googleEnabled: boolean;
}) {
  const { status } = useSession();
  const { data, isLoading, error } = useVouchToken(token);
  const submit = useSubmitVouch(token);
  const [relationship, setRelationship] = useState<VouchRelationship | "">("");
  const [story, setStory] = useState("");
  const callbackUrl = safeCallbackPath(`/vouch/${token}`) ?? `/vouch/${token}`;

  const requesterName = data?.requester.name ?? "this person";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!relationship) {
      toast.error("Say how you know them");
      return;
    }
    try {
      await submit.mutateAsync({
        relationship,
        story,
      });
      toast.success("Thank you — recruiters can see this reference");
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "Could not submit",
      );
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
          <h1 className="text-h3 text-text-primary">Request not found</h1>
          <p className="mt-2 text-body-sm text-text-secondary">
            This link may have expired or been withdrawn.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <Avatar size="lg">
                {data.requester.avatarUrl ? (
                  <AvatarImage src={data.requester.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback>
                  {requesterName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="eyebrow uppercase">Vouch</p>
                <h1 className="text-h2 text-text-primary">
                  Vouch for {firstName(requesterName)}
                </h1>
                {data.requester.headline ? (
                  <p className="mt-1 text-body-sm text-text-secondary">
                    {data.requester.headline}
                  </p>
                ) : null}
              </div>
            </div>
            {data.personalNote ? (
              <blockquote className="mt-4 border-l-2 border-brand-primary pl-3 text-body-sm text-text-secondary">
                {data.personalNote}
              </blockquote>
            ) : null}
          </div>

          {data.status === "cancelled" ? (
            <p className="text-center text-body-sm text-text-secondary">
              This request was withdrawn.
            </p>
          ) : data.status === "completed" || data.completed ? (
            <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6">
              <p className="text-h3 text-text-primary">Already submitted</p>
              <p className="mt-2 text-body-sm text-text-secondary">
                {data.completed
                  ? "Thanks — recruiters can see this when they review them."
                  : "Someone already vouched with this link."}
              </p>
              {data.requester.portfolioUrl ? (
                <Button className="mt-4" variant="outline" asChild>
                  <Link href={data.requester.portfolioUrl} target="_blank">
                    View their Livefolio
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : data.isRequester ? (
            <p className="text-center text-body-sm text-text-secondary">
              This is your own request. Share it with someone who has worked with
              you.
            </p>
          ) : status === "unauthenticated" ? (
            <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6">
              <h2 className="text-h3 text-text-primary">Sign in to vouch</h2>
              <p className="mt-2 mb-4 text-body-sm text-text-secondary">
                Sign in with {data.inviteEmail}. You need that Livefolio account
                so your name is attached.
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
          ) : !data.isInvitee ? (
            <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6">
              <h2 className="text-h3 text-text-primary">Wrong account</h2>
              <p className="mt-2 mb-4 text-body-sm text-text-secondary">
                This invite was sent to {data.inviteEmail}. Sign in with that
                account to vouch.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void signOut({ callbackUrl: `/vouch/${token}` })
                }
              >
                Switch account
              </Button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="space-y-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]"
            >
              <p className="text-body-sm text-text-secondary">
                Two questions. Under a minute. Recruiters see your name when
                they review this person — not the public Livefolio.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="vouch-relationship">How do you know them?</Label>
                <Select
                  value={relationship || undefined}
                  onValueChange={(value) => {
                    if (isVouchRelationship(value)) setRelationship(value);
                  }}
                >
                  <SelectTrigger id="vouch-relationship" className="w-full">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOUCH_RELATIONSHIPS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {VOUCH_RELATIONSHIP_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="vouch-story">
                    One specific thing they are great at
                  </Label>
                  <span className="text-xs text-text-muted">
                    {story.length}/{VOUCH_STORY_MAX_CHARS}
                  </span>
                </div>
                <Textarea
                  id="vouch-story"
                  required
                  minLength={VOUCH_STORY_MIN_CHARS}
                  maxLength={VOUCH_STORY_MAX_CHARS}
                  rows={4}
                  placeholder="A concrete story — not “great teammate.”"
                  value={story}
                  onChange={(event) => setStory(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submit.isPending}>
                {submit.isPending
                  ? "Submitting…"
                  : `Vouch for ${firstName(requesterName)}`}
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
