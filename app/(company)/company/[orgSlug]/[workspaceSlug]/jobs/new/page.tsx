"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateJob } from "@/features/jobs/api/use-jobs";
import { JobRoleFields } from "@/features/jobs/components/job-role-fields";
import { useWorkspace } from "@/features/organization/api/use-organization";
import {
  emptyJobRoleForm,
  formStateToJobInput,
  type JobRoleFormState,
} from "@/features/jobs/lib/role-fields";
import { PdfExtractField } from "@/features/uploads/components/pdf-extract-field";
import { uploadStoredFile } from "@/features/uploads/api/client";

export default function NewJobPage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string }>();
  const orgSlug = params.orgSlug;
  const workspaceSlug = params.workspaceSlug;
  const router = useRouter();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(orgSlug, workspaceSlug);
  const createJob = useCreateJob(orgSlug);

  const [form, setForm] = useState<JobRoleFormState | null>(null);
  const [sourcePdf, setSourcePdf] = useState<File | null>(null);

  useEffect(() => {
    if (workspace && !form) {
      const initial = emptyJobRoleForm();
      if (Array.isArray(workspace.customJobFields)) {
        initial.customFields = workspace.customJobFields.map((f: any) => ({
          id: f.id ?? crypto.randomUUID(),
          label: f.label ?? "",
          value: "",
        }));
      }
      setForm(initial);
    }
  }, [workspace, form]);

  function patchForm(patch: Partial<JobRoleFormState>) {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function handleSubmit(publish: boolean) {
    if (!form) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      const job = await createJob.mutateAsync({
        ...formStateToJobInput(form),
        workspaceSlug,
        status: publish ? "published" : "draft",
      });
      if (sourcePdf) {
        try {
          await uploadStoredFile({
            kind: "job_source",
            file: sourcePdf,
            jobId: job.id,
          });
        } catch (persistError) {
          toast.error(
            persistError instanceof Error
              ? persistError.message
              : "Job saved, but the source PDF could not be stored",
          );
        }
      }
      toast.success(publish ? "Job published" : "Draft saved");
      router.push(`/company/${orgSlug}/${workspaceSlug}/jobs/${job.id}`);
    } catch (error) {
      const upgradeSlug =
        error &&
        typeof error === "object" &&
        "upgradeOrgSlug" in error &&
        typeof (error as { upgradeOrgSlug?: unknown }).upgradeOrgSlug === "string"
          ? (error as { upgradeOrgSlug: string }).upgradeOrgSlug
          : orgSlug;
      const upgradeRequired =
        error &&
        typeof error === "object" &&
        "upgradeRequired" in error &&
        (error as { upgradeRequired?: unknown }).upgradeRequired === true;
      toast.error(
        error instanceof Error ? error.message : "Failed to create job",
        upgradeRequired
          ? {
              action: {
                label: "Upgrade",
                onClick: () =>
                  router.push(`/company/${upgradeSlug}/billing`),
              },
            }
          : undefined,
      );
    }
  }

  if (workspaceLoading || !form) {
    return <div className="p-8 text-body-sm text-text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs`}>← Back to jobs</Link>
      </Button>
      <header className="space-y-1">
        <p className="eyebrow uppercase">New job</p>
        <h1 className="text-h2 text-text-primary">Create a role</h1>
        <p className="text-body-sm text-text-secondary">
          Candidates will apply with their Livefolio. Fill in compensation,
          location, and requirements so the public page feels complete.
        </p>
      </header>

      <div className="space-y-6 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] md:p-8">
        <JobRoleFields
          values={form}
          onChange={patchForm}
          descriptionExtra={
            <PdfExtractField
              onExtracted={(text, file) => {
                patchForm({ description: text });
                setSourcePdf(file);
              }}
            />
          }
        />

        <div className="flex flex-wrap gap-3 border-t border-border-default pt-6">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={createJob.isPending}
            variant="outline"
          >
            Save draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={createJob.isPending}
          >
            Publish job
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs`}>Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
