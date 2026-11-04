"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Lock, Mail, Plus, Sparkles, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel } from "@/features/organization/components/workspace-ui";
import { useOrganization } from "@/features/organization/api/use-organization";
import { useCurrent } from "@/features/auth/api/use-current";
import { useCreateJob, type Job } from "@/features/jobs/api/use-jobs";
import {
  useAgentConfig,
  useDraftJob,
  useSendInvite,
  useShortlist,
  type ShortlistResponse,
} from "@/features/agent-hiring/api/use-agent-hiring";
import { draftToJobInput, type DraftJob } from "@/features/agent-hiring/lib/brief";
import { draftInvite, type ShortlistCandidate } from "@/features/agent-hiring/lib/shortlist";

type Invite = { subject: string; body: string; sent?: boolean };

function errorInfo(error: unknown) {
  const e = error as { message?: string; upgradeRequired?: boolean; upgradeOrgSlug?: string };
  return {
    message: e?.message ?? "Something went wrong",
    upgradeRequired: e?.upgradeRequired === true,
  };
}

export function AgentHiringPage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string }>();
  const { orgSlug, workspaceSlug } = params;
  const router = useRouter();
  const { data: org } = useOrganization(orgSlug);
  const { user } = useCurrent();
  const config = useAgentConfig();
  const draftJob = useDraftJob(orgSlug, workspaceSlug);
  const createJob = useCreateJob(orgSlug);
  const shortlist = useShortlist(orgSlug, workspaceSlug);
  const sendInvite = useSendInvite(orgSlug, workspaceSlug);

  const [brief, setBrief] = useState("");
  const [draft, setDraft] = useState<DraftJob | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [result, setResult] = useState<ShortlistResponse | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [invites, setInvites] = useState<Record<string, Invite>>({});

  const llmOff = config.data ? !config.data.llmConfigured : false;
  const talentLocked = org ? org.planTier === "free" : false;

  async function handleDraft() {
    try {
      const res = await draftJob.mutateAsync(brief);
      setDraft(res.draft);
    } catch (error) {
      toast.error(errorInfo(error).message);
    }
  }

  async function handleApprove(publish: boolean) {
    if (!draft) return;
    if (!draft.title.trim() || !draft.summary.trim()) {
      toast.error("Add a title and a summary first.");
      return;
    }
    try {
      const created = await createJob.mutateAsync({
        ...draftToJobInput({
          ...draft,
          requirements: draft.requirements.filter((r) => r.label.trim()),
        }),
        workspaceSlug,
        status: publish ? "published" : "draft",
      });
      setJob(created);
      toast.success(publish ? "Job published" : "Draft saved");
      const res = await shortlist.mutateAsync(created.id);
      setResult(res);
    } catch (error) {
      const info = errorInfo(error);
      toast.error(
        info.message,
        info.upgradeRequired
          ? { action: { label: "Upgrade", onClick: () => router.push(`/company/${orgSlug}/billing`) } }
          : undefined,
      );
    }
  }

  function key(c: ShortlistCandidate) {
    return `${c.source}:${c.ref}`;
  }

  function draftInvites() {
    if (!result || !job) return;
    const next: Record<string, Invite> = { ...invites };
    for (const c of result.candidates) {
      const k = key(c);
      if (!selected[k] || next[k]) continue;
      next[k] = draftInvite({
        candidateName: c.name,
        source: c.source,
        jobTitle: job.title,
        orgName: org?.name ?? "our team",
        jobUrl: `${window.location.origin}/jobs/${job.slug}`,
        reasons: c.reasons,
        senderName: user?.name ?? "",
      });
    }
    setInvites(next);
  }

  async function send(c: ShortlistCandidate) {
    if (!job) return;
    const inv = invites[key(c)];
    try {
      await sendInvite.mutateAsync({
        jobId: job.id,
        source: c.source,
        ref: c.ref,
        subject: inv.subject,
        body: inv.body,
      });
      setInvites((prev) => ({ ...prev, [key(c)]: { ...inv, sent: true } }));
      toast.success(`Invite sent to ${c.name}`);
    } catch (error) {
      toast.error(errorInfo(error).message);
    }
  }

  function patchDraft(patch: Partial<DraftJob>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
      <PageHeader
        eyebrow="Hiring agent"
        title="Describe the hire. The agent finds the people."
        description="Write what you need in plain words. The agent drafts the job for you to approve, then ranks your recent applicants and people open to work, and drafts invites you send yourself."
      />

      {llmOff ? (
        <Alert>
          <Sparkles className="size-4" />
          <AlertTitle>Hiring agent is not configured</AlertTitle>
          <AlertDescription>
            Drafting needs an AI key on the server (OPENROUTER_API_KEY). You can still{" "}
            <Link className="underline" href={`/company/${orgSlug}/${workspaceSlug}/jobs/new`}>
              create a job by hand
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Step 1: describe */}
      <Panel className="space-y-3 p-4 md:p-6">
        <Label htmlFor="brief">1. What do you need?</Label>
        <Textarea
          id="brief"
          rows={4}
          value={brief}
          maxLength={4000}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. Need someone to fix our onboarding drop-off. Remote, mid-level."
          disabled={llmOff || Boolean(job)}
        />
        <Button
          onClick={handleDraft}
          disabled={llmOff || draftJob.isPending || brief.trim().length < 12 || Boolean(job)}
        >
          <Sparkles className="size-4" />
          {draftJob.isPending ? "Drafting…" : draft ? "Redraft" : "Draft the job"}
        </Button>
      </Panel>

      {/* Step 2: review draft */}
      {draft ? (
        <Panel className="space-y-4 p-4 md:p-6">
          <p className="font-medium text-text-primary">2. Review the draft</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draft.title}
                disabled={Boolean(job)}
                onChange={(e) => patchDraft({ title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                rows={5}
                value={draft.summary}
                disabled={Boolean(job)}
                onChange={(e) => patchDraft({ summary: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Workplace</Label>
              <Select
                value={draft.workplaceType ?? "unset"}
                disabled={Boolean(job)}
                onValueChange={(v) =>
                  patchDraft({ workplaceType: v === "unset" ? null : (v as DraftJob["workplaceType"]) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not set</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="on_site">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="years">Minimum years</Label>
              <Input
                id="years"
                type="number"
                min={0}
                max={50}
                value={draft.experienceMin ?? ""}
                disabled={Boolean(job)}
                onChange={(e) =>
                  patchDraft({ experienceMin: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={draft.location ?? ""}
                disabled={Boolean(job)}
                onChange={(e) => patchDraft({ location: e.target.value || null })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Requirements</Label>
            {draft.requirements.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={r.type}
                  disabled={Boolean(job)}
                  onValueChange={(v) =>
                    patchDraft({
                      requirements: draft.requirements.map((x, j) =>
                        j === i ? { ...x, type: v as "required" | "preferred" } : x,
                      ),
                    })
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">Required</SelectItem>
                    <SelectItem value="preferred">Preferred</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={r.label}
                  disabled={Boolean(job)}
                  onChange={(e) =>
                    patchDraft({
                      requirements: draft.requirements.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x,
                      ),
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove requirement"
                  disabled={Boolean(job)}
                  onClick={() =>
                    patchDraft({ requirements: draft.requirements.filter((_, j) => j !== i) })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {!job ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  patchDraft({
                    requirements: [
                      ...draft.requirements,
                      { type: "required", category: "skill", label: "" },
                    ],
                  })
                }
              >
                <Plus className="size-4" /> Add requirement
              </Button>
            ) : null}
          </div>
          {!job ? (
            <div className="flex flex-wrap gap-3 border-t border-border-default pt-4">
              <Button
                onClick={() => handleApprove(true)}
                disabled={createJob.isPending || shortlist.isPending}
              >
                Approve, publish and find candidates
              </Button>
              <Button
                variant="outline"
                onClick={() => handleApprove(false)}
                disabled={createJob.isPending || shortlist.isPending}
              >
                Save as draft and find candidates
              </Button>
            </div>
          ) : (
            <p className="text-body-sm text-text-secondary">
              Saved as{" "}
              <Link
                className="underline"
                href={`/company/${orgSlug}/${workspaceSlug}/jobs/${job.id}`}
              >
                {job.title}
              </Link>{" "}
              ({job.status}).
            </p>
          )}
        </Panel>
      ) : null}

      {/* Step 3: shortlist */}
      {shortlist.isPending ? (
        <Panel className="p-6 text-body-sm text-text-secondary">
          Searching recent applicants{talentLocked ? "" : " and talent"}…
        </Panel>
      ) : null}
      {result ? (
        <Panel className="space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-medium text-text-primary">3. Shortlist</p>
              <p className="text-body-sm text-text-secondary">
                Ranked {result.pools.applicants} recent applicants
                {result.talentSearch ? ` and ${result.pools.sourced} people open to work` : ""}.
              </p>
            </div>
            <Button onClick={draftInvites} disabled={selectedCount === 0} variant="outline">
              <Mail className="size-4" /> Draft invites ({selectedCount})
            </Button>
          </div>
          {!result.talentSearch ? (
            <Alert>
              <Lock className="size-4" />
              <AlertTitle>Only your applicants were searched</AlertTitle>
              <AlertDescription>
                Sourcing people who opted in to be found is on Pro and above.{" "}
                <Link className="underline" href={`/company/${orgSlug}/billing`}>
                  Upgrade in Billing
                </Link>
                .
              </AlertDescription>
            </Alert>
          ) : null}
          {result.candidates.length === 0 ? (
            <p className="text-body-sm text-text-secondary">
              No candidates yet. Publish the job to start receiving applications.
            </p>
          ) : null}
          <ul className="space-y-3">
            {result.candidates.map((c) => {
              const k = key(c);
              const inv = invites[k];
              return (
                <li key={k} className="space-y-3 rounded-[var(--radius-md)] border border-border-default p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={Boolean(selected[k])}
                      onCheckedChange={(v) => setSelected((prev) => ({ ...prev, [k]: v === true }))}
                      aria-label={`Select ${c.name}`}
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-text-primary">{c.name}</span>
                        <Badge variant={c.source === "applicant" ? "default" : "secondary"}>
                          {c.label}
                        </Badge>
                        {c.appliedTo ? (
                          <span className="text-xs text-text-secondary">applied to {c.appliedTo}</span>
                        ) : null}
                      </div>
                      {c.headline ? (
                        <p className="truncate text-body-sm text-text-secondary">{c.headline}</p>
                      ) : null}
                      {c.reasons.length ? (
                        <ul className="list-disc pl-5 text-body-sm text-text-secondary">
                          {c.reasons.slice(0, 4).map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="flex gap-3 text-xs">
                        {c.source === "applicant" && job ? (
                          <Link
                            className="underline"
                            href={`/company/${orgSlug}/${workspaceSlug}/jobs/${job.id}/applicants/${c.ref}`}
                          >
                            View application
                          </Link>
                        ) : null}
                        {c.livefolioUrl ? (
                          <a className="underline" href={c.livefolioUrl} target="_blank" rel="noreferrer">
                            View Livefolio
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-xl font-semibold tabular-nums text-text-primary">{c.score}</span>
                  </div>
                  {inv ? (
                    <div className="space-y-2 border-t border-border-default pt-3">
                      <Input
                        aria-label="Subject"
                        value={inv.subject}
                        onChange={(e) =>
                          setInvites((prev) => ({ ...prev, [k]: { ...inv, subject: e.target.value } }))
                        }
                      />
                      <Textarea
                        aria-label="Message"
                        rows={8}
                        value={inv.body}
                        onChange={(e) =>
                          setInvites((prev) => ({ ...prev, [k]: { ...inv, body: e.target.value } }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => send(c)}
                          disabled={inv.sent || sendInvite.isPending || job?.status !== "published"}
                        >
                          <Mail className="size-4" /> {inv.sent ? "Sent" : "Send"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await navigator.clipboard.writeText(`${inv.subject}\n\n${inv.body}`);
                            toast.success("Copied");
                          }}
                        >
                          <Copy className="size-4" /> Copy
                        </Button>
                        {job?.status !== "published" ? (
                          <span className="self-center text-xs text-text-secondary">
                            Publish the job to send from Livefolio.
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
