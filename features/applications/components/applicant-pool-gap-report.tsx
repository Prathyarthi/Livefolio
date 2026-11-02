"use client";

import Link from "next/link";
import { RichText } from "@/components/rich-text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PoolGapReport } from "@/features/applications/lib/pool-gaps";
import { stripRichTextToPlain } from "@/lib/rich-text";

export function ApplicantPoolGapReport({
  report,
  orgSlug,
  workspaceSlug,
  jobId,
  caption,
}: {
  report: PoolGapReport;
  orgSlug: string;
  workspaceSlug: string;
  jobId: string;
  caption: string;
}) {
  if (report.rows.length === 0) {
    return (
      <section className="rounded-[var(--radius-lg)] border border-dashed border-border-default px-5 py-4">
        <h2 className="text-h3 text-text-primary">Pool coverage</h2>
        <p className="mt-1 text-body-sm text-text-secondary">
          Add structured requirements on this job to see which must-haves nobody
          in the pool can prove.{" "}
          <Link
            href={`/company/${orgSlug}/${workspaceSlug}/jobs/${jobId}`}
            className="underline underline-offset-2"
          >
            Edit job
          </Link>
        </p>
      </section>
    );
  }

  if (report.poolSize === 0) return null;

  const uncoveredRequired = report.rows.filter(
    (row) => row.type === "required" && row.matchedCount === 0,
  );
  const weakRequired = report.rows.filter(
    (row) =>
      row.type === "required" &&
      row.matchedCount > 0 &&
      row.coveragePercent < 25,
  );

  const sortedRows = [...report.rows].sort(
    (a, b) =>
      a.coveragePercent - b.coveragePercent ||
      (a.type === "required" ? 0 : 1) - (b.type === "required" ? 0 : 1),
  );
  const summary =
    uncoveredRequired.length > 0
      ? `No evidence for ${uncoveredRequired.map((row) => stripRichTextToPlain(row.label)).join(", ")}`
      : weakRequired.length > 0
        ? `Thin coverage on ${weakRequired.map((row) => stripRichTextToPlain(row.label)).join(", ")}`
        : "Every required item has evidence";

  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised"
    >
      <AccordionItem value="coverage" className="border-b-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1 text-left">
            <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
              Pool coverage
            </span>
            <span
              className={cn(
                "truncate text-body-sm",
                uncoveredRequired.length > 0 ? "text-danger" : "text-text-secondary",
              )}
            >
              {summary}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-4 pb-4">
          <p className="text-body-sm text-text-secondary">{caption}</p>
          <ul className="space-y-3">
            {sortedRows.map((row) => (
              <li key={`${row.type}::${row.label}`} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-body-sm text-text-primary">
                    <span className="font-medium">
                      <RichText as="span" text={row.label} />
                    </span>
                    <span className="ml-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
                      {row.type === "required" ? "Required" : "Preferred"}
                    </span>
                  </p>
                  <p className="font-mono text-xs tabular-nums text-text-secondary">
                    {row.matchedCount}/{row.poolSize} · {row.coveragePercent}%
                  </p>
                </div>
                <Progress
                  value={row.coveragePercent}
                  aria-label={`${stripRichTextToPlain(row.label)} coverage`}
                  className={cn(
                    "h-1.5 bg-surface-sunken",
                    row.matchedCount === 0
                      ? "[&>[data-slot=progress-indicator]]:bg-danger"
                      : "[&>[data-slot=progress-indicator]]:bg-brand-primary",
                  )}
                />
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
