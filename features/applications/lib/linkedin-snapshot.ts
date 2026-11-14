import type {
  ApplicationSnapshotData,
  LinkedInSnapshot,
} from "@/features/applications/lib/types";

const MAX_EXPERIENCE = 15;
const MAX_EDUCATION = 6;
const MAX_SKILLS = 40;
const MAX_ABOUT = 1500;
const MAX_DESCRIPTION = 500;

function str(value: unknown, max = 300): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object")
    : [];
}

/** Compact, size-capped summary of a LinkedInImport row (posts are skipped). */
export function linkedInSnapshotFromImport(row: {
  profileData: unknown;
  lastSyncedAt: Date | null;
}): LinkedInSnapshot | null {
  const data = row.profileData && typeof row.profileData === "object"
    ? (row.profileData as Record<string, unknown>)
    : {};
  const snapshot: LinkedInSnapshot = {
    syncedAt: row.lastSyncedAt ? row.lastSyncedAt.toISOString() : null,
    headline: str(data.headline),
    about: str(data.about, MAX_ABOUT),
    currentPosition: str(data.currentPosition),
    location: str(data.location),
    skills: (Array.isArray(data.skills) ? data.skills : [])
      .map((s) => str(s, 80))
      .filter((s): s is string => Boolean(s))
      .slice(0, MAX_SKILLS),
    experience: rows(data.experience)
      .map((e) => ({
        title: str(e.title) ?? "",
        company: str(e.company) ?? "",
        location: str(e.location),
        startDate: str(e.startDate, 40),
        endDate: str(e.endDate, 40),
        description: str(e.description, MAX_DESCRIPTION),
      }))
      .filter((e) => e.title || e.company)
      .slice(0, MAX_EXPERIENCE),
    education: rows(data.education)
      .map((e) => ({
        school: str(e.school) ?? "",
        degree: str(e.degree),
        field: str(e.field),
        startDate: str(e.startDate, 40),
        endDate: str(e.endDate, 40),
      }))
      .filter((e) => e.school)
      .slice(0, MAX_EDUCATION),
  };
  const empty =
    !snapshot.headline &&
    !snapshot.about &&
    !snapshot.currentPosition &&
    snapshot.skills.length === 0 &&
    snapshot.experience.length === 0 &&
    snapshot.education.length === 0;
  return empty ? null : snapshot;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "Jan 2022", "2022-03", "2022" → ISO date; "Present"/unknown → null. */
export function parseLinkedInDate(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  let m = v.match(/^(\d{4})-(\d{1,2})/);
  if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)).toISOString();
  m = v.match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})$/);
  if (m && MONTHS.includes(m[1]!)) {
    return new Date(Date.UTC(Number(m[2]), MONTHS.indexOf(m[1]!), 1)).toISOString();
  }
  m = v.match(/^(\d{4})$/);
  if (m) return new Date(Date.UTC(Number(m[1]), 0, 1)).toISOString();
  return null;
}

function key(...parts: Array<string | null | undefined>): string {
  return parts.map((p) => (p ?? "").trim().toLowerCase()).join("|");
}

/**
 * The snapshot with LinkedIn import data folded into the regular fields, for ranking,
 * years of experience and filters. Portfolio entries win; LinkedIn only adds what's missing.
 */
export function withLinkedIn(
  snapshot: ApplicationSnapshotData | null | undefined,
): ApplicationSnapshotData | null | undefined {
  const li = snapshot?.linkedin;
  if (!snapshot || !li) return snapshot;

  const expKeys = new Set(snapshot.experiences.map((e) => key(e.company, e.role)));
  const experiences = [...snapshot.experiences];
  for (const e of li.experience) {
    if (expKeys.has(key(e.company, e.title))) continue;
    expKeys.add(key(e.company, e.title));
    const start = parseLinkedInDate(e.startDate);
    const ongoing = !e.endDate || /present|current|now/i.test(e.endDate);
    experiences.push({
      company: e.company,
      role: e.title,
      description: e.description ?? "",
      startDate: start,
      // Unparseable end dates count as unknown, not ongoing, so years aren't inflated.
      endDate: ongoing ? null : (parseLinkedInDate(e.endDate) ?? start),
      location: e.location,
    });
  }

  const skillKeys = new Set(snapshot.skills.map((s) => key(s.name)));
  const skills = [...snapshot.skills];
  for (const name of li.skills) {
    if (skillKeys.has(key(name))) continue;
    skillKeys.add(key(name));
    skills.push({ name, category: "LinkedIn", level: null });
  }

  const eduKeys = new Set(snapshot.educations.map((e) => key(e.institution)));
  const educations = [...snapshot.educations];
  for (const e of li.education) {
    if (eduKeys.has(key(e.school))) continue;
    eduKeys.add(key(e.school));
    educations.push({
      institution: e.school,
      degree: e.degree ?? "",
      field: e.field,
      description: null,
      startDate: parseLinkedInDate(e.startDate),
      endDate: parseLinkedInDate(e.endDate),
    });
  }

  const join = (a: string | null | undefined, b: string | null | undefined) =>
    [a?.trim(), b?.trim()].filter(Boolean).join(" · ");

  return {
    ...snapshot,
    profile: {
      ...snapshot.profile,
      headline: join(snapshot.profile.headline, join(li.headline, li.currentPosition)),
      summary: join(snapshot.profile.summary, li.about),
      location: snapshot.profile.location ?? li.location,
    },
    experiences,
    skills,
    educations,
    // Folded in; drop the raw copy so nothing reads it twice.
    linkedin: null,
  };
}

/** Plain text of the LinkedIn import, to tell which matches came only from LinkedIn. */
export function linkedInText(snapshot: ApplicationSnapshotData | null | undefined): string {
  const li = snapshot?.linkedin;
  if (!li) return "";
  return [
    li.headline,
    li.about,
    li.currentPosition,
    ...li.skills,
    ...li.experience.flatMap((e) => [e.title, e.company, e.description]),
    ...li.education.flatMap((e) => [e.school, e.degree, e.field]),
  ]
    .filter(Boolean)
    .join(" | ");
}
