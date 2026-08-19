"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useCreateOrganization,
  useOrganizations,
} from "@/features/organization/api/use-organization";
import { sanitizeHiringSlug } from "@/features/jobs/lib/slug";

export default function CompanyIndexPage() {
  const { status } = useSession();
  const router = useRouter();
  const { data: orgs, isLoading } = useOrganizations();
  const createOrg = useCreateOrganization();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/company");
    }
  }, [status, router]);

  const slugPreview = useMemo(
    () => slug || (name ? sanitizeHiringSlug(name) : ""),
    [slug, name],
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Company name is required");
      return;
    }
    try {
      const result = await createOrg.mutateAsync({
        name: name.trim(),
        slug: slugPreview || undefined,
        description: description.trim() || undefined,
      });
      toast.success("Hiring workspace created");
      router.push(`/company/${result.organization.slug}`);
    } catch (error) {
      const upgradeSlug =
        error &&
        typeof error === "object" &&
        "upgradeOrgSlug" in error &&
        typeof (error as { upgradeOrgSlug?: unknown }).upgradeOrgSlug === "string"
          ? (error as { upgradeOrgSlug: string }).upgradeOrgSlug
          : null;
      toast.error(
        error instanceof Error ? error.message : "Failed to create company",
        upgradeSlug
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
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto w-full max-w-2xl space-y-8 px-6 py-16">
        <header className="space-y-2">
          <p className="eyebrow uppercase">Hiring</p>
          <h1 className="text-h2 text-text-primary">Company workspaces</h1>
          <p className="text-body-sm text-text-secondary">
            Create a hiring workspace to post jobs and receive Livefolio
            applications.
          </p>
        </header>

        {orgs && orgs.length > 0 ? (
          <ul className="divide-y divide-border-default rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
            {orgs.map(({ organization, role }) => (
              <li key={organization.id}>
                <Link
                  href={`/company/${organization.slug}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-base"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-brand-light">
                      <Building2 className="h-5 w-5 text-brand-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {organization.name}
                      </p>
                      <p className="text-body-sm text-text-secondary">
                        {role} · {organization._count?.jobs ?? 0} jobs
                      </p>
                    </div>
                  </div>
                  <span className="text-body-sm text-brand-primary">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 px-6 py-10 text-center shadow-[var(--shadow-card)] md:p-8">
            <Building2 className="mx-auto h-8 w-8 text-text-muted" />
            <h2 className="mt-3 text-h3 text-text-primary">
              No hiring workspace yet
            </h2>
            <p className="mt-1 text-body-sm text-text-secondary">
              Set up a company account to start posting jobs.
            </p>
          </div>
        )}

        {!showCreate ? (
          <Button onClick={() => setShowCreate(true)}>
            Create a hiring workspace
          </Button>
        ) : (
          <div className="space-y-6 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] md:p-8">
            <h2 className="text-h3 text-text-primary">New company</h2>
            <div className="space-y-2">
              <Label htmlFor="company-name">Company name</Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-slug">Workspace slug</Label>
              <Input
                id="company-slug"
                value={slug}
                onChange={(e) => setSlug(sanitizeHiringSlug(e.target.value))}
                placeholder={slugPreview || "acme"}
              />
              <p className="text-xs text-text-muted">
                Workspace path: /company/{slugPreview || "…"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-desc">About</Label>
              <Textarea
                id="company-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCreate} disabled={createOrg.isPending}>
                Create workspace
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <p className="text-body-sm text-text-muted">
          Looking for your personal Livefolio?{" "}
          <Link href="/dashboard" className="text-brand-primary underline">
            Go to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}