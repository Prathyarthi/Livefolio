import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { summarizeSnapshot } from "@/features/applications/lib/applicant-summary";
import {
  PROOF_KINDS,
  PROOF_LABELS,
  isProofKind,
  proofKindsOf,
  type ProofKind,
} from "@/features/search/lib/proof";

export type FacetBucket = { id: string; label: string; count: number };

export type SearchFacets = {
  skills: FacetBucket[];
  locations: FacetBucket[];
  experience: FacetBucket[];
  proof: FacetBucket[];
};

export const EXPERIENCE_BANDS = [
  { id: "0-2", label: "0–2 years", min: 0, max: 2 },
  { id: "3-5", label: "3–5 years", min: 3, max: 5 },
  { id: "6-10", label: "6–10 years", min: 6, max: 10 },
  { id: "11+", label: "11+ years", min: 11, max: null },
] as const;

function topBuckets(counts: Map<string, { label: string; count: number }>, max: number) {
  return [...counts.entries()]
    .map(([id, row]) => ({ id, label: row.label, count: row.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, max);
}

/** The per-candidate values facets count; stored on applications so pools never reload snapshots for counts. */
export type FacetFields = {
  skillNames: string[];
  locationLabel: string | null;
  yearsExperience: number | null;
  proofKinds: string[];
};

export function facetFieldsOf(
  snapshot: ApplicationSnapshotData | null | undefined,
): FacetFields {
  return {
    skillNames: (snapshot?.skills ?? []).map((s) => s.name.trim()),
    locationLabel: snapshot?.profile.location?.split(",")[0]?.trim() || null,
    yearsExperience: summarizeSnapshot(snapshot).yearsExperience,
    proofKinds: proofKindsOf(snapshot),
  };
}

/** Counts per filter value over the matched set, so recruiters can see how a refinement narrows results. */
export function buildSearchFacets(
  snapshots: Array<ApplicationSnapshotData | null | undefined>,
): SearchFacets {
  return buildFacetsFromFields(
    snapshots.filter(Boolean).map((snapshot) => facetFieldsOf(snapshot)),
  );
}

export function buildFacetsFromFields(rows: FacetFields[]): SearchFacets {
  const skills = new Map<string, { label: string; count: number }>();
  const locations = new Map<string, { label: string; count: number }>();
  const experience = new Map<string, number>();
  const proof = new Map<ProofKind, number>();

  for (const fields of rows) {
    const seenSkills = new Set<string>();
    for (const name of fields.skillNames) {
      const label = name.trim();
      const id = label.toLowerCase();
      if (!id || seenSkills.has(id)) continue;
      seenSkills.add(id);
      const row = skills.get(id) ?? { label, count: 0 };
      row.count += 1;
      skills.set(id, row);
    }

    const place = fields.locationLabel?.trim();
    if (place) {
      const id = place.toLowerCase();
      const row = locations.get(id) ?? { label: place, count: 0 };
      row.count += 1;
      locations.set(id, row);
    }

    const years = fields.yearsExperience;
    if (years != null) {
      const band = EXPERIENCE_BANDS.find(
        (b) => years >= b.min && (b.max == null || years <= b.max),
      );
      if (band) experience.set(band.id, (experience.get(band.id) ?? 0) + 1);
    }

    for (const kind of fields.proofKinds) {
      if (!isProofKind(kind)) continue;
      proof.set(kind, (proof.get(kind) ?? 0) + 1);
    }
  }

  return {
    skills: topBuckets(skills, 12),
    locations: topBuckets(locations, 8),
    experience: EXPERIENCE_BANDS.filter((b) => experience.has(b.id)).map((b) => ({
      id: b.id,
      label: b.label,
      count: experience.get(b.id)!,
    })),
    proof: PROOF_KINDS.filter((k) => proof.has(k)).map((k) => ({
      id: k,
      label: PROOF_LABELS[k],
      count: proof.get(k)!,
    })),
  };
}
