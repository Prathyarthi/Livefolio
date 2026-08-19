"use client";

import Link from "next/link";
import { Check, ExternalLink, FileText, Columns2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ApplicantCard } from "@/features/applications/api/use-applications";
import { getPortfolioPublicUrl } from "@/lib/domain";

export const MAX_COMPARE_CANDIDATES = 4;
export const MIN_COMPARE_CANDIDATES = 2;

type RequirementRow = {
  key: string;
  label: string;
  type: string;
  category: string;
};

function requirementKey(label: string, type: string) {
  return `${type}::${label}`;
}

export function buildRequirementRows(
  applicants: ApplicantCard[],
  jobRequirements?: Array<{ label: string; type: string; category: string }>,
): RequirementRow[] {
  if (jobRequirements && jobRequirements.length > 0) {
    const required = jobRequirements
      .filter((r) => r.type === "required")
      .map((r) => ({
        key: requirementKey(r.label, r.type),
        label: r.label,
        type: r.type,
        category: r.category,
      }));
    const preferred = jobRequirements
      .filter((r) => r.type !== "required")
      .map((r) => ({
        key: requirementKey(r.label, r.type),
        label: r.label,
        type: r.type,
        category: r.category,
      }));
    return [...required, ...preferred];
  }

  const map = new Map<string, RequirementRow>();
  for (const applicant of applicants) {
    for (const match of applicant.evidence.requirementMatches) {
      const key = requirementKey(match.label, match.type);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: match.label,
          type: match.type,
          category: match.category,
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.type === "required" && b.type !== "required") return -1;
    if (a.type !== "required" && b.type === "required") return 1;
    return a.label.localeCompare(b.label);
  });
}

function findMatch(applicant: ApplicantCard, row: RequirementRow) {
  return applicant.evidence.requirementMatches.find(
    (m) => m.label === row.label && m.type === row.type,
  );
}

