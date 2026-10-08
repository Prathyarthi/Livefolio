"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrganization } from "@/features/organization/api/use-organization";
import {
  useAddTalentToWorkspace,
  type TalentPerson,
} from "@/features/talent/api/use-talent";

export function AddToWorkspaceDialog({
  orgSlug,
  person,
  open,
  onOpenChange,
}: {
  orgSlug: string;
  person: TalentPerson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: org, isLoading } = useOrganization(orgSlug);
  const addTalent = useAddTalentToWorkspace(orgSlug);
  const [workspaceSlug, setWorkspaceSlug] = useState("");

  const savedSlugs = new Set(
    (person?.savedWorkspaces ?? []).map((ws) => ws.slug),
  );
  const workspaces = org?.workspaces ?? [];
  const available = workspaces.filter((ws) => !savedSlugs.has(ws.slug));
  const workspaceKey = workspaces.map((ws) => ws.slug).join("\n");
  const savedKey =
    (person?.savedWorkspaces ?? []).map((ws) => ws.slug).join("\n");

  useEffect(() => {
    if (!open) return;
    const saved = new Set(savedKey ? savedKey.split("\n") : []);
    const next = workspaceKey
      .split("\n")
      .filter(Boolean)
      .find((slug) => !saved.has(slug));
    setWorkspaceSlug(next ?? "");
  }, [open, person?.slug, workspaceKey, savedKey]);

  async function handleAdd() {
    if (!person || !workspaceSlug) return;
    const workspace = workspaces.find((ws) => ws.slug === workspaceSlug);
    try {
      await addTalent.mutateAsync({
        workspaceSlug,
        slug: person.slug,
      });
      toast.success(
        workspace
          ? `Added to ${workspace.name}`
          : "Added to workspace",
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add talent");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to workspace</DialogTitle>
          <DialogDescription>
            {person?.title
              ? `Choose a workspace you belong to for ${person.title}.`
              : "Choose a workspace you belong to."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-body-sm text-text-muted">Loading workspaces…</p>
        ) : workspaces.length === 0 ? (
          <p className="text-body-sm text-text-secondary">
            You are not in any workspaces yet.
          </p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {workspaces.map((workspace) => {
              const alreadyAdded = savedSlugs.has(workspace.slug);
              const selected = workspaceSlug === workspace.slug;
              return (
                <li key={workspace.id}>
                  <button
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => setWorkspaceSlug(workspace.slug)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors disabled:cursor-default disabled:opacity-70 ${
                      selected && !alreadyAdded
                        ? "border-brand-primary bg-brand-fill/10"
                        : "border-border-default bg-surface-base hover:bg-surface-raised"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {workspace.name}
                      </span>
                      {workspace.description ? (
                        <span className="block truncate text-xs text-text-muted">
                          {workspace.description}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {alreadyAdded ? "Added" : selected ? "Selected" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addTalent.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleAdd()}
            disabled={
              addTalent.isPending || !workspaceSlug || available.length === 0
            }
          >
            {addTalent.isPending ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
