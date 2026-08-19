"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Crown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CancelSubscriptionDialog } from "@/components/cancel-subscription-dialog";
import { BillingIntervalToggle } from "@/features/subscriptions/components/billing-interval-toggle";
import {
  orgSubscribeButtonLabel,
  startOrgProCheckout,
} from "@/features/subscriptions/lib/org-checkout";
import {
  formatOrgProPriceLabel,
  type BillingInterval,
} from "@/lib/pricing";
import { getIntervalCheckoutUnavailableMessage } from "@/lib/billing";

type OrgBillingState = {
  razorpayReady: boolean;
  availableIntervals?: BillingInterval[];
  canManageBilling: boolean;
  organization: { id: string; slug: string; name: string };
  subscription: {
    status: "ACTIVE" | "PENDING";
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
  } | null;
  access: {
    plan: "free" | "pro";
    maxOpenJobs: number | null;
    maxWorkspaces: number | null;
    canPublishMoreJobs: boolean;
    canCreateMoreWorkspaces: boolean;
    openJobCount: number;
    workspaceCount: number;
  };
};

function formatBillingDate(value: string | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function CompanyBillingPage() {
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const searchParams = useSearchParams();
  const returning = searchParams.has("return");
  const cancelled = searchParams.has("cancelled");

  const [billing, setBilling] = useState<OrgBillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");
  const [checkoutIntervals, setCheckoutIntervals] = useState<BillingInterval[]>([
    "monthly",
  ]);

  const loadBilling = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/org-billing/me?orgSlug=${encodeURIComponent(orgSlug)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) {
        setBilling(null);
        setError(data.error ?? "Failed to load billing");
        return;
      }
      setError(null);
      setBilling(data);
      const intervals =
        data.availableIntervals?.length > 0
          ? data.availableIntervals
          : (["monthly"] as BillingInterval[]);
      setCheckoutIntervals(intervals);
    } catch {
      setBilling(null);
      setError("Failed to load billing");
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    if (!returning) return;
    if (billing?.access?.plan === "pro") return;
    if (billing?.subscription?.status !== "PENDING") return;
    const interval = window.setInterval(() => {
      void loadBilling();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [returning, billing, loadBilling]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function subscribe() {
    setError(null);
    setSubscribing(true);
    try {
      await startOrgProCheckout({
        orgSlug,
        interval: billingInterval,
        razorpayLoaded,
        onError: setError,
        onDismiss: loadBilling,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubscribing(false);
    }
  }

  async function cancelSubscription() {
    setError(null);
    setCancelling(true);
    try {
      const res = await fetch("/api/org-billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgSlug }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to cancel subscription.");
        setCancelling(false);
        setShowCancelDialog(false);
        return;
      }
      window.location.href = `/company/${orgSlug}/billing?cancelled=true`;
    } catch {
      setError("Something went wrong. Please try again.");
      setCancelling(false);
      setShowCancelDialog(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/company/${orgSlug}`}>← Back to overview</Link>
        </Button>
        <header className="space-y-1">
          <p className="eyebrow uppercase">Billing</p>
          <h1 className="text-h2 text-text-primary">Organization plan</h1>
        </header>
        <p className="rounded-[var(--radius-md)] bg-danger-bg px-4 py-3 text-body-sm text-danger">
          {error ?? "Failed to load billing"}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            setError(null);
            void loadBilling();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const isPro = billing.access.plan === "pro";
  const paymentsReady = billing.razorpayReady;
  const canManage = billing.canManageBilling;
  const isPending = billing.subscription?.status === "PENDING";
  const cancelAtPeriodEnd =
    billing.subscription?.status === "ACTIVE" &&
    billing.subscription.cancelAtPeriodEnd;
  const currentPeriodEnd = formatBillingDate(
    billing.subscription?.currentPeriodEnd,
  );
  const intervalCheckoutReady = checkoutIntervals.includes(billingInterval);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}`}>← Back to overview</Link>
      </Button>

      <header className="space-y-1">
        <p className="eyebrow uppercase">Billing</p>
        <h1 className="text-h2 text-text-primary">Organization plan</h1>
        <p className="text-body-sm text-text-secondary">
          Free includes 1 workspace and 1 open job. Org Pro unlocks unlimited
          workspaces and published roles on this organization.
        </p>
      </header>

      {returning && isPending ? (
        <div className="rounded-[var(--radius-md)] border border-border-default bg-surface-raised px-4 py-3 text-body-sm text-text-secondary">
          Payment is being processed. This page will update when Org Pro
          activates.
        </div>
      ) : null}

      {cancelled && cancelAtPeriodEnd ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border-default bg-surface-raised px-4 py-3 text-body-sm text-text-secondary">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          Subscription cancelled. Org Pro remains available
          {currentPeriodEnd
            ? ` through ${currentPeriodEnd}`
            : " through the current billing cycle"}
          .
        </div>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-md)] bg-danger-bg px-4 py-3 text-body-sm text-danger">
          {error}
        </p>
      ) : null}

      <section className="space-y-6 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-text-secondary" />
            <h2 className="text-h3 text-text-primary">Current plan</h2>
          </div>
          <Badge variant={isPro ? "success" : "neutral"}>
            {isPro ? "Org Pro" : "Free"}
          </Badge>
        </div>

        {isPro ? (
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-surface-base px-4 py-3">
            <Crown className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
            <div>
              <p className="text-body-sm font-medium text-text-primary">
                {cancelAtPeriodEnd
                  ? "Org Pro remains active until the billing cycle ends"
                  : "Org Pro is active"}
              </p>
              <p className="mt-0.5 text-body-sm text-text-secondary">
                Unlimited open jobs and workspaces on this organization.
                {currentPeriodEnd
                  ? ` Current period ends ${currentPeriodEnd}.`
                  : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] bg-surface-base px-4 py-3">
            <p className="text-body-sm font-medium text-text-primary">
              Free hiring plan
            </p>
            <p className="mt-0.5 text-body-sm text-text-secondary">
              1 workspace · 1 open job ({billing.access.openJobCount}{" "}
              open now). Drafts are unlimited.
            </p>
          </div>
        )}

        <div className="divide-y divide-border-default text-body-sm">
          <div className="flex justify-between py-2">
            <span className="text-text-secondary">Open jobs</span>
            <span className="text-text-primary">
              {billing.access.openJobCount}
              {billing.access.maxOpenJobs != null
                ? ` / ${billing.access.maxOpenJobs}`
                : " · unlimited"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-text-secondary">Workspaces</span>
            <span className="text-text-primary">
              {billing.access.workspaceCount}
              {billing.access.maxWorkspaces != null
                ? ` / ${billing.access.maxWorkspaces}`
                : " · unlimited"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-text-secondary">Published roles</span>
            <span className="text-text-primary">
              {isPro ? "Unlimited" : "1 at a time"}
            </span>
          </div>
        </div>

        {isPro && canManage && !cancelAtPeriodEnd ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={cancelling}
            onClick={() => setShowCancelDialog(true)}
          >
            Cancel subscription
          </Button>
        ) : null}

        {!isPro && canManage ? (
          <div className="space-y-3 border-t border-border-default pt-4">
            <p className="text-body-sm text-text-secondary">
              Org Pro from {formatOrgProPriceLabel("monthly")}.
            </p>
            <BillingIntervalToggle
              value={billingInterval}
              onChange={setBillingInterval}
            />
            {!paymentsReady || !intervalCheckoutReady ? (
              <p className="text-body-sm text-text-muted">
                {getIntervalCheckoutUnavailableMessage(billingInterval)}
              </p>
            ) : null}
            <Button
              className="w-full"
              disabled={
                subscribing ||
                isPending ||
                !paymentsReady ||
                !intervalCheckoutReady
              }
              onClick={() => {
                void subscribe().catch((err) => {
                  toast.error(
                    err instanceof Error ? err.message : "Checkout failed",
                  );
                });
              }}
            >
              {orgSubscribeButtonLabel(
                billingInterval,
                subscribing,
                isPending,
              )}
            </Button>
          </div>
        ) : null}

        {!canManage ? (
          <p className="text-body-sm text-text-muted">
            Only owners and admins can manage organization billing.
          </p>
        ) : null}
      </section>

      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={() => void cancelSubscription()}
        cancelling={cancelling}
      />
    </div>
  );
}