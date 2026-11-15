"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BillingInterval, PricingPlan } from "@/lib/pricing";
import {
  BILLING_INTERVAL_LABELS,
  getBillingPeriodSuffix,
  getProSavingsPercent,
  PAID_PLAN_SLUG,
  PRO_PRICING,
} from "@/lib/pricing";
import { PlanPrice } from "./plan-price";
import { subscribeButtonLabel } from "../lib/checkout";

interface PricingCardsProps {
  /** True until the session and billing state are known: buttons show a placeholder. */
  stateLoading?: boolean;
  plans: PricingPlan[];
  loggedIn: boolean;
  paidActive: boolean;
  paidPending: boolean;
  paymentsReady: boolean;
  subscribing: boolean;
  billingInterval: BillingInterval;
  checkoutIntervals: BillingInterval[];
  onSubscribePaid: () => void;
}

export function PricingCards({
  stateLoading = false,
  plans,
  loggedIn,
  paidActive,
  paidPending,
  paymentsReady,
  subscribing,
  billingInterval,
  checkoutIntervals,
  onSubscribePaid,
}: PricingCardsProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 md:gap-6">
      {plans.map((plan) => {
        const isPaid = plan.slug === PAID_PLAN_SLUG;
        const proAmount = isPaid
          ? PRO_PRICING[billingInterval]
          : plan.monthlyAmount;
        const proPeriod = isPaid
          ? getBillingPeriodSuffix(billingInterval)
          : plan.pricePeriod;
        const savings = isPaid ? getProSavingsPercent(billingInterval) : null;
        const intervalCheckoutReady = checkoutIntervals.includes(billingInterval);
        const showSubscribe =
          isPaid &&
          loggedIn &&
          !paidActive &&
          paymentsReady &&
          !paidPending &&
          intervalCheckoutReady;
        const showSubscribeDisabled =
          isPaid && loggedIn && !paidActive && !paymentsReady && !paidPending;

        const showIntervalUnavailable =
          isPaid &&
          loggedIn &&
          !paidActive &&
          paymentsReady &&
          !paidPending &&
          !intervalCheckoutReady;

        return (
          <div key={plan.slug} className="relative">
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0">
                <Badge variant="brand">{plan.badge}</Badge>
              </div>
            )}
            <Card
              className={`h-full ${
                plan.highlight
                  ? "border-2 border-brand-secondary"
                  : "border-border-default"
              }`}
            >
              <CardContent className="flex h-full flex-col gap-6">
                <div>
                  <p className="text-label uppercase text-text-secondary">
                    {plan.eyebrow}
                  </p>
                  <h2 className="mt-2 text-h2 text-text-primary">
                    {plan.name}
                  </h2>
                  <PlanPrice
                    amount={proAmount}
                    period={proPeriod}
                    size="lg"
                    className="mt-5"
                  />
                  {isPaid && savings != null && savings > 0 && (
                    <p className="mt-2 text-xs font-medium text-success">
                      Save {savings}% vs monthly
                    </p>
                  )}
                  <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                    {plan.description}
                  </p>
                  {isPaid && paidActive && (
                    <p className="mt-3 text-xs text-success">
                      Your subscription is active.
                    </p>
                  )}
                  {isPaid && paidPending && (
                    <p className="mt-3 text-xs text-text-secondary">
                      A recurring payment failed. Use Razorpay&apos;s recovery
                      email or contact support to avoid a duplicate subscription.
                    </p>
                  )}
                  {isPaid && loggedIn && !paymentsReady && !paidActive && (
                    <p className="mt-3 text-xs text-text-muted">
                      Payments are not configured.
                    </p>
                  )}
                  {plan.note && !isPaid && (
                    <p className="mt-3 text-xs text-text-muted">{plan.note}</p>
                  )}
                  {isPaid && plan.note && !paidActive && (
                    <p className="mt-3 text-xs text-text-muted">{plan.note}</p>
                  )}
                </div>

                <ul className="flex flex-1 flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex gap-3 text-body-sm leading-snug"
                    >
                      <span
                        className={`w-5 shrink-0 text-center ${
                          feature.included ? "text-success" : "text-text-muted"
                        }`}
                        aria-hidden
                      >
                        {feature.included ? "✓" : "–"}
                      </span>
                      <span
                        className={
                          feature.included ? "text-text-primary" : "text-text-muted"
                        }
                      >
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {stateLoading && (
                  <div
                    className="skeleton-shimmer mt-auto h-10 w-full rounded-[var(--radius-md)]"
                    aria-hidden
                  />
                )}

                {!stateLoading && plan.slug === "starter" && (
                  <Button asChild variant="outline" className="mt-auto w-full">
                    <Link href={loggedIn ? "/dashboard" : plan.ctaHref}>
                      {loggedIn ? "Continue with Free" : plan.ctaLabel}
                    </Link>
                  </Button>
                )}

                {!stateLoading && isPaid && !loggedIn && (
                  <Button asChild className="mt-auto w-full">
                    <Link href="/sign-up">Sign up to subscribe</Link>
                  </Button>
                )}

                {!stateLoading && isPaid && loggedIn && paidActive && (
                  <Button
                    asChild
                    variant="outline"
                    className="mt-auto w-full"
                  >
                    <Link href="/dashboard/billing">Manage billing</Link>
                  </Button>
                )}

                {!stateLoading && isPaid && loggedIn && showSubscribe && (
                  <Button
                    type="button"
                    className="mt-auto w-full"
                    disabled={subscribing}
                    onClick={onSubscribePaid}
                  >
                    {subscribeButtonLabel(billingInterval, subscribing)}
                  </Button>
                )}

                {!stateLoading && isPaid && loggedIn && showSubscribeDisabled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-auto w-full"
                    disabled
                  >
                    Subscribe to Pro
                  </Button>
                )}

                {!stateLoading && isPaid && loggedIn && showIntervalUnavailable && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-auto w-full"
                    disabled
                  >
                    {BILLING_INTERVAL_LABELS[billingInterval]} checkout unavailable
                  </Button>
                )}

                {!stateLoading && isPaid && loggedIn && paidPending && paymentsReady && intervalCheckoutReady && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-auto w-full"
                    disabled
                  >
                    Payment recovery required
                  </Button>
                )}

                {!stateLoading && isPaid && loggedIn && paidPending && !paymentsReady && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-auto w-full"
                    disabled
                  >
                    Complete subscription
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
