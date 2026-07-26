"use client";

import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getMaxLivePreviews,
  isProSubscriptionStatus,
} from "@/lib/live-preview";

interface ProjectLivePreviewControlsProps {
  mode: "add" | "edit";
  liveUrl: string;
  projectId?: string;
  livePreviewProjectIds: string[];
  subscriptionStatus: string | null;
  /** Add mode: opt-in before first save */
  enableOnSave?: boolean;
  onEnableOnSaveChange?: (enabled: boolean) => void;
  /** Edit mode: draft preference (saved on project Save) */
  editEnabled?: boolean;
  onEditEnabledChange?: (enabled: boolean) => void;
  /** Edit mode: current saved state from DB (for badge) */
  savedEnabled?: boolean;
  isSaving?: boolean;
}

export function ProjectLivePreviewControls({
  mode,
  liveUrl,
  projectId,
  livePreviewProjectIds,
  subscriptionStatus,
  enableOnSave = false,
  onEnableOnSaveChange,
  editEnabled = false,
  onEditEnabledChange,
  savedEnabled = false,
  isSaving = false,
}: ProjectLivePreviewControlsProps) {
  const hasLiveUrl = Boolean(liveUrl.trim());
  const maxAllowed = getMaxLivePreviews(subscriptionStatus);
  const isPro = isProSubscriptionStatus(subscriptionStatus);
  const enabledCount = livePreviewProjectIds.length;
  const atLimit = enabledCount >= maxAllowed;
  const isPendingChange = editEnabled !== savedEnabled;

  if (!hasLiveUrl) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Add a live URL above to enable a screenshot preview for this project.
      </div>
    );
  }

  if (mode === "add") {
    const blocked = atLimit && !enableOnSave;

    return (
      <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="enable-live-preview-on-save"
              className="flex items-center gap-2 text-foreground"
            >
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Live preview on portfolio
            </Label>
            <p className="text-sm text-muted-foreground">
              Shows a live screenshot of your project on your portfolio.{" "}
              {enabledCount}/{maxAllowed} used{!isPro ? " (free limit)" : ""}.
            </p>
          </div>
          <Switch
            id="enable-live-preview-on-save"
            checked={enableOnSave}
            disabled={blocked || isSaving}
            onCheckedChange={(checked) => onEnableOnSaveChange?.(checked)}
            className="shrink-0"
          />
        </div>
        {blocked && (
          <p className="text-xs text-destructive">
            You have used all {maxAllowed} free live preview slots.{" "}
            <Link href="/dashboard/billing" className="underline">
              Upgrade to Pro
            </Link>{" "}
            for unlimited slots.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {isPro ? "Pro — unlimited slots" : `Free — ${maxAllowed} slots included`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label
              htmlFor="toggle-live-preview"
              className="flex items-center gap-2 text-foreground"
            >
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Live preview on portfolio
            </Label>
            <Badge variant={savedEnabled ? "default" : "secondary"}>
              {savedEnabled ? "Saved · enabled" : "Saved · off"}
            </Badge>
            {isPendingChange && (
              <Badge variant="outline" className="text-xs">
                Unsaved change
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {editEnabled
              ? "A live screenshot of this project will appear on your portfolio."
              : "Turn on to show a live screenshot of this project on your portfolio."}{" "}
            ({enabledCount}/{maxAllowed} used)
          </p>
        </div>
        <Switch
          id="toggle-live-preview"
          checked={editEnabled}
          disabled={
            isSaving ||
            (!editEnabled && atLimit && !savedEnabled) ||
            projectId == null
          }
          onCheckedChange={(checked) => onEditEnabledChange?.(checked)}
          className="shrink-0"
        />
      </div>
      {!editEnabled && atLimit && !savedEnabled && (
        <p className="text-xs text-destructive">
          You have used all {maxAllowed} free live preview slots.{" "}
          <Link href="/dashboard/billing" className="underline">
            Upgrade to Pro
          </Link>{" "}
          for unlimited slots.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {isPro
          ? "Pro — unlimited slots · saves when you click Save"
          : `Free — ${maxAllowed} slots included · saves when you click Save`}
      </p>
    </div>
  );
}
