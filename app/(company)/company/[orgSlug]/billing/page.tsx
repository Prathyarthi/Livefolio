"use client";

import Link from "next/link";
import { HiringPlanFeatures } from "@/features/landing/components/hiring-plan-features";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CancelSubscriptionDialog } from "@/components/cancel-subscription-dialog";
import { BillingIntervalToggle } from "@/features/subscriptions/components/billing-interval-toggle";
import { startOrgProCheckout } from "@/features/subscriptions/lib/org-checkout";
import {
  BILLING_CURRENCY,
  formatInr,
  formatSeatMonthlyHeadline,
  formatSeatPriceLabel,
  formatUsd,
  type BillingInterval,
} from "@/lib/pricing";
import { siteConfig } from "@/lib/site";
import {
  ENTERPRISE_PLAN,
  enterpriseContactHref,
  HIRING_PLAN_NAMES,
  MAX_SEATS,
  minSeatsFor,
  periodTotal,
  type OrgPlanTier,
  type PaidHiringPlan,
} from "@/lib/hiring-plans";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Eyebrow,
  PageHeader,
  PageSkeleton,
  Panel,
  QueryError,
} from "@/features/organization/components/workspace-ui";
import { cn } from "@/lib/utils";
import { getIntervalCheckoutUnavailableMessage } from "@/lib/billing";