export function ApplicantCompareView({
  orgSlug,
  jobId,
  jobTitle,
  applicants,
  requirements,
}: {
  orgSlug: string;
  jobId: string;
  jobTitle: string;
  applicants: ApplicantCard[];
  requirements?: Array<{ label: string; type: string; category: string }>;
}) {
  const rows = buildRequirementRows(applicants, requirements);
  const colCount = applicants.length;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}/jobs/${jobId}/applicants`}>
          ← Back to applicants
        </Link>
      </Button>

      <header className="space-y-2">
        <p className="eyebrow uppercase">Compare</p>
        <h1 className="text-h2 text-text-primary">Evidence comparison</h1>
        <p className="max-w-2xl text-body-sm text-text-secondary">
          Side-by-side requirement matches for {jobTitle} — grounded in
          portfolio evidence, not keyword scores alone.
        </p>
      </header>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
        <div
          className="min-w-[640px]"
          style={{
            display: "grid",
            gridTemplateColumns: `minmax(12rem, 14rem) repeat(${colCount}, minmax(14rem, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="sticky left-0 z-10 border-b border-border-default bg-surface-raised p-4">
            <p className="text-label uppercase text-text-muted">Requirement</p>
          </div>
          {applicants.map((applicant) => (
            <div
              key={applicant.id}
              className="border-b border-l border-border-default p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage
                    src={applicant.summary.avatarUrl ?? undefined}
                    alt=""
                  />
                  <AvatarFallback>
                    {applicant.summary.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-2">
                  <div>
                    <Link
                      href={`/company/${orgSlug}/jobs/${jobId}/applicants/${applicant.id}`}
                      className="font-medium text-text-primary hover:underline"
                    >
                      {applicant.summary.name}
                    </Link>
                    {applicant.summary.headline ? (
                      <p className="mt-0.5 line-clamp-2 text-body-sm text-text-secondary">
                        {applicant.summary.headline}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {applicant.evidence.totalRequired > 0 ? (
                      <Badge
                        variant={
                          applicant.evidence.matchedRequired ===
                          applicant.evidence.totalRequired
                            ? "success"
                            : "neutral"
                        }
                      >
                        {applicant.evidence.matchedRequired}/
                        {applicant.evidence.totalRequired} required
                      </Badge>
                    ) : null}
                    {applicant.evidence.totalPreferred > 0 ? (
                      <Badge variant="neutral">
                        {applicant.evidence.matchedPreferred}/
                        {applicant.evidence.totalPreferred} preferred
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-text-muted">
                    {[
                      applicant.summary.location,
                      applicant.summary.yearsExperience != null
                        ? `${applicant.summary.yearsExperience}+ yrs`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        href={`/company/${orgSlug}/jobs/${jobId}/applicants/${applicant.id}`}
                      >
                        Open
                      </Link>
                    </Button>
                    {applicant.summary.slug ? (
                      <Button size="sm" variant="ghost" asChild>
                        <a
                          href={getPortfolioPublicUrl(applicant.summary.slug)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Livefolio
                        </a>
                      </Button>
                    ) : null}
                    {applicant.resumeFileId ? (
                      <Button size="sm" variant="ghost" asChild>
                        <a
                          href={`/api/uploads/${applicant.resumeFileId}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Resume
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Score summary row */}
          <div className="sticky left-0 z-10 border-b border-border-default bg-surface-base/80 p-4 backdrop-blur-sm">
            <p className="text-body-sm font-medium text-text-primary">
              Match overview
            </p>
          </div>
          {applicants.map((applicant) => (
            <div
              key={`${applicant.id}-overview`}
              className="border-b border-l border-border-default bg-surface-base/40 p-4"
            >
              <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-surface-base">
                  <div
                    className="h-full rounded-full bg-brand-secondary transition-[width] duration-500"
                    style={{
                      width: `${
                        applicant.evidence.totalRequired > 0
                          ? Math.round(
                              (applicant.evidence.matchedRequired /
                                applicant.evidence.totalRequired) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                {applicant.summary.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {applicant.summary.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-[var(--radius-sm)] bg-surface-raised px-1.5 py-0.5 text-[11px] text-text-secondary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">No skills listed</p>
                )}
              </div>
            </div>
          ))}

          {/* Requirement rows */}
          {rows.length === 0 ? (
            <>
              <div className="sticky left-0 z-10 col-span-full p-8 text-center text-body-sm text-text-secondary">
                This job has no structured requirements yet. Add required /
                preferred criteria to compare evidence by requirement.
              </div>
            </>
          ) : (
            rows.map((row, index) => (
              <RequirementCompareRow
                key={row.key}
                row={row}
                applicants={applicants}
                zebra={index % 2 === 1}
              />
            ))
          )}
        </div>
      </div>

      {/* Highlights strip */}
      <section className="space-y-3">
        <h2 className="text-h3 text-text-primary">Top evidence highlights</h2>
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.min(colCount, 4)}, minmax(0, 1fr))`,
          }}
        >
          {applicants.map((applicant) => (
            <div
              key={`${applicant.id}-highlights`}
              className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4"
            >
              <p className="font-medium text-text-primary">
                {applicant.summary.name}
              </p>
              {applicant.evidence.highlights.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {applicant.evidence.highlights.slice(0, 5).map((item) => (
                    <li
                      key={`${item.kind}-${item.label}`}
                      className="text-body-sm text-text-secondary"
                    >
                      <span className="text-text-muted">{item.kind}:</span>{" "}
                      {item.label}
                      {item.detail ? (
                        <span className="mt-0.5 block text-xs text-text-muted">
                          {item.detail}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-body-sm text-text-muted">
                  No highlights available.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RequirementCompareRow({
  row,
  applicants,
  zebra,
}: {
  row: RequirementRow;
  applicants: ApplicantCard[];
  zebra: boolean;
}) {
  const rowBg = zebra ? "bg-surface-base/30" : "bg-surface-raised";

  return (
    <>
      <div
        className={`sticky left-0 z-10 border-b border-border-default p-4 ${rowBg}`}
      >
        <p className="text-body-sm font-medium text-text-primary">{row.label}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">
          {row.type === "required" ? "Required" : "Preferred"}
          {row.category ? ` · ${row.category}` : ""}
        </p>
      </div>
      {applicants.map((applicant) => {
        const match = findMatch(applicant, row);
        const matched = Boolean(match?.matched);
        const evidence = match?.evidence ?? [];

        return (
          <div
            key={`${applicant.id}-${row.key}`}
            className={`border-b border-l border-border-default p-4 ${rowBg}`}
          >
            <div className="space-y-2">
              <Badge variant={matched ? "success" : "neutral"}>
                {matched ? (
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3 w-3" aria-hidden />
                    Evidence found
                  </span>
                ) : (
                  "No clear evidence"
                )}
              </Badge>
              {evidence.length > 0 ? (
                <ul className="space-y-1.5">
                  {evidence.map((item) => (
                    <li
                      key={`${item.kind}-${item.label}`}
                      className="text-body-sm text-text-secondary"
                    >
                      <span className="text-text-muted">{item.kind}:</span>{" "}
                      {item.label}
                      {item.detail ? (
                        <span className="mt-0.5 block text-xs text-text-muted">
                          {item.detail}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : matched ? null : (
                <p className="text-xs text-text-muted">
                  No matching experience, skills, or projects found.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function CompareSelectionBar({
  orgSlug,
  jobId,
  selectedIds,
  selectedApplicants,
  onClear,
  onRemove,
}: {
  orgSlug: string;
  jobId: string;
  selectedIds: string[];
  selectedApplicants: ApplicantCard[];
  onClear: () => void;
  onRemove: (id: string) => void;
}) {
  if (selectedIds.length === 0) return null;

  const compareHref = `/company/${orgSlug}/jobs/${jobId}/applicants/compare?ids=${selectedIds.join(",")}`;
  const canCompare = selectedIds.length >= MIN_COMPARE_CANDIDATES;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-default bg-surface-raised/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Columns2 className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
          <p className="text-body-sm text-text-primary">
            {selectedIds.length} selected
            <span className="text-text-muted">
              {" "}
              · pick {MIN_COMPARE_CANDIDATES}–{MAX_COMPARE_CANDIDATES} to compare
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedApplicants.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onRemove(a.id)}
                className="inline-flex items-center gap-1 rounded-full border border-border-default bg-surface-base px-2 py-0.5 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
              >
                {a.summary.name.split(" ")[0]}
                <X className="h-3 w-3" aria-hidden />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
          {canCompare ? (
            <Button size="sm" asChild>
              <Link href={compareHref}>Compare evidence</Link>
            </Button>
          ) : (
            <Button size="sm" disabled>
              Compare evidence
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
