"use client";

import Link from "next/link";
import type { PoolGapReport } from "@/features/applications/lib/pool-gaps";

export function ApplicantPoolGapReport({
  report,
  orgSlug,
  jobId,
  caption,
}: {
  report: PoolGapReport;
  orgSlug: string;
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
            href={`/company/${orgSlug}/jobs/${jobId}`}
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

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5">
      <div>
        <h2 className="text-h3 text-text-primary">Pool coverage</h2>
        <p className="mt-1 text-body-sm text-text-secondary">{caption}</p>
      </div>

      {uncoveredRequired.length > 0 ? (
        <p className="text-body-sm text-semantic-danger">
          Nobody in this pool has evidence for{" "}
          {uncoveredRequired.map((row) => row.label).join(", ")}.
        </p>
      ) : weakRequired.length > 0 ? (
        <p className="text-body-sm text-text-secondary">
          Thin coverage on{" "}
          {weakRequired.map((row) => row.label).join(", ")} — under 25% of
          applicants.
        </p>
      ) : (
        <p className="text-body-sm text-text-secondary">
          Every required item has at least one applicant with evidence.
        </p>
      )}

      <ul className="space-y-3">
        {report.rows.map((row) => (
          <li key={`${row.type}::${row.label}`} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-body-sm text-text-primary">
                <span className="font-medium">{row.label}</span>
                <span className="ml-2 text-xs text-text-muted">
                  {row.type === "required" ? "Required" : "Preferred"}
                </span>
              </p>
              <p className="text-body-sm tabular-nums text-text-secondary">
                {row.matchedCount}/{row.poolSize} · {row.coveragePercent}%
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={`h-full rounded-full ${
                  row.matchedCount === 0
                    ? "bg-semantic-danger"
                    : row.coveragePercent < 25
                      ? "bg-warning"
                      : "bg-brand-secondary"
                }`}
                style={{ width: `${Math.max(row.coveragePercent, row.matchedCount === 0 ? 0 : 4)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
