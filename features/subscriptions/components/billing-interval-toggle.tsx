"use client";

import {
  BILLING_INTERVAL_LABELS,
  BILLING_INTERVALS,
  getProSavingsPercent,
  type BillingInterval,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface BillingIntervalToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
}

export function BillingIntervalToggle({
  value,
  onChange,
  className,
}: BillingIntervalToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-1 rounded-full border border-border-default bg-surface-sunken p-1",
        className
      )}
      role="radiogroup"
      aria-label="Billing interval"
    >
      {BILLING_INTERVALS.map((interval) => {
        const selected = value === interval;
        const savings = getProSavingsPercent(interval);

        return (
          <button
            key={interval}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(interval)}
            className={cn(
              "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
              selected
                ? "bg-brand-fill text-brand-on-fill"
                : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
            )}
          >
            {BILLING_INTERVAL_LABELS[interval]}
            {savings != null && savings > 0 ? (
              <span
                className={cn(
                  "ml-1.5 text-[10px] font-semibold uppercase tracking-wide",
                  selected ? "text-brand-on-fill/80" : "text-success"
                )}
              >
                −{savings}%
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
