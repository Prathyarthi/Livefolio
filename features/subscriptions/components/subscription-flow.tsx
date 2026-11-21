"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import {
  BILLING_INTERVALS,
  BILLING_INTERVAL_LABELS,
  pricingPlans,
  type BillingInterval,
} from "@/lib/pricing";
import { BillingIntervalToggle } from "./billing-interval-toggle";
import { PricingCards } from "./pricing-cards";
import { startProCheckout } from "../lib/checkout";

export function SubscriptionFlow() {
  const { data: session, status } = useSession();
  const authLoading = status === "loading";
  const user = session?.user;

  const [subscribing, setSubscribing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [paymentsReady, setPaymentsReady] = useState(false);
  const [checkoutIntervals, setCheckoutIntervals] = useState<BillingInterval[]>([
    "monthly",
  ]);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");
  const [paidActive, setPaidActive] = useState(false);
  const [paidPending, setPaidPending] = useState(false);
  const [accessTier, setAccessTier] = useState<"free" | "trial" | "pro" | null>(
    null
  );
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [complimentaryUntil, setComplimentaryUntil] = useState<string | null>(
    null
  );
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

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

  useEffect(() => {
    if (!user) {
      setPaymentsReady(false);
      setCheckoutIntervals(["monthly"]);
      setPaidActive(false);
      setPaidPending(false);
      setAccessTier(null);
      setTrialDaysRemaining(0);
      setComplimentaryUntil(null);
      return;
    }

    let cancelled = false;
    const loadBillingState = async () => {
      setBillingLoading(true);
      try {
        const res = await fetch("/api/billing/me", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as {
          razorpayReady?: boolean;
          availableIntervals?: BillingInterval[];
          subscription?: { status?: string } | null;
          access?: {
            tier?: "free" | "trial" | "pro";
            trialDaysRemaining?: number;
            complimentaryProUntil?: string | null;
          };
        };
        if (cancelled) return;

        const intervals =
          data.availableIntervals?.length
            ? data.availableIntervals
            : (["monthly"] as BillingInterval[]);

        setPaymentsReady(Boolean(data.razorpayReady));
        setCheckoutIntervals(intervals);
        setPaidActive(data.subscription?.status === "ACTIVE");
        setPaidPending(data.subscription?.status === "PENDING");
        setAccessTier(data.access?.tier ?? null);
        setTrialDaysRemaining(data.access?.trialDaysRemaining ?? 0);
        setComplimentaryUntil(data.access?.complimentaryProUntil ?? null);
      } catch {
        if (cancelled) return;
        setPaymentsReady(false);
        setCheckoutIntervals(["monthly"]);
        setPaidActive(false);
        setPaidPending(false);
        setAccessTier(null);
        setTrialDaysRemaining(0);
        setComplimentaryUntil(null);
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    };

    loadBillingState();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const subscribeToPaid = useCallback(async () => {
    setBanner(null);
    setSubscribing(true);
    try {
      await startProCheckout({
        interval: billingInterval,
        razorpayLoaded,
        onError: setBanner,
        onDismiss: () => setPaidPending(false),
      });
    } catch {
      setBanner("Something went wrong. Please try again.");
    } finally {
      setSubscribing(false);
    }
  }, [billingInterval, razorpayLoaded]);

  // Plans and amounts render on the server (static HTML) from lib/pricing.
  // Only the account-specific buttons wait for the session and /api/billing/me.
  const stateLoading = authLoading || billingLoading;

  return (
    <div className="flex flex-col gap-4">
      {banner && (
        <p className="rounded-[var(--radius-md)] bg-danger-bg px-4 py-3 text-center text-body-sm text-danger">
          <span>{banner}</span>{" "}
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="underline hover:opacity-80"
          >
            Dismiss
          </button>
        </p>
      )}
      {!stateLoading && accessTier === "trial" && (
        <p className="rounded-[var(--radius-md)] bg-success-bg px-4 py-3 text-center text-body-sm text-success">
          You are on your free month. {trialDaysRemaining} day
          {trialDaysRemaining === 1 ? "" : "s"} remaining with full features.
        </p>
      )}
      {!stateLoading &&
        accessTier === "pro" &&
        !paidActive &&
        complimentaryUntil && (
          <p className="rounded-[var(--radius-md)] bg-success-bg px-4 py-3 text-center text-body-sm text-success">
            Pro is included free until{" "}
            {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
              new Date(complimentaryUntil)
            )}
            . Subscribe any time to keep Pro after that.
          </p>
        )}
      {!stateLoading && accessTier === "free" && (
        <p className="rounded-[var(--radius-md)] bg-warning-bg px-4 py-3 text-center text-body-sm text-text-secondary">
          Your free month ended. Free essentials remain active; upgrade to Pro
          for resume and platform imports, and premium templates.
        </p>
      )}

      <div className="flex flex-col items-center gap-2">
        <BillingIntervalToggle
          value={billingInterval}
          onChange={setBillingInterval}
        />
        {user &&
          paymentsReady &&
          !checkoutIntervals.includes(billingInterval) && (
            <p className="max-w-md text-center text-xs text-text-muted">
              {billingInterval === "quarterly" || billingInterval === "yearly"
                ? `${BILLING_INTERVAL_LABELS[billingInterval]} checkout is not set up on this server yet. You can still compare prices. Use Monthly to subscribe today.`
                : "This billing period is not available for checkout yet."}
            </p>
          )}
      </div>

      <PricingCards
        stateLoading={stateLoading}
        plans={pricingPlans}
        loggedIn={Boolean(user)}
        paidActive={paidActive}
        paidPending={paidPending}
        paymentsReady={paymentsReady}
        subscribing={subscribing}
        billingInterval={billingInterval}
        checkoutIntervals={checkoutIntervals}
        onSubscribePaid={subscribeToPaid}
      />
    </div>
  );
}
