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

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  cancelling: boolean;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onConfirm,
  cancelling,
}: CancelSubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&_[data-slot=dialog-close]]:dark:text-text-primary [&_[data-slot=dialog-close]]:dark:opacity-90 [&_[data-slot=dialog-close]]:dark:hover:opacity-100">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-bg">
              <AlertTriangle className="h-5 w-5 text-text-primary" aria-hidden />
            </div>
            <DialogTitle>Cancel Pro Subscription</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to cancel your Pro subscription?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="rounded-xl border border-warning/25 bg-warning-bg px-4 py-3">
            <p className="text-sm font-medium text-text-primary">
              Your subscription and AutoPay will be cancelled immediately.
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              You will keep all Pro features until the end of your current paid
              billing cycle. After that, your account moves to the applicable
              free tier.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="dark:border-border-strong dark:text-text-primary dark:hover:bg-surface-sunken"
            onClick={() => onOpenChange(false)}
            disabled={cancelling}
          >
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Cancel Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
