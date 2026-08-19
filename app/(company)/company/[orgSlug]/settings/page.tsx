"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useOrganization,
  useUpdateOrganization,
} from "@/features/organization/api/use-organization";
import { CompanyTeamSection } from "@/features/organization/components/company-team-section";
import { useOrgJobs } from "@/features/jobs/api/use-jobs";

export default function CompanySettingsPage() {
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const { data: org, isLoading } = useOrganization(orgSlug);
  const { data: jobs } = useOrgJobs(orgSlug);
  const updateOrg = useUpdateOrganization(orgSlug);

  const previewJob = useMemo(
    () =>
      (jobs ?? []).find(
        (job) => job.status === "published" || job.status === "paused",
      ) ?? null,
    [jobs],
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [location, setLocation] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");

  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setDescription(org.description ?? "");
    setWebsiteUrl(org.websiteUrl ?? "");
    setLocation(org.location ?? "");
    setLogoUrl(org.logoUrl ?? "");
    setBrandColor(org.brandColor ?? "");
  }, [org]);

  if (isLoading || !org) {
    return (
      <div className="p-8 text-body-sm text-text-muted">Loading settings…</div>
    );
  }

  async function handleSave() {
    try {
      await updateOrg.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        location: location.trim() || null,
        logoUrl: logoUrl.trim() || null,
        brandColor: brandColor.trim() || null,
      });
      toast.success("Company settings saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}`}>← Back to overview</Link>
      </Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow uppercase">Settings</p>
          <h1 className="text-h2 text-text-primary">Company branding</h1>
          <p className="text-body-sm text-text-secondary">
            These details appear on public job pages.
          </p>
        </div>
        {previewJob ? (
          <Button variant="outline" asChild>
            <Link href={`/jobs/${previewJob.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
              View public page
            </Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href={`/company/${orgSlug}/jobs/new`}>
              Publish a job to preview
            </Link>
          </Button>
        )}
      </header>

      {!org.permissions.manageOrganization ? (
        <p className="text-body-sm text-text-secondary">
          Only owners and admins can edit company settings.
        </p>
      ) : (
        <div className="space-y-6 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] md:p-8">
          <div className="space-y-5">
            <div className="space-y-2">
            <Label htmlFor="name">Company name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">About the company</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="brand"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#1a1a1a"
                />
                <span
                  aria-hidden
                  className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] border border-border-default"
                  style={{
                    background: brandColor.trim() || "var(--brand-primary)",
                  }}
                />
              </div>
            </div>
          </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border-default pt-6">
            <Button onClick={handleSave} disabled={updateOrg.isPending}>
              Save changes
            </Button>
            {previewJob ? (
              <Button variant="outline" asChild>
                <Link href={`/jobs/${previewJob.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  Preview branding
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <CompanyTeamSection
        orgSlug={orgSlug}
        canManage={org.permissions.manageOrganization}
        viewerRole={org.role}
      />
    </div>
  );
}