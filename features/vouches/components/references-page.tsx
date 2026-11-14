"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Handshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlowFooter } from "@/features/dashboard/components/flow-footer";
import { CreatePortfolioPrompt } from "@/features/portfolio/components/create-portfolio-prompt";
import { usePortfolio } from "@/features/portfolio/api/use-portfolio";
import {
  useCancelVouch,
  useResendVouch,
  useVouches,
  type AskedVouch,
  type IncomingVouch,
} from "@/features/vouches/api/use-vouches";
import { AskReferenceForm } from "@/features/vouches/components/ask-reference-form";
import { getAppOrigin } from "@/lib/domain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function statusBadge(status: AskedVouch["status"]) {
  if (status === "completed") return <Badge variant="success">Vouched</Badge>;
  if (status === "cancelled") return <Badge variant="neutral">Cancelled</Badge>;
  return <Badge variant="warning">Waiting</Badge>;
}

function PersonRow({
  name,
  detail,
  avatarUrl,
  action,
}: {
  name: string;
  detail: string;
  avatarUrl: string | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border-default py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar size="sm">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary">{name}</p>
          <p className="text-body-sm text-text-secondary">{detail}</p>
        </div>
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

function IncomingCard({ row }: { row: IncomingVouch }) {
  return (
    <PersonRow
      name={row.requester.name}
      detail={row.requester.headline || "Asked you to vouch"}
      avatarUrl={row.requester.avatarUrl}
      action={
        <Button size="sm" asChild>
          <Link href={row.sharePath}>Write it</Link>
        </Button>
      }
    />
  );
}

function AskedCard({ row }: { row: AskedVouch }) {
  const cancel = useCancelVouch();
  const resend = useResendVouch();
  const [cancelOpen, setCancelOpen] = useState(false);
  const shareUrl = `${getAppOrigin()}${row.sharePath}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <div className="border-b border-border-default py-4 last:border-b-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-text-primary">
              {row.inviteName || row.inviteEmail}
            </p>
            {statusBadge(row.status)}
          </div>
          <p className="text-body-sm text-text-secondary">{row.inviteEmail}</p>
          {row.status === "completed" && row.story ? (
            <p className="mt-2 text-body-sm text-text-primary">“{row.story}”</p>
          ) : null}
        </div>
        {row.status === "pending" ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void copyLink()}>
              Copy link
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!row.canResend || resend.isPending}
              onClick={() => {
                resend.mutate(row.id, {
                  onSuccess: (result) => {
                    toast.success(
                      result.emailSent
                        ? "Email resent"
                        : "Email didn't send — copy the link instead",
                    );
                  },
                  onError: (error) => toast.error(error.message),
                });
              }}
            >
              Resend
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={cancel.isPending}
              onClick={() => setCancelOpen(true)}
            >
              Cancel
            </Button>
          </div>
        ) : null}
      </div>
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this request?</DialogTitle>
            <DialogDescription>
              Cancelling still uses this ask. You cannot replace it with someone
              else.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={cancel.isPending}
            >
              Keep request
            </Button>
            <Button
              variant="destructive"
              disabled={cancel.isPending}
              onClick={() => {
                cancel.mutate(row.id, {
                  onSuccess: () => {
                    setCancelOpen(false);
                    toast.success("Request cancelled. This ask still counts.");
                  },
                  onError: (error) => toast.error(error.message),
                });
              }}
            >
              {cancel.isPending ? "Cancelling…" : "Cancel request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ReferencesPage() {
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data, isLoading } = useVouches();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-[var(--space-6)] py-2">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href="/dashboard/edit?step=references">
          <ArrowLeft className="h-4 w-4" />
          Back to Edit
        </Link>
      </Button>
      <header className="space-y-1">
        <p className="eyebrow uppercase">References</p>
        <h1 className="text-h2 text-text-primary">Manage requests</h1>
        <p className="text-body-sm text-text-secondary">
          Named vouches beat a polished CV. Recruiters see them when they
          review you - they are not shown on your public Livefolio.
        </p>
      </header>

      {!portfolio && !portfolioLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Create your portfolio first</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-body-sm text-text-secondary">
              Create a portfolio first, then ask people who have actually worked
              with you. Recruiters see the vouches; your public Livefolio does
              not.
            </p>
            <CreatePortfolioPrompt />
          </CardContent>
        </Card>
      ) : (
        <>
          {data?.incoming.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-h3">Asked of you</CardTitle>
              </CardHeader>
              <CardContent>
                {data.incoming.map((row) => (
                  <IncomingCard key={row.id} row={row} />
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-h3">
                <Handshake className="h-5 w-5 text-brand-primary" aria-hidden />
                Ask for a reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AskReferenceForm
                limits={data?.limits}
                disabledReason={
                  portfolioLoading ? "Loading your portfolio…" : null
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">People you asked</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="py-6 text-body-sm text-text-muted">Loading…</p>
              ) : data?.asked.length ? (
                data.asked.map((row) => <AskedCard key={row.id} row={row} />)
              ) : (
                <p className="py-6 text-body-sm text-text-secondary">
                  No asks yet. Start with two or three people who would stake
                  their name on you.
                </p>
              )}
            </CardContent>
          </Card>

          {data?.given.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-h3">You vouched for</CardTitle>
              </CardHeader>
              <CardContent>
                {data.given.map((row) => (
                  <PersonRow
                    key={row.id}
                    name={row.requester.name}
                    detail={row.requester.headline || "You vouched for them"}
                    avatarUrl={row.requester.avatarUrl}
                    action={
                      row.requester.portfolioUrl ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={row.requester.portfolioUrl} target="_blank">
                            View Livefolio
                          </Link>
                        </Button>
                      ) : null
                    }
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      <FlowFooter
        message="Ask people who have seen you work — not a crowd."
        previous={{
          href: "/dashboard/edit?step=references",
          label: "Back to Edit",
        }}
        next={{ href: "/dashboard/preview", label: "Preview portfolio" }}
      />
    </div>
  );
}