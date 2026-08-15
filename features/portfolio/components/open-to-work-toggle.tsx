"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  usePortfolio,
  useUpdatePortfolio,
} from "@/features/portfolio/api/use-portfolio";
import { toast } from "sonner";

export function OpenToWorkToggle() {
  const { data: portfolio } = usePortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const enabled = Boolean(portfolio?.openToWork);
  const published = Boolean(portfolio?.isPublished && portfolio?.slug);

  async function handleToggle(checked: boolean) {
    try {
      await updatePortfolio.mutateAsync({ openToWork: checked });
      if (checked && !published) {
        toast.success(
          "Saved. Publish your Livefolio to appear in recruiter search.",
        );
        return;
      }
      toast.success(
        checked
          ? "Recruiters can find you"
          : "You are no longer listed for recruiters",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update",
      );
    }
  }

  if (!portfolio) return null;

  return (
    <div className="flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised px-4 py-4">
      <div className="min-w-0 space-y-1">
        <Label htmlFor="open-to-work">Open to work</Label>
        <p className="text-body-sm text-text-secondary">
          Toggle this on to make recruiters find you. This is not shown on your
          public Livefolio or to anyone.
        </p>
        {enabled && !published ? (
          <p className="text-body-sm text-text-muted">
            Publish your Livefolio to appear in recruiter search.
          </p>
        ) : null}
      </div>
      <Switch
        id="open-to-work"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={updatePortfolio.isPending}
        aria-label="Open to work"
      />
    </div>
  );
}
