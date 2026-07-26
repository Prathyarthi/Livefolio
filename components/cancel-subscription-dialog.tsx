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
      <DialogContent className="border-white/8 bg-zinc-900 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <DialogTitle className="text-zinc-100">
              Cancel Pro Subscription
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            Are you sure you want to cancel your Pro subscription?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <p className="text-sm font-medium text-amber-200">
              Your subscription and AutoPay will be cancelled immediately.
            </p>
            <p className="mt-2 text-xs text-amber-300/80">
              You will keep all Pro features until the end of your current paid
              billing cycle. After that, your account moves to the applicable
              free tier.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full border-white/10 hover:bg-white/5"
            onClick={() => onOpenChange(false)}
            disabled={cancelling}
          >
            Keep Subscription
          </Button>
          <Button
            className="rounded-full bg-red-500 text-white hover:bg-red-600"
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
