import { Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  HIRING_PLAN_DISPLAY,
  planLimitLines,
  type HiringDisplayPlan,
} from "@/lib/hiring-plans";
import { cn } from "@/lib/utils";

/** Limits, then "Everything in <previous>, plus" features. Shared by /recruiters and billing. */
export function HiringPlanFeatures({
  plan,
  compact = false,
  className,
}: {
  plan: HiringDisplayPlan;
  compact?: boolean;
  className?: string;
}) {
  const display = HIRING_PLAN_DISPLAY[plan];
  const text = compact ? "text-xs" : "text-body-sm";
  return (
    <div className={cn("space-y-4", className)}>
      <ul className={cn("space-y-1 font-mono tabular-nums text-text-primary", compact ? "text-[11px]" : "text-xs")}>
        {planLimitLines(plan).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <Separator className="bg-border-default" />
      <div className="space-y-2">
        <p className={cn("font-medium text-text-primary", text)}>{display.featuresHeading}:</p>
        <ul className="space-y-2">
          {display.features.map((feature) => (
            <li key={feature.label} className={cn("flex items-start gap-2 text-text-secondary", text)}>
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" aria-hidden />
              {feature.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
