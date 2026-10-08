import {
  BILLING_CURRENCY,
  formatInr,
  formatUsd,
  type PlanAmount,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface PlanPriceProps {
  amount: PlanAmount;
  period?: string;
  size?: "sm" | "lg";
  className?: string;
}

export function PlanPrice({
  amount,
  period,
  size = "lg",
  className,
}: PlanPriceProps) {
  const primarySize =
    size === "lg" ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl";
  const formattedAmount =
    BILLING_CURRENCY === "usd"
      ? formatUsd(amount.usd)
      : formatInr(amount.inr);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      <span
        className={cn("font-bold tabular-nums text-text-primary", primarySize)}
      >
        {formattedAmount}
      </span>
      {period ? (
        <span className="text-sm text-text-muted">{period}</span>
      ) : null}
    </div>
  );
}