type OrgBillingState = {
  razorpayReady: boolean;
  availableIntervals?: BillingInterval[];
  planIntervals?: Record<PaidHiringPlan, BillingInterval[]>;
  seats?: number | null;
  interval?: BillingInterval | null;
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
    tier?: OrgPlanTier;
    seatLimit: number | null;
    seatsUsed: number;
    activeMembers: number;
    pendingInvites: number;
    canAddSeatHolder: boolean;
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
    useState<BillingInterval>("yearly");
  const [selectedPlan, setSelectedPlan] = useState<PaidHiringPlan>("pro");
  const [seatCount, setSeatCount] = useState(1);
  const [seatTarget0, setSeatTarget] = useState<number | null>(null);
  const [changingSeats, setChangingSeats] = useState(false);
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
        plan: selectedPlan,
        seats: Math.max(
          seatCount,
          minSeatsFor(selectedPlan),
          billing?.access.seatsUsed ?? 1,
        ),
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

  async function changeSeats(seats: number) {
    setError(null);
    setChangingSeats(true);
    try {
      const res = await fetch("/api/org-billing/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgSlug, seats }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        effective?: string;
      };
      if (!res.ok) {
        setError(body.error ?? "Could not change seats.");
        return;
      }
      toast.success(
        body.effective === "cycle_end"
          ? "Seats reduced. Billing changes at the end of this period."
          : "Seats updated.",
      );
      setSeatTarget(null);
      await loadBilling();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setChangingSeats(false);
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
    return <PageSkeleton className="max-w-3xl" />;
  }

  if (!billing) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/company/${orgSlug}`}>← Back to overview</Link>
        </Button>
        <header className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Billing</p>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">Organization plan</h1>
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

  const isPaid = billing.access.plan === "pro";
  const tier = billing.access.tier ?? (isPaid ? "pro" : "free");
  const paymentsReady = billing.razorpayReady;
  const canManage = billing.canManageBilling;
  const isPending = billing.subscription?.status === "PENDING";
  const cancelAtPeriodEnd =
    billing.subscription?.status === "ACTIVE" &&
    billing.subscription.cancelAtPeriodEnd;
  const currentPeriodEnd = formatBillingDate(
    billing.subscription?.currentPeriodEnd,
  );
  const planIntervals =
    billing.planIntervals?.[selectedPlan] ?? checkoutIntervals;
  const intervalCheckoutReady = planIntervals.includes(billingInterval);
  const seatLimit = billing.access.seatLimit;
  const seatsInUse = billing.access.seatsUsed ?? 0;
  const minSeats = Math.max(minSeatsFor(selectedPlan), seatsInUse || 1);
  const checkoutSeats = Math.max(seatCount, minSeats);
  const perSeatPlan = tier !== "free";
  const paidSeats = billing.seats ?? seatLimit ?? 0;
  const seatTarget = Math.max(seatTarget0 ?? paidSeats, 1);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-text-secondary">
        <Link href={`/company/${orgSlug}`}>← Back to overview</Link>
      </Button>

      <PageHeader
        eyebrow="Billing"
        title="Hiring plan"
        description="Proof-based ranking, references, compare, the gap report, pipeline and Talent search are on every plan. Paid plans are priced per seat."
      />

      {returning && isPending ? (
        <Alert>
          <AlertDescription>
            Payment is being processed. This page updates when your plan activates.
          </AlertDescription>
        </Alert>
      ) : null}

      {cancelled && cancelAtPeriodEnd ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription>
            Subscription cancelled. Your plan stays active
            {currentPeriodEnd ? ` through ${currentPeriodEnd}` : " through the current billing cycle"}.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? <QueryError error={new Error(error)} /> : null}

      <Panel as="section" className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Eyebrow>Current plan</Eyebrow>
            <p className="mt-1 text-xl font-semibold tracking-tight text-text-primary">
              {HIRING_PLAN_NAMES[tier]}
            </p>
          </div>
          <Badge variant={isPaid ? "brand" : "neutral"}>
            {cancelAtPeriodEnd ? "Cancels at period end" : isPaid ? "Active" : "Free"}
          </Badge>
        </div>
        {currentPeriodEnd && isPaid ? (
          <p className="text-xs text-text-muted">Current period ends {currentPeriodEnd}.</p>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-body-sm">
            <span className="text-text-secondary">Seats used</span>
            <span className="font-mono tabular-nums text-text-primary">
              {seatsInUse}
              {seatLimit != null ? ` / ${seatLimit}` : " · unlimited"}
            </span>
          </div>
          {seatLimit != null ? (
            <Progress
              value={Math.min(100, (seatsInUse / Math.max(seatLimit, 1)) * 100)}
              className="h-1.5 bg-surface-sunken [&>[data-slot=progress-indicator]]:bg-brand-primary"
              aria-label="Seats used"
            />
          ) : null}
          <p className="text-xs text-text-muted">
            {billing.access.activeMembers ?? 0} member
            {(billing.access.activeMembers ?? 0) === 1 ? "" : "s"} ·{" "}
            {billing.access.pendingInvites ?? 0} pending invite
            {(billing.access.pendingInvites ?? 0) === 1 ? "" : "s"}. Pending invites hold a seat.
          </p>
        </div>

        <div className="divide-y divide-border-default border-y border-border-default text-body-sm">
          <div className="flex justify-between py-2">
            <span className="text-text-secondary">Open jobs</span>
            <span className="font-mono tabular-nums text-text-primary">
              {billing.access.openJobCount}
              {billing.access.maxOpenJobs != null ? ` / ${billing.access.maxOpenJobs}` : " · unlimited"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-text-secondary">Workspaces</span>
            <span className="font-mono tabular-nums text-text-primary">
              {billing.access.workspaceCount}
              {billing.access.maxWorkspaces != null ? ` / ${billing.access.maxWorkspaces}` : " · unlimited"}
            </span>
          </div>
        </div>

        {perSeatPlan && canManage && !cancelAtPeriodEnd ? (
          <div className="space-y-3">
            <Eyebrow>Change seats</Eyebrow>
            <div className="flex flex-wrap items-center gap-2">
              <SeatStepper
                value={seatTarget}
                min={Math.max(minSeatsFor(tier as PaidHiringPlan), seatsInUse || 1)}
                onChange={setSeatTarget}
              />
              <Button
                size="sm"
                disabled={changingSeats || seatTarget === paidSeats}
                onClick={() => void changeSeats(seatTarget)}
              >
                {changingSeats
                  ? "Updating…"
                  : seatTarget > paidSeats
                    ? `Add ${seatTarget - paidSeats} seat${seatTarget - paidSeats === 1 ? "" : "s"}`
                    : seatTarget < paidSeats
                      ? `Remove ${paidSeats - seatTarget} seat${paidSeats - seatTarget === 1 ? "" : "s"}`
                      : "No change"}
              </Button>
            </div>
            <p className="text-xs text-text-muted">
              {formatSeatPriceLabel(tier as PaidHiringPlan, (billing.interval ?? "monthly") as BillingInterval)}.
              Added seats apply now; removed seats stop renewing at the end of the period.
              You can&apos;t go below the seats in use.
            </p>
          </div>
        ) : null}

        {isPaid && canManage && !cancelAtPeriodEnd ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={cancelling}
            onClick={() => setShowCancelDialog(true)}
          >
            Cancel subscription
          </Button>
        ) : null}

        {!canManage ? (
          <p className="text-body-sm text-text-muted">
            Only owners and admins can manage organization billing.
          </p>
        ) : null}
      </Panel>

      {!isPaid && canManage ? (
        <Panel as="section" className="space-y-5 p-4 md:p-6">
          <div>
            <Eyebrow>Upgrade</Eyebrow>
            <p className="mt-1 text-body-sm text-text-secondary">
              Pick a plan, billing period and seats. You can add seats later.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["pro", "business"] as const).map((plan) => (
              <button
                key={plan}
                type="button"
                onClick={() => {
                  setSelectedPlan(plan);
                  setSeatCount((n) => Math.max(n, minSeatsFor(plan)));
                }}
                className={cn(
                  "rounded-[var(--radius-md)] border p-4 text-left transition-colors",
                  selectedPlan === plan
                    ? "border-brand-primary bg-brand-light/40"
                    : "border-border-default hover:border-border-strong",
                )}
                aria-pressed={selectedPlan === plan}
              >
                <p className="font-medium text-text-primary">{HIRING_PLAN_NAMES[plan]}</p>
                <p className="mt-1 font-mono text-sm tabular-nums text-text-primary">
                  {formatSeatMonthlyHeadline(plan, billingInterval)}{" "}
                  <span className="text-text-muted">/ seat / mo</span>
                </p>
                <HiringPlanFeatures plan={plan} compact className="mt-3" />
              </button>
            ))}
          </div>
          <BillingIntervalToggle value={billingInterval} onChange={setBillingInterval} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-body-sm text-text-secondary">Seats</span>
              <SeatStepper value={checkoutSeats} min={minSeats} onChange={setSeatCount} />
            </div>
            <p className="text-body-sm text-text-secondary">
              <span className="font-mono tabular-nums text-text-primary">
                {formatPeriodTotal(selectedPlan, billingInterval, checkoutSeats)}
              </span>{" "}
              / {billingInterval === "monthly" ? "month" : billingInterval === "quarterly" ? "quarter" : "year"}
            </p>
          </div>
          {selectedPlan === "business" ? (
            <p className="text-xs text-text-muted">Business starts at 3 seats.</p>
          ) : null}
          {seatsInUse > minSeatsFor(selectedPlan) ? (
            <p className="text-xs text-text-muted">
              Your team already uses {seatsInUse} seats, so that&apos;s the minimum.
            </p>
          ) : null}
          {!paymentsReady || !intervalCheckoutReady ? (
            <p className="text-body-sm text-text-muted">
              {getIntervalCheckoutUnavailableMessage(billingInterval)}
            </p>
          ) : null}
          <Button
            className="w-full"
            disabled={subscribing || isPending || !paymentsReady || !intervalCheckoutReady}
            onClick={() => {
              void subscribe().catch((err) => {
                toast.error(err instanceof Error ? err.message : "Checkout failed");
              });
            }}
          >
            {subscribing
              ? "Opening checkout…"
              : isPending
                ? "Payment pending…"
                : `Subscribe to ${HIRING_PLAN_NAMES[selectedPlan]} · ${checkoutSeats} seat${checkoutSeats === 1 ? "" : "s"}`}
          </Button>
        </Panel>
      ) : null}

      {canManage ? (
        <Panel as="section" className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-6">
          <div className="min-w-0">
            <Eyebrow>{ENTERPRISE_PLAN.name} · {ENTERPRISE_PLAN.priceLabel}</Eyebrow>
            <p className="mt-1 text-body-sm text-text-secondary">
              {ENTERPRISE_PLAN.note}. Everything in Business, plus{" "}
              {ENTERPRISE_PLAN.features.map((f) => f.label.toLowerCase()).join(", ")}.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={enterpriseContactHref(siteConfig.supportEmail)}>{ENTERPRISE_PLAN.cta}</a>
          </Button>
        </Panel>
      ) : null}

      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={() => void cancelSubscription()}
        cancelling={cancelling}
      />
    </div>
  );
}

function SeatStepper({
  value,
  min,
  onChange,
}: {
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-[var(--radius-md)] border border-border-default">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Remove a seat"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="w-10 text-center font-mono text-sm tabular-nums text-text-primary" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        disabled={value >= MAX_SEATS}
        onClick={() => onChange(Math.min(MAX_SEATS, value + 1))}
        aria-label="Add a seat"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function formatPeriodTotal(plan: PaidHiringPlan, interval: BillingInterval, seats: number) {
  const total = periodTotal(plan, interval, seats, BILLING_CURRENCY);
  return BILLING_CURRENCY === "usd" ? formatUsd(total) : formatInr(total);
}
