"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useWorkspace,
  useUpdateWorkspace,
} from "@/features/organization/api/use-organization";
import { sanitizeHiringSlug } from "@/features/jobs/lib/slug";
import { HiringLoadingState } from "@/features/organization/components/hiring-page-chrome";

export default function WorkspaceSettingsPage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string }>();
  const orgSlug = params.orgSlug;
  const workspaceSlug = params.workspaceSlug;
  const router = useRouter();
  
  const { data: workspace, isLoading } = useWorkspace(orgSlug, workspaceSlug);
  const updateWorkspace = useUpdateWorkspace(orgSlug, workspaceSlug);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [customFields, setCustomFields] = useState<Array<{ id: string; label: string; }>>([]);

  useEffect(() => {
    if (!workspace) return;
    setName(workspace.name);
    setSlug(workspace.slug);
    setDescription(workspace.description ?? "");
    setCustomFields(
      Array.isArray(workspace.customJobFields) ? workspace.customJobFields : [],
    );
  }, [workspace]);

  if (isLoading || !workspace) {
    return (
      <HiringLoadingState
        backHref={`/company/${orgSlug}/${workspaceSlug}`}
        backLabel="← Back to overview"
        message="Loading settings…"
      />
    );
  }

  async function handleSave() {
    try {
      await updateWorkspace.mutateAsync({
        name: name.trim(),
        slug: sanitizeHiringSlug(slug) || undefined,
        description: description.trim() || null,
        customJobFields: customFields.filter((f) => f.label.trim()),
      });
      toast.success("Workspace settings saved");
      if (slug.trim() && sanitizeHiringSlug(slug) !== workspaceSlug) {
        router.push(`/company/${orgSlug}/${sanitizeHiringSlug(slug)}/settings`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}/${workspaceSlug}`}>
          ← Back to overview
        </Link>
      </Button>
      <header className="space-y-1">
        <p className="eyebrow uppercase">Workspace Settings</p>
        <h1 className="text-h2 text-text-primary">Manage workspace</h1>
        <p className="text-body-sm text-text-secondary">
          Configure the workspace name and set up custom fields that apply to all jobs here.
        </p>
      </header>

      {!workspace.permissions.manageOrganization &&
      !workspace.permissions.manageJobs ? (
        <p className="text-body-sm text-text-secondary">
          Only owners, admins, and recruiters can edit workspace settings.
        </p>
      ) : (
        <div className="space-y-6 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
          <div className="space-y-5">
            {workspace.permissions.manageOrganization ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Workspace name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Workspace slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(sanitizeHiringSlug(e.target.value))}
                  />
                  <p className="text-xs text-text-muted">
                    Path: /company/{orgSlug}/{slug || "…"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            ) : null}

            {workspace.permissions.manageJobs ? (
              <div
                className={
                  workspace.permissions.manageOrganization
                    ? "space-y-3 border-t border-border-default pt-4"
                    : "space-y-3"
                }
              >
                <div>
                  <Label>Custom job fields</Label>
                  <p className="text-body-sm text-text-muted">
                    These fields appear when creating new jobs in this
                    workspace.
                  </p>
                </div>

                <div className="space-y-3">
                  {customFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          setCustomFields((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, label: e.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Field label"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCustomFields((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCustomFields((prev) => [
                      ...prev,
                      { id: crypto.randomUUID(), label: "" },
                    ])
                  }
                >
                  Add custom field
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border-default pt-6">
            <Button onClick={handleSave} disabled={updateWorkspace.isPending}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}