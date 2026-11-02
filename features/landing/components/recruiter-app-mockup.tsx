"use client";

import { useId, useMemo, useState } from "react";
import { Briefcase, Inbox, Quote, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DEMO_APPLICANTS,
  DEMO_TERMS,
} from "@/features/landing/components/recruiter-demo-data";
import {
  REFERENCE_SCORE_POINTS,
  referenceScore,
} from "@/features/search/lib/references";
import { cn } from "@/lib/utils";

const NAV = [
  { icon: Briefcase, label: "Jobs", active: true },
  { icon: Inbox, label: "Applicants" },
  { icon: Users, label: "Talent search" },
];

/** App-like ranked shortlist with a working Include references switch. Fake demo data. */
export function RecruiterAppMockup() {
  const [include, setInclude] = useState(true);
  const switchId = useId();

  const ranked = useMemo(
    () =>
      DEMO_APPLICANTS.map((applicant) => {
        const { score } = referenceScore(applicant.references, DEMO_TERMS);
        const added = include ? Math.round(score * REFERENCE_SCORE_POINTS) : 0;
        return {
          ...applicant,
          added,
          total: Math.min(100, applicant.livefolio + added),
        };
      }).sort((a, b) => b.total - a.total),
    [include],
  );

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-surface-base text-left shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-border-default px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-border-default" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-default" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-default" />
        <span className="ml-3 truncate text-xs text-text-secondary">
          Demo workspace · fake data
        </span>
      </div>
      <div className="flex">
        <aside className="hidden w-48 shrink-0 border-r border-border-default p-3 md:block">
          <p className="px-2 text-xs font-medium text-text-secondary">Acme (demo)</p>
          <ul className="mt-3 space-y-1">
            {NAV.map((item) => (
              <li
                key={item.label}
                className={cn(
                  "flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-body-sm",
                  item.active
                    ? "bg-surface-sunken text-text-primary"
                    : "text-text-secondary",
                )}
              >
                <item.icon className="h-3.5 w-3.5" aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-body-sm font-semibold text-text-primary">
                React + Node engineer
              </p>
              <p className="text-xs text-text-secondary">
                {ranked.length} applicants · Best match
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch id={switchId} size="sm" checked={include} onCheckedChange={setInclude} />
              <Label htmlFor={switchId} className="text-xs">
                Include references
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-2 border-b border-border-default px-4 py-2 text-xs text-text-secondary">
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">react OR node, 2+ years</span>
          </div>
          <ol>
            {ranked.map((a, i) => (
              <li
                key={a.id}
                className="flex gap-3 border-b border-border-default px-4 py-3 last:border-b-0"
              >
                <span className="w-4 shrink-0 pt-0.5 font-mono text-xs text-text-secondary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-body-sm font-medium text-text-primary">{a.name}</p>
                    <p className="text-xs text-text-secondary">{a.headline}</p>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {(a.added > 0
                      ? [`Reference added +${a.added}`, ...a.reasons]
                      : a.reasons
                    )
                      .slice(0, 3)
                      .join(" · ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.proof.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[11px]">
                        {p}
                      </Badge>
                    ))}
                    {a.references.length > 0 ? (
                      <Badge variant="brand" className="text-[11px]">
                        <Quote className="h-3 w-3" aria-hidden />
                        {a.references.length}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xl font-semibold tabular-nums text-text-primary">
                    {a.total}
                  </p>
                  <p className="text-[11px] text-text-secondary">/100</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
