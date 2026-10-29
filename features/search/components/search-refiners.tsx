"use client";

import { Button } from "@/components/ui/button";
import {
  EXPERIENCE_BANDS,
  type FacetBucket,
  type SearchFacets,
} from "@/features/search/lib/facets";
import { PROOF_LABELS, isProofKind, type ProofKind } from "@/features/search/lib/proof";
import type { SearchSort } from "@/features/search/lib/query";

export type FacetKind = "skill" | "location" | "experience" | "proof";

export type ActiveRefiners = {
  skill?: string;
  location?: string;
  experience?: string;
  proof?: ProofKind;
};

export function experienceBandRange(id: string | undefined): {
  minExperience?: number;
  maxExperience?: number;
} {
  const band = EXPERIENCE_BANDS.find((b) => b.id === id);
  if (!band) return {};
  return {
    minExperience: band.min,
    maxExperience: band.max ?? undefined,
  };
}

export function SortToggle({
  value,
  onChange,
}: {
  value: SearchSort;
  onChange: (value: SearchSort) => void;
}) {
  return (
    <div
      className="inline-flex rounded-[var(--radius-md)] border border-border-default p-0.5"
      role="group"
      aria-label="Sort results"
    >
      {(["relevance", "recent"] as const).map((option) => (
        <Button
          key={option}
          size="sm"
          variant={value === option ? "default" : "ghost"}
          className="h-7"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
        >
          {option === "relevance" ? "Best match" : "Most recent"}
        </Button>
      ))}
    </div>
  );
}

export function ProofBadges({ proof }: { proof: string[] }) {
  const kinds = proof.filter(isProofKind);
  if (kinds.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {kinds.map((kind) => (
        <span
          key={kind}
          className="rounded-full border border-border-default px-2 py-0.5 text-xs text-text-secondary"
        >
          {PROOF_LABELS[kind]}
        </span>
      ))}
    </div>
  );
}

const GROUPS: Array<{ kind: FacetKind; key: keyof SearchFacets; label: string }> = [
  { kind: "proof", key: "proof", label: "Proof of work" },
  { kind: "skill", key: "skills", label: "Skills" },
  { kind: "experience", key: "experience", label: "Experience" },
  { kind: "location", key: "locations", label: "Location" },
];

function isActive(kind: FacetKind, bucket: FacetBucket, active: ActiveRefiners) {
  const current = active[kind];
  if (!current) return false;
  if (kind === "experience" || kind === "proof") return current === bucket.id;
  return current.toLowerCase() === bucket.id || current.toLowerCase() === bucket.label.toLowerCase();
}

/** Clickable counts over the current result set; clicking an active chip clears it. */
export function FacetPanel({
  facets,
  active,
  onSelect,
}: {
  facets: SearchFacets | undefined;
  active: ActiveRefiners;
  onSelect: (kind: FacetKind, bucket: FacetBucket | null) => void;
}) {
  if (!facets) return null;
  const groups = GROUPS.filter(({ key }) => facets[key].length > 0);
  if (groups.length === 0) return null;

  return (
    <div className="space-y-2">
      {groups.map(({ kind, key, label }) => (
        <div key={kind} className="flex flex-wrap items-center gap-1.5">
          <span className="w-28 shrink-0 text-xs text-text-muted">{label}</span>
          {facets[key].map((bucket) => {
            const on = isActive(kind, bucket, active);
            return (
              <button
                key={bucket.id}
                type="button"
                onClick={() => onSelect(kind, on ? null : bucket)}
                aria-pressed={on}
                className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                  on
                    ? "border-brand-secondary/60 bg-brand-secondary/10 text-text-primary"
                    : "border-border-default text-text-secondary hover:bg-surface-base"
                }`}
              >
                {bucket.label}
                <span className="ml-1 opacity-60">{bucket.count}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
