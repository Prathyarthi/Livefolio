"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ApiRequestError,
  useCreateWorkspace,
  useOrganization,
} from "@/features/organization/api/use-organization";
import { OrgLogo, OrgBanner } from "@/features/organization/components/org-logo";
import { sanitizeHiringSlug } from "@/features/jobs/lib/slug";

export default function OrganizationHomePage() {
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const router = useRouter();
  const { data: org, isLoading, error } = useOrganization(orgSlug);
  const createWorkspace = useCreateWorkspace(orgSlug);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function openCreateDialog() {
    setName("");
    setSlug("");
    setShowCreate(true);
  }

  function closeCreateDialog() {
    if (createWorkspace.isPending) return;
    setShowCreate(false);
    setName("");
    setSlug("");
  }

  if (isLoading) {
    return (
      <div className="p-8 text-body-sm text-text-muted">Loading organization…</div>
    );
  }

  if (error || !org) {
    return (
      <div className="p-8">
        <h1 className="text-h3 text-text-primary">Organization not found</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          You may not have access to this company.
        </p>
        <Button asChild className="mt-4">
          <Link href="/company">Back to companies</Link>
        </Button>
      </div>
    );
  }

  const workspaces = org.workspaces ?? [];

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }
    try {
      const workspace = await createWorkspace.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || undefined,
      });
      toast.success("Workspace created");
      setShowCreate(false);
      router.push(`/company/${orgSlug}/${workspace.slug}`);
    } catch (err) {
      const upgradeSlug =
        err &&
        typeof err === "object" &&
        "upgradeOrgSlug" in err &&
        typeof (err as { upgradeOrgSlug?: unknown }).upgradeOrgSlug === "string"
          ? (err as { upgradeOrgSlug: string }).upgradeOrgSlug
          : orgSlug;
      toast.error(
        err instanceof Error ? err.message : "Failed to create workspace",
        err instanceof ApiRequestError && err.upgradeRequired
          ? {
              action: {
                label: "Upgrade",
                onClick: () => router.push(`/company/${upgradeSlug}/billing`),
              },
            }
          : undefined,
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/company">← Back to companies</Link>
      </Button>
      <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
        {org.bannerUrl ? (
          <div className="relative h-36 overflow-hidden rounded-t-[var(--radius-lg)] md:h-44">
            <OrgBanner bannerUrl={org.bannerUrl} brandColor={org.brandColor} />
          </div>
        ) : null}
        <header className="flex flex-wrap items-start justify-between gap-4 px-5 pb-5 md:px-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {org.logoUrl ? (
              <div
                className={`relative z-10 shrink-0 ${
                  org.bannerUrl ? "-mt-10" : "mt-5"
                }`}
              >
                <OrgLogo
                  name={org.name}
                  logoUrl={org.logoUrl}
                  brandColor={org.brandColor}
                  size="lg"
                />
              </div>
            ) : null}
            <div
              className={`min-w-0 space-y-1 ${
                org.bannerUrl || org.logoUrl ? "pt-4" : "pt-5"
              }`}
            >
              <p className="eyebrow uppercase">Organization</p>
              <h1 className="text-h2 text-text-primary">{org.name}</h1>
              <p className="max-w-xl text-body-sm text-text-secondary">
                {org.description ||
                  "Workspaces keep hiring for different roles separate. Billing stays on this organization."}
              </p>
            </div>
          </div>
          {org.permissions.manageOrganization ? (
            <div className={org.bannerUrl || org.logoUrl ? "pt-4" : "pt-5"}>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                New workspace
              </Button>
            </div>
          ) : null}
        </header>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 py-10 text-center shadow-[var(--shadow-card)] md:p-8">
          <LayoutGrid className="h-8 w-8 text-text-muted" />
          <h2 className="mt-3 text-h3 text-text-primary">No workspaces yet</h2>
          <p className="mt-1 text-body-sm text-text-secondary">
            Ask an admin to assign you to a workspace.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border-default overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <Link
                href={`/company/${orgSlug}/${workspace.slug}`}
                className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-sunken/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">
                    {workspace.name}
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    {workspace.description || "Hiring workspace"}
                  </p>
                </div>
                <span className="text-body-sm text-brand-primary">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          if (open) openCreateDialog();
          else closeCreateDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New workspace</DialogTitle>
            <DialogDescription>
              Keep hiring for different roles in separate workspaces.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-slug">Slug</Label>
              <Input
                id="ws-slug"
                value={slug}
                onChange={(e) => setSlug(sanitizeHiringSlug(e.target.value))}
                placeholder={sanitizeHiringSlug(name) || "engineering"}
              />
              <p className="text-xs text-text-muted">
                Path: /company/{orgSlug}/
                {slug || sanitizeHiringSlug(name) || "…"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={closeCreateDialog}
              disabled={createWorkspace.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={createWorkspace.isPending}
            >
              Create workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}