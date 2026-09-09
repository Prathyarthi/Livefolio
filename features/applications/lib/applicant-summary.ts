import type { ApplicationSnapshotData } from "@/features/applications/lib/types";

/** Sum of dated experience ranges in whole years (concurrent roles can overlap). */
export function yearsFromRanges(
  experiences: ApplicationSnapshotData["experiences"],
): number | null {
  let totalMs = 0;
  let counted = false;
  const now = Date.now();

  for (const exp of experiences) {
    if (!exp.startDate) continue;
    const start = Date.parse(exp.startDate);
    if (Number.isNaN(start)) continue;
    const end = exp.endDate ? Date.parse(exp.endDate) : now;
    if (Number.isNaN(end) || end < start) continue;
    totalMs += end - start;
    counted = true;
  }

  if (!counted) return null;
  return Math.max(0, Math.round(totalMs / (365.25 * 24 * 60 * 60 * 1000)));
}

export function summarizeSnapshot(data: ApplicationSnapshotData | null | undefined) {
  if (!data) {
    return {
      name: "Candidate",
      headline: null as string | null,
      avatarUrl: null as string | null,
      location: null as string | null,
      slug: null as string | null,
      yearsExperience: null as number | null,
      recentRoles: [] as string[],
      skills: [] as string[],
      projectHighlights: [] as string[],
      educationHighlights: [] as string[],
    };
  }

  const recentRoles = data.experiences.slice(0, 3).map((e) =>
    [e.role, e.company].filter(Boolean).join(" · "),
  );

  return {
    name: data.profile.title?.trim() || "Candidate",
    headline: data.profile.headline?.trim() || null,
    avatarUrl: data.profile.avatarUrl,
    location: data.profile.location,
    slug: data.profile.slug?.trim() || null,
    yearsExperience: yearsFromRanges(data.experiences),
    recentRoles,
    skills: data.skills.slice(0, 8).map((s) => s.name),
    projectHighlights: data.projects.slice(0, 3).map((p) => p.title),
    educationHighlights: data.educations
      .slice(0, 2)
      .map((e) => [e.degree, e.institution].filter(Boolean).join(" · ")),
  };
}
