"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  IMPORT_SOURCES,
  type ImportSourceValue,
} from "@/features/portfolio/constants/import-sources";
import { isImportSourceConnected } from "@/features/portfolio/lib/import-source-progress";

type ImportSourceSelectorProps = {
  activeSource: ImportSourceValue;
  onSourceChange: (source: ImportSourceValue) => void;
  portfolio: Record<string, unknown> | null | undefined;
  disabled?: boolean;
};

export function ImportSourceSelector({
  activeSource,
  onSourceChange,
  portfolio,
  disabled = false,
}: ImportSourceSelectorProps) {
  return (
    <nav aria-label="Import sources">
      <p className="mb-5 text-label font-medium uppercase tracking-wide text-text-muted">
        Import from
      </p>
      <ol className="space-y-0">
        {IMPORT_SOURCES.map((source, index) => {
          const Icon = source.icon;
          const isCurrent = source.value === activeSource;
          const isConnected = isImportSourceConnected(source.value, portfolio);

          return (
            <li key={source.value} className="relative">
              {index < IMPORT_SOURCES.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[1.125rem] top-9 z-0 h-[calc(100%-1rem)] w-0.5 -translate-x-1/2",
                    isCurrent || isConnected
                      ? "bg-brand-primary/35"
                      : "bg-border-default"
                  )}
                />
              ) : null}

              <button
                type="button"
                onClick={() => onSourceChange(source.value)}
                disabled={disabled}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "group relative z-10 flex w-full items-start gap-2.5 rounded-xl py-2 pr-2 text-left transition-colors",
                  "hover:bg-surface-sunken/80 disabled:pointer-events-none disabled:opacity-50",
                  isCurrent && "bg-surface-sunken/60"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isCurrent &&
                      "border-brand-primary bg-brand-primary text-white shadow-[0_0_0_4px_var(--color-brand-light)]",
                    isConnected &&
                      !isCurrent &&
                      "border-brand-primary bg-brand-light text-brand-primary",
                    !isConnected &&
                      !isCurrent &&
                      "border-border-default bg-surface-base text-text-muted group-hover:border-border-strong"
                  )}
                >
                  {isConnected && !isCurrent ? (
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
                    {source.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs",
                      isCurrent && "text-brand-primary",
                      isConnected && !isCurrent && "text-text-muted",
                      !isConnected && !isCurrent && "text-text-muted/80"
                    )}
                  >
                    {isCurrent
                      ? "Selected"
                      : isConnected
                        ? "Connected"
                        : "Available"}
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

type ImportSourcePickerProps = {
  activeSource: ImportSourceValue;
  onSourceChange: (source: ImportSourceValue) => void;
  disabled?: boolean;
};

/** Compact platform picker for smaller screens. */
export function ImportSourcePicker({
  activeSource,
  onSourceChange,
  disabled = false,
}: ImportSourcePickerProps) {
  return (
    <div className="mb-6 lg:hidden">
      <p className="mb-3 text-label font-medium uppercase tracking-wide text-text-muted">
        Import from
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {IMPORT_SOURCES.map((source) => {
          const Icon = source.icon;
          const isCurrent = source.value === activeSource;

          return (
            <button
              key={source.value}
              type="button"
              disabled={disabled}
              onClick={() => onSourceChange(source.value)}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-colors",
                "disabled:pointer-events-none disabled:opacity-50",
                isCurrent
                  ? "border-brand-primary bg-brand-light/60 text-brand-primary"
                  : "border-border-default bg-surface-base text-text-secondary hover:border-border-strong hover:bg-surface-sunken/60"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="text-xs font-medium">{source.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
