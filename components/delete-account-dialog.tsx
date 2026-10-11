"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting: boolean;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  onConfirm,
  deleting,
}: DeleteAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&_[data-slot=dialog-close]]:dark:text-text-primary [&_[data-slot=dialog-close]]:dark:opacity-90 [&_[data-slot=dialog-close]]:dark:hover:opacity-100">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-bg dark:bg-danger/20">
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden />
            </div>
            <DialogTitle>Delete account</DialogTitle>
          </div>
          <DialogDescription>
            This permanently deletes your Livefolio account and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-danger/25 bg-danger-bg px-4 py-3 dark:border-danger/40 dark:bg-surface-sunken">
            <p className="text-sm font-medium text-danger">
              You will permanently lose:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-text-secondary dark:text-text-primary">
              <li>Your portfolio and all published content</li>
              <li>Imported resume, GitHub, and Medium data</li>
              <li>Analytics and subscription access</li>
              <li>Your account and login credentials</li>
            </ul>
          </div>
          <p className="text-sm text-text-secondary dark:text-text-primary/85">
            If you only want to sign out, use the sign out button in the sidebar.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="dark:border-border-strong dark:text-text-primary dark:hover:bg-surface-sunken"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete my account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
