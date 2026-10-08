"use client";

import { useEffect, useState } from "react";
import {
  usePortfolio,
  usePublishPortfolio,
  useUpdateSlug,
} from "@/features/portfolio/api/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/features/portfolio/components/field-label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShareDialog } from "@/features/portfolio/components/share-dialog";
import { PublishDialog } from "@/features/portfolio/components/publish-dialog";
import {
  getPortfolioPublicUrl,
  getPortfolioRootDomain,
  sanitizePortfolioSlug,
} from "@/lib/domain";
import { toast } from "sonner";
import {
  Loader2,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Share2,
} from "lucide-react";
import { useEditStepDirty } from "@/features/portfolio/context/edit-dirty-context";

export function PublishButton() {
  const { data: portfolio, isLoading } = usePortfolio();
  const publishPortfolio = usePublishPortfolio();
  const updateSlug = useUpdateSlug();
  const rootDomain = getPortfolioRootDomain();
  const [candidateSlug, setCandidateSlug] = useState("");
  const [checking, setChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const isPublished = portfolio?.isPublished ?? false;
  const slug = portfolio?.slug ?? "";

  useEffect(() => {
    if (!slug) return;
    setCandidateSlug(slug);
    setSlugAvailable(null);
  }, [slug]);

  const slugDirty = candidateSlug.trim() !== "" && candidateSlug !== slug;
  useEditStepDirty("publish", slugDirty, "publish-slug");

  async function handleToggle(checked: boolean) {
    if (checked) {
      setPublishDialogOpen(true);
      return;
    }

    try {
      await publishPortfolio.mutateAsync(false);
      toast.success("Portfolio unpublished");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update publish status",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  async function checkDomainAvailability(nextSlug: string) {
    if (!nextSlug || nextSlug === slug) {
      setSlugAvailable(null);
      return;
    }

    setChecking(true);
    try {
      const res = await fetch("/api/portfolio/slug/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: nextSlug }),
      });
      const data = await res.json();
      setSlugAvailable(Boolean(data.available));
    } catch {
      setSlugAvailable(null);
    } finally {
      setChecking(false);
    }
  }

  async function connectDomain() {
    if (!candidateSlug) {
      toast.error("Enter a subdomain first");
      return;
    }

    try {
      await updateSlug.mutateAsync(candidateSlug);
      toast.success("Domain connected");
      setSlugAvailable(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect domain";
      toast.error(message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Publish Portfolio
        </CardTitle>
        <CardDescription>
          Control whether your portfolio is publicly accessible.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Alert */}
        {isPublished ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Published</AlertTitle>
            <AlertDescription>
              Your portfolio is live and accessible to anyone with the link.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Published</AlertTitle>
            <AlertDescription>
              Your portfolio is currently hidden. Toggle the switch to make it
              public.
            </AlertDescription>
          </Alert>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label
              htmlFor="publish-toggle"
              className="text-base font-medium cursor-pointer"
            >
              {isPublished ? "Portfolio is live" : "Portfolio is hidden"}
            </Label>
            <p className="text-sm text-text-muted">
              {isPublished
                ? "Visitors can view your portfolio at the public URL."
                : slug
                  ? "Turn on publishing when you are ready to go live."
                  : "Choose a subdomain in the dialog when you publish."}
            </p>
          </div>
          <Switch
            id="publish-toggle"
            checked={isPublished}
            onCheckedChange={handleToggle}
            disabled={publishPortfolio.isPending}
          />
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-1">
            <FieldLabel unsaved={slugDirty}>Choose your subdomain</FieldLabel>
            <p className="text-xs text-text-muted">
              This becomes your public portfolio address when you publish.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={candidateSlug}
              onChange={(e) => {
                const value = sanitizePortfolioSlug(e.target.value);
                setCandidateSlug(value);
                void checkDomainAvailability(value);
              }}
              placeholder="your-name"
              className="font-mono"
            />
            <span className="text-xs text-text-muted">.{rootDomain}</span>
          </div>

          {checking && (
            <p className="text-xs text-text-muted">Checking availability...</p>
          )}
          {!checking && slugAvailable === true && (
            <p className="text-xs text-success">Available</p>
          )}
          {!checking && slugAvailable === false && (
            <p className="text-xs text-danger">Already taken or invalid</p>
          )}

          <Button
            variant="outline"
            onClick={connectDomain}
            disabled={
              updateSlug.isPending ||
              !candidateSlug ||
              candidateSlug === slug ||
              slugAvailable === false
            }
          >
            {updateSlug.isPending ? "Saving..." : slug ? "Update subdomain" : "Save subdomain"}
          </Button>
        </div>

        {/* Share */}
        {slug && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium">Share your portfolio</p>
              <p className="truncate text-xs text-text-muted font-mono">
                {getPortfolioPublicUrl(slug)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isPublished ? (
                <Button variant="default" size="sm" asChild>
                  <a
                    href={getPortfolioPublicUrl(slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Portfolio
                  </a>
                </Button>
              ) : null}
              <ShareDialog slug={slug} isPublished={isPublished}>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </ShareDialog>
            </div>
          </div>
        )}
      </CardContent>

      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        currentSlug={slug}
      />
    </Card>
  );
}
