"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Copy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useDeleteJob,
  useJob,
  useUpdateJob,
} from "@/features/jobs/api/use-jobs";
import {
  EMPLOYMENT_TYPE_LABELS,
  JOB_STATUS_LABELS,
  WORKPLACE_TYPE_LABELS,
  formatJobMeta,
} from "@/features/jobs/constants/labels";
import { getAppOrigin } from "@/lib/domain";
import { PdfExtractField } from "@/features/uploads/components/pdf-extract-field";
import { uploadStoredFile } from "@/features/uploads/api/client";

export default function ManageJobPage() {
  const params = useParams<{ orgSlug: string; jobId: string }>();
  const orgSlug = params.orgSlug;
  const jobId = params.jobId;
  const router = useRouter();
  const { data: job, isLoading, error } = useJob(jobId);
  const updateJob = useUpdateJob(orgSlug);
  const deleteJob = useDeleteJob(orgSlug);
  const queryClient = useQueryClient();

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
          <Link href={`/company/${orgSlug}/jobs`}>Back to jobs</Link>
        </Button>
      </div>
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
    if (!confirm("Delete this draft job?")) return;
    try {
      await deleteJob.mutateAsync(jobId);
      toast.success("Draft deleted");
      router.push(`/company/${orgSlug}/jobs`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}/jobs`}>← Back to jobs</Link>
      </Button>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={job.status === "published" ? "success" : "neutral"}>
            {JOB_STATUS_LABELS[job.status] ?? job.status}
          </Badge>
          <span className="text-body-sm text-text-secondary">
            {job._count?.applications ?? 0} applicants
          </span>
        </div>
        <h1 className="text-h2 text-text-primary">{job.title}</h1>
        <p className="text-body-sm text-text-secondary">
          {formatJobMeta([
            job.department,
            job.location,
            job.employmentType
              ? EMPLOYMENT_TYPE_LABELS[job.employmentType]
              : null,
            job.workplaceType
              ? WORKPLACE_TYPE_LABELS[job.workplaceType]
              : null,
          ])}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/company/${orgSlug}/jobs/${jobId}/applicants`}>
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
        <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4">
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

      <section className="space-y-3">
        <h2 className="text-h3 text-text-primary">Description</h2>
        <PdfExtractField
          hint="Replace the description from a PDF. You can still edit the text afterward."
          onExtracted={async (text, file) => {
            await updateJob.mutateAsync({
              id: jobId,
              data: { description: text },
            });
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
        <p className="whitespace-pre-wrap text-body-sm text-text-secondary">
          {job.description}
        </p>
      </section>

      {job.responsibilities ? (
        <section className="space-y-3">
          <h2 className="text-h3 text-text-primary">Responsibilities</h2>
          <p className="whitespace-pre-wrap text-body-sm text-text-secondary">
            {job.responsibilities}
          </p>
        </section>
      ) : null}

      {job.qualifications ? (
        <section className="space-y-3">
          <h2 className="text-h3 text-text-primary">Qualifications</h2>
          <p className="whitespace-pre-wrap text-body-sm text-text-secondary">
            {job.qualifications}
          </p>
        </section>
      ) : null}

      {(required.length > 0 || preferred.length > 0) && (
        <section className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-h3 text-text-primary">Required</h2>
            <ul className="list-disc space-y-1 pl-5 text-body-sm text-text-secondary">
              {required.map((r) => (
                <li key={r.id ?? r.label}>{r.label}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h2 className="text-h3 text-text-primary">Preferred</h2>
            <ul className="list-disc space-y-1 pl-5 text-body-sm text-text-secondary">
              {preferred.map((r) => (
                <li key={r.id ?? r.label}>{r.label}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <p className="text-body-sm text-text-muted">
        Open the applicant pool to move candidates through the pipeline, shortlist,
        and add private notes.
      </p>
    </div>
  );
}
