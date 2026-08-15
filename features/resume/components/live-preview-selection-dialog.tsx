"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUpdateLivePreview,
  useUpdateProject,
} from "@/features/portfolio/api/use-portfolio";
import { ProjectThumbnailField } from "@/features/uploads/components/project-thumbnail-field";
import { getUploadUsage } from "@/features/uploads/api/client";
import {
  getMaxLivePreviews,
  isProSubscriptionStatus,
} from "@/lib/live-preview";
import { toast } from "sonner";

export interface LivePreviewCandidate {
  id: string;
  title: string;
  liveUrl: string;
  imageUrl?: string | null;
}

interface LivePreviewSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: LivePreviewCandidate[];
  selectedProjectIds: string[];
  subscriptionStatus: string | null;
  onSaved?: () => void;
}

export function LivePreviewSelectionDialog({
  open,
  onOpenChange,
  candidates,
  selectedProjectIds,
  subscriptionStatus,
  onSaved,
}: LivePreviewSelectionDialogProps) {
  const maxAllowed = getMaxLivePreviews(subscriptionStatus);
  const isPro = isProSubscriptionStatus(subscriptionStatus);
  const updateLivePreview = useUpdateLivePreview();
  const updateProject = useUpdateProject();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [imageById, setImageById] = useState<Record<string, string>>({});
  const [thumbUsage, setThumbUsage] = useState<{
    used: number;
    max: number;
  } | null>(null);
  const [storageConfigured, setStorageConfigured] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    const eligible = new Set(
      candidates
        .filter((item) => item.liveUrl.trim())
        .map((item) => item.id),
    );
    const restored = selectedProjectIds.filter((id) => eligible.has(id));
    setSelectedIds(isPro ? restored : []);
    setImageById(
      Object.fromEntries(
        candidates.map((item) => [item.id, item.imageUrl?.trim() ?? ""]),
      ),
    );
  }, [open, candidates, selectedProjectIds, isPro]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void getUploadUsage()
      .then((usage) => {
        if (cancelled) return;
        setStorageConfigured(usage.configured);
        setThumbUsage(usage.projectThumbnails);
      })
      .catch(() => {
        if (cancelled) return;
        setStorageConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const liveUrlCandidates = useMemo(
    () => candidates.filter((item) => item.liveUrl.trim()),
    [candidates],
  );

  const selectedCount = selectedIds.length;
  const exceedsPlan = selectedCount > maxAllowed;

  function toggleProject(projectId: string, checked: boolean) {
    if (!isPro) return;
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(projectId)) return prev;
        if (prev.length >= maxAllowed) return prev;
        return [...prev, projectId];
      }
      return prev.filter((id) => id !== projectId);
    });
  }

  async function persistImageUrl(projectId: string, url: string) {
    setImageById((prev) => ({ ...prev, [projectId]: url }));
    try {
      await updateProject.mutateAsync({
        id: projectId,
        imageUrl: url.trim() ? url : null,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save thumbnail",
      );
    }
  }

  async function handleSave() {
    try {
      if (isPro || selectedProjectIds.length > 0) {
        await updateLivePreview.mutateAsync(isPro ? selectedIds : []);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save project cover preferences",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="space-y-4 overflow-y-auto px-6 pt-6 pb-4">
          <DialogHeader className="space-y-1.5">
            <DialogTitle>Add project covers</DialogTitle>
            <DialogDescription>
              Upload a thumbnail for each project. Pro can also turn on a live
              screenshot of the project URL.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <p>
                Plan:{" "}
                <span className="font-medium">
                  {isPro ? "Pro (active)" : "Free"}
                </span>
              </p>
              {thumbUsage ? (
                <p>
                  Thumbnails:{" "}
                  <span className="font-medium">
                    {thumbUsage.used}
                  </span>{" "}
                  / {thumbUsage.max}
                </p>
              ) : null}
            </div>
            {!isPro ? (
              <p className="mt-2 text-muted-foreground">
                Live preview is a Pro feature.{" "}
                <Link href="/dashboard/billing" className="underline">
                  Upgrade
                </Link>{" "}
                to show live screenshots of your project URLs.
              </p>
            ) : (
              <p className="mt-2 text-muted-foreground">
                Live preview: {selectedCount} / {maxAllowed} selected
              </p>
            )}
          </div>

          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects were imported.
            </p>
          ) : (
            <div className="space-y-3">
              {candidates.map((item) => {
                const liveUrl = item.liveUrl.trim();
                const isSelected = selectedIds.includes(item.id);
                const livePreviewOn = isPro && isSelected;

                return (
                  <div
                    key={item.id}
                    className="space-y-3 rounded-lg border border-border/60 px-4 py-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      {liveUrl ? (
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{liveUrl}</span>
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No live URL on this project
                        </p>
                      )}
                    </div>

                    <ProjectThumbnailField
                      projectId={item.id}
                      imageUrl={imageById[item.id] ?? ""}
                      usage={thumbUsage}
                      storageConfigured={storageConfigured}
                      livePreviewEnabled={livePreviewOn}
                      hideLabel
                      onImageUrlChange={(url) => {
                        void persistImageUrl(item.id, url);
                      }}
                      onUsageChange={setThumbUsage}
                    />

                    {isPro && liveUrl ? (
                      <div className="flex items-center justify-between gap-3">
                        <Label
                          htmlFor={`live-preview-${item.id}`}
                          className="text-sm"
                        >
                          Live preview
                        </Label>
                        <Switch
                          id={`live-preview-${item.id}`}
                          checked={isSelected}
                          disabled={
                            (!isSelected && selectedCount >= maxAllowed) ||
                            updateLivePreview.isPending
                          }
                          onCheckedChange={(checked) =>
                            toggleProject(item.id, checked)
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {isPro && exceedsPlan ? (
            <p className="text-sm text-destructive">
              Only the first {maxAllowed} live previews will be saved.
            </p>
          ) : null}

          {isPro && liveUrlCandidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add live URLs to projects later to enable live preview.
            </p>
          ) : null}
        </div>

        <DialogFooter className="justify-between gap-4 border-t border-border/60 bg-muted/10 px-6 py-4 sm:justify-end">
          {!isPro && (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/dashboard/billing">Upgrade to Pro</Link>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Skip
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={
              candidates.length === 0 ||
              updateLivePreview.isPending ||
              updateProject.isPending
            }
          >
            {updateLivePreview.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
