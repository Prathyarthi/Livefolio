"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Copy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/features/organization/api/use-organization";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useDeleteJob,
  useJob,
  useUpdateJob,
} from "@/features/jobs/api/use-jobs";
import { JobHighlights } from "@/features/jobs/components/job-highlights";
import { JobRoleFields } from "@/features/jobs/components/job-role-fields";
import {
  formStateToJobInput,
  jobToFormState,
  type JobRoleFormState,
} from "@/features/jobs/lib/role-fields";
import {
  JOB_STATUS_LABELS,
  splitRichLines,
} from "@/features/jobs/constants/labels";
import { getAppOrigin } from "@/lib/domain";
import { PdfExtractField } from "@/features/uploads/components/pdf-extract-field";
import { uploadStoredFile } from "@/features/uploads/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HiringLoadingState,
  HiringNotFoundState,
} from "@/features/organization/components/hiring-page-chrome";

export default function ManageJobPage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string; jobId: string }>();
  const orgSlug = params.orgSlug;
  const workspaceSlug = params.workspaceSlug;
  const jobId = params.jobId;
  const router = useRouter();
  const { data: job, isLoading, error } = useJob(jobId);
  const { data: workspace } = useWorkspace(orgSlug, workspaceSlug);
  const updateJob = useUpdateJob(orgSlug);
  const deleteJob = useDeleteJob(orgSlug);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<JobRoleFormState | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (job) {
      const state = jobToFormState(job);
      if (workspace && Array.isArray(workspace.customJobFields)) {
        const existingLabels = new Set(
          state.customFields.map((f) => f.label.toLowerCase()),
        );
        for (const def of workspace.customJobFields as any[]) {
          if (def.label && !existingLabels.has(def.label.toLowerCase())) {
            state.customFields.push({
              id: crypto.randomUUID(),
              label: def.label,
              value: "",
            });
          }
        }
      }
      setForm(state);
    }
  }, [job, workspace]);

  if (isLoading) {
    return (
      <HiringLoadingState
        backHref={`/company/${orgSlug}/${workspaceSlug}/jobs`}
        backLabel="← Back to jobs"
        message="Loading job…"
      />
    );
  }

  if (error || !job) {
    return (
      <HiringNotFoundState
        backHref={`/company/${orgSlug}/${workspaceSlug}/jobs`}
        backLabel="← Back to jobs"
        title="Job not found"
      />
    );
  }

  const publicUrl = `${getAppOrigin()}/jobs/${job.slug}`;
  const required = job.requirements.filter((r) => r.type === "required");
  const preferred = job.requirements.filter((r) => r.type === "preferred");

  async function setStatus(
    status: "draft" | "published" | "paused" | "closed",
  ) {
    try {
      await updateJob.mutateAsync({ id: jobId, data: { status } });
      toast.success(`Job ${JOB_STATUS_LABELS[status]?.toLowerCase() ?? status}`);
    } catch (err) {
      const upgradeRequired =
        err &&
        typeof err === "object" &&
        "upgradeRequired" in err &&
        (err as { upgradeRequired?: unknown }).upgradeRequired === true;
      toast.error(
        err instanceof Error ? err.message : "Update failed",
        upgradeRequired
          ? {
              action: {
                label: "Upgrade",
                onClick: () => router.push(`/company/${orgSlug}/billing`),
              },
            }
          : undefined,
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteJob.mutateAsync(jobId);
      toast.success("Draft deleted");
      router.push(`/company/${orgSlug}/${workspaceSlug}/jobs`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setShowDelete(false);
    }
  }

  async function handleSaveEdits() {
    if (!form) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    try {
      await updateJob.mutateAsync({
        id: jobId,
        data: formStateToJobInput(form),
      });
      toast.success("Job details saved");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save job");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs`}>← Back to jobs</Link>
      </Button>
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={job.status === "published" ? "success" : "neutral"}>
            {JOB_STATUS_LABELS[job.status] ?? job.status}
          </Badge>
          <span className="text-body-sm text-text-secondary">
            {job._count?.applications ?? 0} applicants
          </span>
        </div>
        <h1 className="text-h2 text-text-primary">{job.title}</h1>
      </header>

      <JobHighlights job={job} />

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs/${jobId}/applicants`}>
            View applicants ({job._count?.applications ?? 0})
          </Link>
        </Button>
        {job.status !== "published" && (
          <Button onClick={() => setStatus("published")} disabled={updateJob.isPending}>
            Publish
          </Button>
        )}
        {job.status === "published" && (
          <Button
            variant="outline"
            onClick={() => setStatus("paused")}
            disabled={updateJob.isPending}
          >
            Pause
          </Button>
        )}
        {job.status === "paused" && (
          <Button onClick={() => setStatus("published")} disabled={updateJob.isPending}>
            Resume
          </Button>
        )}
        {job.status !== "closed" && job.status !== "draft" && (
          <Button
            variant="outline"
            onClick={() => setStatus("closed")}
            disabled={updateJob.isPending}
          >
            Close
          </Button>
        )}
        {(job.status === "published" || job.status === "paused") && (
          <Button variant="outline" asChild>
            <Link href={`/jobs/${job.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
              View public page
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            setForm(jobToFormState(job));
            setEditing((open) => !open);
          }}
        >
          {editing ? "Cancel edit" : "Edit details"}
        </Button>
        {job.status === "draft" && (
          <Button
            variant="destructive"
            onClick={() => setShowDelete(true)}
            disabled={deleteJob.isPending}
          >
            Delete draft
          </Button>
        )}
      </div>

      {(job.status === "published" || job.status === "paused") && (
        <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
          <p className="text-label uppercase text-text-secondary">
            Shareable job link
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="truncate text-mono text-sm text-text-primary">
              {publicUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(publicUrl);
                toast.success("Link copied");
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
        </div>
      )}

      {editing && form ? (
        <div className="space-y-6 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
          <JobRoleFields
            values={form}
            onChange={(patch) => setForm((prev) => (prev ? { ...prev, ...patch } : prev))}
            descriptionExtra={
              <PdfExtractField
                hint="Replace the description from a PDF. You can still edit the text afterward."
                onExtracted={async (text, file) => {
                  setForm((prev) => (prev ? { ...prev, description: text } : prev));
                  await uploadStoredFile({
                    kind: "job_source",
                    file,
                    jobId,
                  });
                  await queryClient.invalidateQueries({
                    queryKey: ["jobs", "id", jobId],
                  });
                }}
              />
            }
          />
          <div className="flex flex-wrap gap-2 border-t border-border-default pt-6">
            <Button onClick={() => void handleSaveEdits()} disabled={updateJob.isPending}>
              Save details
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
          <JobTextSection title="Description" body={job.description} />
          <JobTextSection title="Responsibilities" body={job.responsibilities} />
          <JobTextSection title="Qualifications" body={job.qualifications} />
          <JobTextSection title="Benefits" body={job.benefits} />
          {(required.length > 0 || preferred.length > 0) && (
            <section className="grid gap-6 border-t border-border-default pt-6 sm:grid-cols-2">
              <RequirementCard title="Required" items={required.map((r) => r.label)} />
              <RequirementCard title="Preferred" items={preferred.map((r) => r.label)} />
            </section>
          )}
        </div>
      )}

      <p className="text-body-sm text-text-muted">
        Open the applicant pool to move candidates through the pipeline, shortlist,
        and add private notes.
      </p>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this draft?</DialogTitle>
            <DialogDescription>
              This removes the draft job. Published roles cannot be deleted from
              here.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={deleteJob.isPending}
            >
              Keep draft
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleteJob.isPending}
            >
              {deleteJob.isPending ? "Deleting…" : "Delete draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobTextSection({
  title,
  body,
}: {
  title: string;
  body: string | null;
}) {
  if (!body?.trim()) return null;
  const lines = splitRichLines(body);
  return (
    <section className="space-y-3 border-t border-border-default pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-h3 text-text-primary">{title}</h2>
      {lines.length > 1 ? (
        <ul className="mt-4 space-y-2 text-body-sm text-text-secondary">
          {lines.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-body-sm text-text-secondary">
          {body}
        </p>
      )}
    </section>
  );
}

function RequirementCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-h3 text-text-primary">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-body-sm text-text-muted">None listed</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full border border-border-default bg-surface-base px-3 py-1 text-body-sm text-text-primary"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
