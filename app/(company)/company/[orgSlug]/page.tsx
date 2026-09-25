"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ApiRequestError,
  useCreateWorkspace,
  useOrganization,
} from "@/features/organization/api/use-organization";
import { OrgLogo, OrgBanner } from "@/features/organization/components/org-logo";
import { sanitizeHiringSlug } from "@/features/jobs/lib/slug";
import {
  HiringLoadingState,
  HiringNotFoundState,
} from "@/features/organization/components/hiring-page-chrome";

export default function OrganizationHomePage() {
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const router = useRouter();
  const { data: org, isLoading, error } = useOrganization(orgSlug);
  const createWorkspace = useCreateWorkspace(orgSlug);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  if (isLoading) {
    return (
      <HiringLoadingState
        backHref="/company"
        backLabel="← Back to companies"
        message="Loading organization…"
      />
    );
  }

  if (error || !org) {
    return (
      <HiringNotFoundState
        backHref="/company"
        backLabel="← Back to companies"
        title="Organization not found"
        description="You may not have access to this company."
      />
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
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/company">← Back to companies</Link>
      </Button>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
        {org.bannerUrl ? (
          <div className="relative h-36 md:h-44">
            <OrgBanner bannerUrl={org.bannerUrl} brandColor={org.brandColor} />
          </div>
        ) : null}
        <header className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 md:px-6">
          <div
            className={`flex min-w-0 items-end gap-4 ${
              org.bannerUrl && org.logoUrl ? "-mt-12" : ""
            }`}
          >
            {org.logoUrl ? (
              <OrgLogo
                name={org.name}
                logoUrl={org.logoUrl}
                brandColor={org.brandColor}
                size="lg"
              />
            ) : null}
            <div className="min-w-0 pb-1">
              <p className="eyebrow uppercase">Organization</p>
              <h1 className="text-h2 text-text-primary">{org.name}</h1>
              <p className="max-w-xl text-body-sm text-text-secondary">
                {org.description ||
                  "Workspaces keep hiring for different roles separate. Billing stays on this organization."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/company/${orgSlug}/talent`}>
                <Users className="h-4 w-4" />
                Find talent
              </Link>
            </Button>
            {org.permissions.manageOrganization ? (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                New workspace
              </Button>
            ) : null}
          </div>
        </header>
      </div>

      {workspaces.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-fill/12">
            <LayoutGrid className="h-6 w-6 text-brand-secondary" aria-hidden />
          </span>
          <h2 className="mt-4 text-h3 text-text-primary">No workspaces yet</h2>
          <p className="mt-1 text-body-sm text-text-secondary">
            {org.permissions.manageOrganization
              ? "Create a workspace to start posting jobs."
              : "Ask an admin to assign you to a workspace."}
          </p>
          {org.permissions.manageOrganization ? (
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New workspace
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-border-default rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <Link
                href={`/company/${orgSlug}/${workspace.slug}`}
                className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-base"
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

      {showCreate ? (
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-h3 text-text-primary">New workspace</h2>
          <div className="space-y-2">
            <Label htmlFor="ws-name">Name</Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Engineering"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-slug">Slug</Label>
            <Input
              id="ws-slug"
              value={slug}
              onChange={(e) => setSlug(sanitizeHiringSlug(e.target.value))}
              placeholder="engineering"
            />
            <p className="text-xs text-text-muted">
              Path: /company/{orgSlug}/{slug || sanitizeHiringSlug(name) || "…"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void handleCreate()}
              disabled={createWorkspace.isPending}
            >
              Create workspace
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
