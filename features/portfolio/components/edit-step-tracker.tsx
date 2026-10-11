"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EDIT_STEPS,
  type EditStepValue,
} from "@/features/portfolio/constants/edit-steps";
import { isEditStepComplete } from "@/features/portfolio/lib/edit-step-progress";

type EditStepTrackerProps = {
  activeStep: EditStepValue;
  onStepChange: (step: EditStepValue) => void;
  portfolio: Record<string, unknown> | null | undefined;
};

export function EditStepTracker({
  activeStep,
  onStepChange,
  portfolio,
}: EditStepTrackerProps) {
  const activeIndex = EDIT_STEPS.findIndex((step) => step.value === activeStep);

  return (
    <nav aria-label="Portfolio sections">
      <p className="mb-4 text-label font-medium uppercase tracking-wide text-text-muted">
        Your progress
      </p>
      <ol className="space-y-0">
        {EDIT_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = step.value === activeStep;
          const isComplete = isEditStepComplete(step.value, portfolio);
          const isPast = index < activeIndex;
          const lineActive = isComplete || isPast || isCurrent;

          return (
            <li key={step.value} className="relative">
              {index < EDIT_STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[1.125rem] top-9 z-0 h-[calc(100%-1rem)] w-0.5 -translate-x-1/2",
                    lineActive ? "bg-brand-primary/35" : "bg-border-default"
                  )}
                />
              ) : null}

              <button
                type="button"
                onClick={() => onStepChange(step.value)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "group relative z-10 flex w-full max-w-full items-start gap-2 rounded-lg py-1.5 pr-1 text-left transition-colors",
                  "hover:bg-surface-sunken/80",
                  isCurrent && "bg-surface-sunken/60"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isCurrent &&
                      "border-brand-primary bg-brand-primary text-white shadow-[0_0_0_4px_var(--color-brand-light)]",
                    isComplete &&
                      !isCurrent &&
                      "border-brand-primary bg-brand-light text-brand-primary",
                    !isComplete &&
                      !isCurrent &&
                      "border-border-default bg-surface-base text-text-muted group-hover:border-border-strong"
                  )}
                >
                  {isComplete && !isCurrent ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden />
                  )}
                </span>

                <span className="min-w-0 pt-1">
                  <span
                    className={cn(
                      "block text-sm font-medium leading-tight",
                      isCurrent ? "text-text-primary" : "text-text-secondary"
                    )}
                  >
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs",
                      isCurrent && "text-brand-primary",
                      isComplete && !isCurrent && "text-text-muted",
                      !isComplete && !isCurrent && "text-text-muted/80"
                    )}
                  >
                    {isCurrent
                      ? "In progress"
                      : isComplete
                        ? "Complete"
                        : "Not started"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type EditStepProgressBarProps = {
  activeStep: EditStepValue;
};

export function EditStepProgressBar({ activeStep }: EditStepProgressBarProps) {
  const activeIndex = EDIT_STEPS.findIndex((step) => step.value === activeStep);
  const current = EDIT_STEPS[activeIndex];

  return (
    <div className="mb-6 lg:hidden">
      <div className="mb-2 flex items-center justify-between gap-3 text-body-sm">
        <span className="text-text-muted">
          Step {activeIndex + 1} of {EDIT_STEPS.length}
        </span>
        <span className="font-medium text-text-primary">{current?.label}</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"
        role="progressbar"
        aria-valuenow={activeIndex + 1}
        aria-valuemin={1}
        aria-valuemax={EDIT_STEPS.length}
        aria-label={`Step ${activeIndex + 1} of ${EDIT_STEPS.length}: ${current?.label}`}
      >
        <div
          className="h-full rounded-full bg-brand-primary transition-[width] duration-300 ease-out"
          style={{
            width: `${((activeIndex + 1) / EDIT_STEPS.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
