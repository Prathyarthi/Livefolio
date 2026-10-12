"use client";

import { cn } from "@/lib/utils";
import {
  IMPORT_SOURCES,
  type ImportSourceValue,
} from "@/features/portfolio/constants/import-sources";

type ImportSourceSelectorProps = {
  activeSource: ImportSourceValue;
  onSourceChange: (source: ImportSourceValue) => void;
  disabled?: boolean;
};

const sourceButtonClass = (isCurrent: boolean) =>
  cn(
    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-sm font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    isCurrent
      ? "border-transparent bg-brand-light text-brand-primary"
      : "border-border-default text-text-muted hover:bg-surface-sunken hover:text-text-primary"
  );

export function ImportSourceSelector({
  activeSource,
  onSourceChange,
  disabled = false,
}: ImportSourceSelectorProps) {
  return (
    <nav aria-label="Import sources">
      <p className="mb-3 text-label font-medium uppercase tracking-wide text-text-muted">
        Import from
      </p>
      <div className="flex flex-col items-start gap-2">
        {IMPORT_SOURCES.map((source) => {
          const Icon = source.icon;
          const isCurrent = source.value === activeSource;

          return (
            <button
              key={source.value}
              type="button"
              onClick={() => onSourceChange(source.value)}
              disabled={disabled}
              aria-pressed={isCurrent}
              className={sourceButtonClass(isCurrent)}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{source.label}</span>
            </button>
          );
        })}
      </div>
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
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {IMPORT_SOURCES.map((source) => {
          const Icon = source.icon;
          const isCurrent = source.value === activeSource;

          return (
            <button
              key={source.value}
              type="button"
              disabled={disabled}
              onClick={() => onSourceChange(source.value)}
              aria-pressed={isCurrent}
              className={sourceButtonClass(isCurrent)}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{source.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}