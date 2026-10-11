"use client";

import { cn } from "@/lib/utils";
import {
  EDIT_STEPS,
  type EditStepValue,
} from "@/features/portfolio/constants/edit-steps";

type EditStepTrackerProps = {
  activeStep: EditStepValue;
  onStepChange: (step: EditStepValue) => void;
};

export function EditStepTracker({
  activeStep,
  onStepChange,
}: EditStepTrackerProps) {
  return (
    <nav aria-label="Portfolio sections">
      <p className="mb-4 text-label font-medium uppercase tracking-wide text-text-muted">
        Sections
      </p>
      <ul className="space-y-0.5">
        {EDIT_STEPS.map((step) => {
          const Icon = step.icon;
          const isCurrent = step.value === activeStep;

          return (
            <li key={step.value}>
              <button
                type="button"
                onClick={() => onStepChange(step.value)}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "group flex w-full max-w-full items-center gap-2 rounded-lg py-1.5 pr-1 text-left transition-colors",
                  "hover:bg-surface-sunken/80",
                  isCurrent && "bg-surface-sunken/60"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isCurrent
                      ? "border-brand-primary bg-brand-primary text-white shadow-[0_0_0_4px_var(--color-brand-light)]"
                      : "border-border-default bg-surface-base text-text-muted group-hover:border-border-strong"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>

                <span
                  className={cn(
                    "min-w-0 text-sm font-medium leading-tight",
                    isCurrent ? "text-text-primary" : "text-text-secondary"
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
