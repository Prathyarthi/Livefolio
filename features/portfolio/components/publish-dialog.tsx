"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  usePublishPortfolio,
  useUpdateSlug,
} from "@/features/portfolio/api/use-portfolio";
import {
  getPortfolioPublicUrl,
  getPortfolioRootDomain,
  sanitizePortfolioSlug,
} from "@/lib/domain";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, Globe, Loader2 } from "lucide-react";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSlug?: string;
  onPublished?: () => void;
}

export function PublishDialog({
  open,
  onOpenChange,
  currentSlug = "",
  onPublished,
}: PublishDialogProps) {
  const rootDomain = getPortfolioRootDomain();
  const updateSlug = useUpdateSlug();
  const publishPortfolio = usePublishPortfolio();
  const [candidateSlug, setCandidateSlug] = useState(currentSlug);
  const [checking, setChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCandidateSlug(currentSlug);
    setSlugAvailable(null);
    setPublishedUrl(null);
  }, [open, currentSlug]);

  async function checkDomainAvailability(nextSlug: string) {
    if (!nextSlug || nextSlug === currentSlug) {
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

  const slugUnchanged = candidateSlug === currentSlug;
  const canPublish =
    Boolean(candidateSlug) &&
    (slugUnchanged || slugAvailable === true) &&
    !checking;

  const isPending = updateSlug.isPending || publishPortfolio.isPending;

  async function handlePublish() {
    if (!candidateSlug) {
      toast.error("Enter a subdomain first");
      return;
    }

    if (!slugUnchanged && slugAvailable !== true) {
      toast.error("Choose an available subdomain");
      return;
    }

    try {
      if (!slugUnchanged) {
        await updateSlug.mutateAsync(candidateSlug);
      }
      await publishPortfolio.mutateAsync(true);
      const url = getPortfolioPublicUrl(candidateSlug);
      setPublishedUrl(url);
      toast.success("Portfolio published");
      onPublished?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to publish portfolio",
      );
    }
  }

  const previewUrl = candidateSlug
    ? getPortfolioPublicUrl(candidateSlug)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {publishedUrl ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Portfolio is live
              </DialogTitle>
              <DialogDescription>
                Your portfolio is publicly available. Open it anytime from the
                preview toolbar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <p className="break-all font-mono text-xs text-text-muted">
                {publishedUrl}
              </p>
              <Button className="w-full" asChild>
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Portfolio
                </a>
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Publish your portfolio?
              </DialogTitle>
              <DialogDescription>
                Your portfolio will be publicly accessible at the URL below. You can
                change the subdomain before going live.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="publish-subdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="publish-subdomain"
                    value={candidateSlug}
                    onChange={(e) => {
                      const value = sanitizePortfolioSlug(e.target.value);
                      setCandidateSlug(value);
                      void checkDomainAvailability(value);
                    }}
                    placeholder="your-name"
                    className="font-mono"
                    autoFocus
                  />
                  <span className="shrink-0 text-xs text-text-muted">
                    .{rootDomain}
                  </span>
                </div>
                {checking && (
                  <p className="text-xs text-text-muted">
                    Checking availability...
                  </p>
                )}
                {!checking && slugAvailable === true && (
                  <p className="text-xs text-emerald-600">Available</p>
                )}
                {!checking && slugAvailable === false && (
                  <p className="text-xs text-danger">
                    Already taken or invalid
                  </p>
                )}
                {previewUrl && (
                  <p className="text-xs text-text-muted font-mono">
                    {previewUrl}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handlePublish()}
                disabled={!canPublish || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
