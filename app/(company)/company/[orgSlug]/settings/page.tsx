"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useOrganization,
  useUpdateOrganization,
} from "@/features/organization/api/use-organization";

export default function CompanySettingsPage() {
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const { data: org, isLoading } = useOrganization(orgSlug);
  const updateOrg = useUpdateOrganization(orgSlug);

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
    <div className="mx-auto w-full max-w-2xl space-y-8 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}`}>← Back to overview</Link>
      </Button>
      <header className="space-y-1">
        <p className="eyebrow uppercase">Settings</p>
        <h1 className="text-h2 text-text-primary">Company branding</h1>
        <p className="text-body-sm text-text-secondary">
          These details appear on public job pages.
        </p>
      </header>

      {!org.permissions.manageOrganization ? (
        <p className="text-body-sm text-text-secondary">
          Only owners and admins can edit company settings.
        </p>
      ) : (
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
              <Input
                id="brand"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#1a1a1a"
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={updateOrg.isPending}>
            Save changes
          </Button>
        </div>
      )}
    </div>
  );
}
