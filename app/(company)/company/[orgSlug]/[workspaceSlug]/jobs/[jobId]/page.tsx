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
import { JobRoleFields } from "@/features/jobs/components/job-role-fields";
import { PublicJobView } from "@/features/jobs/components/public-job-view";
import {
  CandidateViewToggle,
  JobCandidatePreview,
} from "@/features/jobs/components/job-candidate-preview";
import {
  formStateToJobInput,
  jobToFormState,
  type JobRoleFormState,
} from "@/features/jobs/lib/role-fields";
import { JOB_STATUS_LABELS } from "@/features/jobs/constants/labels";
import { getAppOrigin } from "@/lib/domain";
import { PdfExtractField } from "@/features/uploads/components/pdf-extract-field";
import { uploadStoredFile } from "@/features/uploads/api/client";
import { cn } from "@/lib/utils";

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
  const [candidateView, setCandidateView] = useState(false);

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
      <div className="p-8 text-body-sm text-text-muted">Loading job…</div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8">
        <h1 className="text-h3">Job not found</h1>
        <Button asChild className="mt-4">
          <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs`}>Back to jobs</Link>
        </Button>
      </div>
    );
  }

  const publicUrl = `${getAppOrigin()}/jobs/${job.slug}`;

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
    if (!confirm("Delete this draft job?")) return;
    try {
      await deleteJob.mutateAsync(jobId);
      toast.success("Draft deleted");
      router.push(`/company/${orgSlug}/${workspaceSlug}/jobs`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
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
    <div
      className={cn(
        "mx-auto w-full space-y-8 p-6 md:p-8",
        editing && candidateView ? "max-w-[1600px]" : editing ? "max-w-4xl" : "max-w-5xl",
      )}
    >
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
        {editing ? (
          <h1 className="text-h2 text-text-primary">{job.title}</h1>
        ) : null}
      </header>

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
        {editing ? (
          <CandidateViewToggle open={candidateView} onOpenChange={setCandidateView} />
        ) : null}
        {job.status === "draft" && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteJob.isPending}
          >
            Delete draft
          </Button>
        )}
      </div>

      {(job.status === "published" || job.status === "paused") && (
        <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4 shadow-[var(--shadow-card)] md:p-6">
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
        <div
          className={cn(candidateView && "grid gap-6 xl:grid-cols-2")}
        >
          <div className="space-y-6 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] md:p-8">
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
          {candidateView ? (
            <aside className="relative min-h-[32rem] xl:min-h-0">
              <div className="h-full xl:absolute xl:inset-0">
                <JobCandidatePreview
                  form={form}
                  organization={job.organization}
                  job={job}
                />
              </div>
            </aside>
          ) : null}
        </div>
      ) : (
        <PublicJobView job={job} chrome="listing" />
      )}

      <p className="text-body-sm text-text-muted">
        Open the applicant pool to move candidates through the pipeline, shortlist,
        and add private notes.
      </p>
    </div>
  );
}
