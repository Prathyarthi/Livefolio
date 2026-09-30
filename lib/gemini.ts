import type { PdfExtractionQuality } from "@/lib/pdf-extract";
import { generateOpenRouterResumeText } from "@/lib/openrouter";
import {
  RESUME_PARSER_SYSTEM,
  buildResumeUserMessage,
} from "@/lib/resume-parser-prompt";
import { normalizeDescription } from "@/lib/description";
import { stripBulletPrefix } from "@/lib/text";
import { normalizeSocialProfiles } from "@/lib/social-profile";
import type { SectionKey } from "@/features/templates/section-labels";

export interface ParsedCustomSection {
  sectionType: string;
  label: string;
  items: Record<string, unknown>[];
}

export interface ParsedResume {
  name: string;
  headline: string;
  summary: string;
  contact: {
    email: string | null;
    phone: string | null;
    websiteUrl: string | null;
    location: string | null;
  };
  socialProfiles: {
    platform: string;
    url: string | null;
    username: string | null;
  }[];
  experiences: {
    company: string;
    role: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string | null;
    startDate: string | null;
    endDate: string | null;
    gpa: string | null;
  }[];
  skills: {
    name: string;
    category: string;
  }[];
  projects: {
    title: string;
    description: string;
    techStack: string[];
    liveUrl: string | null;
    sourceUrl: string | null;
  }[];
  achievements: string[];
  certifications: {
    name: string;
    issuer: string;
    issueDate: string | null;
    url: string | null;
  }[];
  customSections: ParsedCustomSection[];
  /** Original resume section headings mapped to canonical keys. */
  sectionLabels?: Partial<Record<SectionKey, string>>;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function normalizeString(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "string") return v;
  return String(v);
}

function normalizeEndDateField(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/^(present|current|now|ongoing|till date|to date)$/i.test(s)) return null;
  return s;
}

const MONTH_TO_NUM: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

function monthToNum(month: string): string {
  return MONTH_TO_NUM[month.toLowerCase()] ?? "01";
}

function parseLooseDateToken(token: string): string | null {
  const t = token.trim();
  if (!t) return null;
  if (/^(present|current|now|ongoing|till date|to date)$/i.test(t)) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;

  const yearMonth = t.match(/^(\d{4})\s+([A-Za-z]+)$/);
  if (yearMonth) {
    return `${yearMonth[1]}-${monthToNum(yearMonth[2])}-01`;
  }

  const monthYear = t.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    return `${monthYear[2]}-${monthToNum(monthYear[1])}-01`;
  }

  const yearOnly = t.match(/^(\d{4})$/);
  if (yearOnly) return `${yearOnly[1]}-01-01`;

  return null;
}

function parseLooseDateRange(
  value: unknown
): { startDate: string | null; endDate: string | null } {
  if (value == null) return { startDate: null, endDate: null };
  const s = String(value).trim();
  if (!s) return { startDate: null, endDate: null };

  const parts = s.split(/\s+(?:to|–|—|-|till|until)\s+/i);
  if (parts.length >= 2) {
    const endPart = parts[parts.length - 1].trim();
    return {
      startDate: parseLooseDateToken(parts[0]),
      endDate: /^(present|current|now|ongoing|till date|to date)$/i.test(endPart)
        ? null
        : parseLooseDateToken(endPart),
    };
  }

  return { startDate: parseLooseDateToken(s), endDate: null };
}

function inferFallbackRole(headline: string, summary: string): string {
  const h = headline.trim();
  if (h) return h;

  const firstLine =
    summary
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? "";

  const withYears = firstLine.match(/^(.+?)\s+with\s+\d/i);
  if (withYears?.[1]) {
    const phrase = withYears[1].trim();
    if (phrase.length <= 80) return phrase;
  }

  if (firstLine.length > 0 && firstLine.length <= 80) return firstLine;

  return "Professional";
}

function inferFallbackCompany(role: string): string {
  const lower = role.toLowerCase();
  if (/\b(freelance|contract|consultant|self[- ]?employed)\b/.test(lower)) {
    return "Independent";
  }
  return "Organization not listed";
}

function isWorkExperienceSection(section: {
  sectionType: string;
  label: string;
}): boolean {
  const key = `${section.sectionType} ${section.label}`.toLowerCase();
  return /\b(work|experience|employment|career|position|professional)\b/.test(key);
}

function isEducationSection(section: { sectionType: string; label: string }): boolean {
  const key = `${section.sectionType} ${section.label}`.toLowerCase();
  return /\b(education|academic|qualification|schooling|degree)\b/.test(key);
}

function isSkillsSection(section: { sectionType: string; label: string }): boolean {
  const key = `${section.sectionType} ${section.label}`.toLowerCase();
  return /\b(skill|competenc|expertise|proficien|technical|tool)\b/.test(key);
}

function isCertificationSection(section: {
  sectionType: string;
  label: string;
}): boolean {
  const key = `${section.sectionType} ${section.label}`.toLowerCase();
  return /\b(certif|licen[cs]e|credential|accredit)/.test(key);
}

function isProjectSection(section: { sectionType: string; label: string }): boolean {
  const key = `${section.sectionType} ${section.label}`.toLowerCase();
  return /\b(project|portfolio|case stud)/.test(key);
}

function experienceDedupeKey(company: string, role: string): string {
  return `${company.trim().toLowerCase()}|${role.trim().toLowerCase()}`;
}

function collectSkillsFromUnknown(value: unknown, category = "General"): ParsedResume["skills"] {
  if (value == null) return [];

  if (typeof value === "string") {
    return value
      .split(/[,;|]|\n+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((name) => ({ name, category }));
  }

  if (Array.isArray(value)) {
    const out: ParsedResume["skills"] = [];
    for (const item of value) {
      out.push(...collectSkillsFromUnknown(item, category));
    }
    return out;
  }

  const record = asRecord(value);
  if (!record) return [];

  const name = normalizeString(record.name ?? record.skill ?? record.title);
  if (name) {
    return [
      {
        name,
        category:
          normalizeString(record.category ?? record.group ?? category) || "General",
      },
    ];
  }

  const nestedCategory = normalizeString(record.category ?? record.group);
  const nestedItems =
    record.items ?? record.skills ?? record.values ?? record.list ?? record.entries;
  if (nestedItems != null) {
    return collectSkillsFromUnknown(
      nestedItems,
      nestedCategory || category
    );
  }

  return [];
}

function resolveSkillsRaw(o: Record<string, unknown>): unknown[] {
  const direct = o.skills ?? o.skill ?? o.coreCompetencies ?? o.competencies;
  if (Array.isArray(direct)) return direct;

  if (typeof direct === "string") {
    return collectSkillsFromUnknown(direct);
  }

  const grouped = asRecord(direct);
  if (grouped) {
    const out: ParsedResume["skills"] = [];
    for (const [category, items] of Object.entries(grouped)) {
      out.push(...collectSkillsFromUnknown(items, category));
    }
    if (out.length > 0) return out;
  }

  const altKeys = [
    "technicalSkills",
    "technical_skills",
    "tools",
    "technologies",
    "expertise",
  ];
  for (const key of altKeys) {
    const alt = o[key];
    if (alt != null) return collectSkillsFromUnknown(alt);
  }

  return [];
}

/**
 * Coerce model output into ParsedResume: alternate keys, null descriptions,
 * and non-array sections from AI output are common reasons imports silently fail validation.
 */
export function normalizeParsedResume(raw: unknown): ParsedResume {
  const o = asRecord(raw);
  if (!o) {
    return {
      name: "",
      headline: "",
      summary: "",
      contact: { email: null, phone: null, websiteUrl: null, location: null },
      socialProfiles: [],
      customSections: [],
      experiences: [],
      education: [],
      skills: [],
      projects: [],
      achievements: [],
      certifications: [],
    };
  }

  let experienceRaw: unknown[] = Array.isArray(o.experiences)
    ? o.experiences
    : [];
  if (experienceRaw.length === 0) {
    const alt =
      o.workExperience ??
      o.work_experience ??
      o.employment ??
      o.jobs ??
      o.jobHistory;
    if (Array.isArray(alt)) experienceRaw = alt;
  }

  const experiences: ParsedResume["experiences"] = [];
  const headline = normalizeString(
    o.headline ?? o.title ?? o.jobTitle ?? o.targetRole ?? o.currentRole
  );
  const summary = normalizeString(o.summary ?? o.profile ?? o.objective ?? o.about);
  const roleFallback = { headline, summary };

  for (const item of experienceRaw) {
    const e = asRecord(item) ?? {};
    let company = normalizeString(
      e.company ?? e.employer ?? e.organization ?? e.org ?? e.client
    );
    let role = normalizeString(
      e.role ?? e.title ?? e.position ?? e.jobTitle ?? e.job_title ?? e.designation
    );
    const startDate = normalizeString(e.startDate ?? e.start ?? e.from).trim();

    if (!company && !role) continue;
    if (!company) company = inferFallbackCompany(role);
    if (!role.trim()) {
      role = inferFallbackRole(roleFallback.headline, roleFallback.summary);
    }

    experiences.push({
      company,
      role,
      description: normalizeDescription(
        e.description ?? e.summary ?? e.highlights ?? e.responsibilities ?? e.details
      ),
      startDate: startDate || null,
      endDate: normalizeEndDateField(e.endDate ?? e.end ?? e.to),
      location:
        e.location == null || String(e.location).trim() === ""
          ? null
          : normalizeString(e.location),
    });
  }

  let educationRaw: unknown[] = Array.isArray(o.education) ? o.education : [];
  if (educationRaw.length === 0) {
    const alt = o.educations ?? o.academic ?? o.academics;
    if (Array.isArray(alt)) educationRaw = alt;
  }

  const education: ParsedResume["education"] = [];
  for (const item of educationRaw) {
    const e = asRecord(item) ?? {};
    const institution = normalizeString(
      e.institution ?? e.school ?? e.university ?? e.college ?? e.academy
    );
    const degree = normalizeString(
      e.degree ?? e.qualification ?? e.program ?? e.credential ?? e.level
    );
    const field = normalizeString(
      e.field ?? e.major ?? e.specialization ?? e.concentration ?? e.stream
    );
    const startDate = normalizeString(e.startDate ?? e.start ?? e.from).trim();

    if (!institution && !degree && !field) continue;

    education.push({
      institution: institution || degree || field,
      degree: degree || field || "Program",
      field: field && field !== degree ? field : null,
      startDate: startDate || null,
      endDate: normalizeEndDateField(e.endDate ?? e.end ?? e.to),
      gpa:
        e.gpa == null || String(e.gpa).trim() === ""
          ? null
          : normalizeString(e.gpa ?? e.grade ?? e.percentage ?? e.score),
    });
  }

  const skillsFromRaw = resolveSkillsRaw(o);
  const skills: ParsedResume["skills"] = skillsFromRaw
    .flatMap((item) => collectSkillsFromUnknown(item))
    .filter((s) => s.name.trim() !== "");

  const seenSkillNames = new Set<string>();
  const dedupedSkills = skills.filter((skill) => {
    const key = skill.name.trim().toLowerCase();
    if (seenSkillNames.has(key)) return false;
    seenSkillNames.add(key);
    return true;
  });

  const projectsRaw: unknown[] = Array.isArray(o.projects) ? o.projects : [];
  const projects: ParsedResume["projects"] = [];
  for (const item of projectsRaw) {
    const p = asRecord(item) ?? {};
    const title = normalizeString(p.title ?? p.name);
    if (!title) continue;
    let tech: unknown = p.techStack ?? p.tech_stack ?? p.technologies;
    if (!Array.isArray(tech)) tech = [];
    projects.push({
      title,
      description: normalizeDescription(p.description),
      techStack: (tech as unknown[]).map((x) => String(x)),
      liveUrl:
        p.liveUrl == null || String(p.liveUrl).trim() === ""
          ? null
          : normalizeString(p.liveUrl),
      sourceUrl:
        p.sourceUrl == null || String(p.sourceUrl).trim() === ""
          ? null
          : normalizeString(p.sourceUrl),
    });
  }

  const achievementsRaw: unknown = o.achievements ?? o.accomplishments ?? o.awards;
  let achievements: string[] = [];
  if (Array.isArray(achievementsRaw)) {
    achievements = achievementsRaw
      .map((item) => {
        if (typeof item === "string") return stripBulletPrefix(item);
        const a = asRecord(item);
        if (a) {
          return stripBulletPrefix(
            normalizeString(
              a.title ?? a.name ?? a.description ?? a.achievement
            )
          );
        }
        return stripBulletPrefix(String(item));
      })
      .filter((text) => text.trim() !== "");
  } else if (typeof achievementsRaw === "string") {
    achievements = achievementsRaw
      .split(/\n+/)
      .map(stripBulletPrefix)
      .filter(Boolean);
  }

  let certRaw: unknown[] = Array.isArray(o.certifications)
    ? o.certifications
    : [];
  if (certRaw.length === 0) {
    const alt = o.certification ?? o.certs;
    if (Array.isArray(alt)) certRaw = alt;
  }
  const certifications: ParsedResume["certifications"] = [];
  for (const item of certRaw) {
    const c = asRecord(item) ?? {};
    const name = normalizeString(c.name ?? c.title);
    if (!name) continue;
    certifications.push({
      name,
      issuer: normalizeString(c.issuer ?? c.organization ?? c.org ?? ""),
      issueDate:
        c.issueDate == null || String(c.issueDate).trim() === ""
          ? null
          : normalizeString(c.issueDate),
      url:
        c.url == null || String(c.url).trim() === "" ? null : normalizeString(c.url),
    });
  }

  // Normalize custom sections; promote recognizable sections into typed portfolio fields.
  const customSectionsRaw: unknown[] = Array.isArray(o.customSections)
    ? o.customSections
    : [];
  const customSections: ParsedCustomSection[] = [];
  const seenExperienceKeys = new Set(
    experiences.map((exp) => experienceDedupeKey(exp.company, exp.role))
  );
  const seenEducationKeys = new Set(
    education.map((edu) =>
      `${edu.institution.trim().toLowerCase()}|${edu.degree.trim().toLowerCase()}`
    )
  );
  const seenCertNames = new Set(
    certifications.map((cert) => cert.name.trim().toLowerCase())
  );
  const seenProjectTitles = new Set(
    projects.map((project) => project.title.trim().toLowerCase())
  );

  for (const item of customSectionsRaw) {
    const s = asRecord(item);
    if (!s) continue;
    const sectionType = normalizeString(s.sectionType ?? s.section_type ?? s.type);
    const label = normalizeString(s.label ?? s.title ?? s.name);
    if (!sectionType || !label) continue;

    const rawItems = Array.isArray(s.items) ? s.items : [];
    const items: Record<string, unknown>[] = [];
    for (const entry of rawItems) {
      if (typeof entry === "string") {
        items.push({ title: entry });
      } else {
        const rec = asRecord(entry);
        if (rec) items.push(rec as Record<string, unknown>);
      }
    }

    if (items.length === 0) continue;

    const sectionMeta = { sectionType, label };

    if (isWorkExperienceSection(sectionMeta)) {
      for (const entry of items) {
        let company = normalizeString(
          entry.company ?? entry.employer ?? entry.organization ?? entry.title ?? entry.name
        );
        let role = normalizeString(
          entry.role ?? entry.position ?? entry.jobTitle ?? entry.job_title ?? entry.designation
        );
        if (!company && !role) continue;
        if (!company) company = inferFallbackCompany(role);
        if (!role.trim()) {
          role = inferFallbackRole(roleFallback.headline, roleFallback.summary);
        }

        const dedupeKey = experienceDedupeKey(company, role);
        if (seenExperienceKeys.has(dedupeKey)) continue;

        const { startDate, endDate } = parseLooseDateRange(
          entry.date ?? entry.dates ?? entry.period ?? entry.duration ?? entry.tenure
        );

        experiences.push({
          company,
          role,
          description: normalizeDescription(
            entry.description ?? entry.summary ?? entry.details ?? entry.highlights
          ),
          startDate:
            startDate ??
            (normalizeString(entry.startDate ?? entry.start ?? entry.from).trim() || null),
          endDate:
            normalizeEndDateField(entry.endDate ?? entry.end ?? entry.to) ?? endDate,
          location:
            entry.location == null || String(entry.location).trim() === ""
              ? null
              : normalizeString(entry.location),
        });
        seenExperienceKeys.add(dedupeKey);
      }
      continue;
    }

    if (isEducationSection(sectionMeta)) {
      for (const entry of items) {
        const institution = normalizeString(
          entry.institution ?? entry.school ?? entry.university ?? entry.title ?? entry.name
        );
        const degree = normalizeString(
          entry.degree ?? entry.qualification ?? entry.program ?? entry.credential
        );
        const field = normalizeString(
          entry.field ?? entry.major ?? entry.specialization ?? entry.stream
        );
        if (!institution && !degree && !field) continue;

        const eduKey = `${(institution || degree || field).toLowerCase()}|${(degree || field || "program").toLowerCase()}`;
        if (seenEducationKeys.has(eduKey)) continue;

        const { startDate, endDate } = parseLooseDateRange(
          entry.date ?? entry.dates ?? entry.period ?? entry.year
        );

        education.push({
          institution: institution || degree || field,
          degree: degree || field || "Program",
          field: field || null,
          startDate:
            startDate ??
            (normalizeString(entry.startDate ?? entry.start ?? entry.from).trim() || null),
          endDate:
            normalizeEndDateField(entry.endDate ?? entry.end ?? entry.to) ?? endDate,
          gpa:
            entry.gpa == null || String(entry.gpa).trim() === ""
              ? null
              : normalizeString(entry.gpa ?? entry.grade ?? entry.percentage),
        });
        seenEducationKeys.add(eduKey);
      }
      continue;
    }

    if (isSkillsSection(sectionMeta)) {
      for (const entry of items) {
        const parsedSkills = collectSkillsFromUnknown(entry, label);
        for (const skill of parsedSkills) {
          const key = skill.name.trim().toLowerCase();
          if (!key || seenSkillNames.has(key)) continue;
          seenSkillNames.add(key);
          dedupedSkills.push(skill);
        }
      }
      continue;
    }

    if (isCertificationSection(sectionMeta)) {
      for (const entry of items) {
        const name = normalizeString(entry.name ?? entry.title ?? entry.certification);
        if (!name) continue;
        const key = name.toLowerCase();
        if (seenCertNames.has(key)) continue;
        certifications.push({
          name,
          issuer: normalizeString(entry.issuer ?? entry.organization ?? entry.org ?? ""),
          issueDate:
            entry.issueDate == null || String(entry.issueDate).trim() === ""
              ? null
              : normalizeString(entry.issueDate ?? entry.date ?? entry.year),
          url:
            entry.url == null || String(entry.url).trim() === ""
              ? null
              : normalizeString(entry.url),
        });
        seenCertNames.add(key);
      }
      continue;
    }

    if (isProjectSection(sectionMeta)) {
      for (const entry of items) {
        const title = normalizeString(entry.title ?? entry.name ?? entry.project);
        if (!title) continue;
        const key = title.toLowerCase();
        if (seenProjectTitles.has(key)) continue;
        let tech: unknown = entry.techStack ?? entry.tech_stack ?? entry.technologies;
        if (!Array.isArray(tech)) tech = [];
        projects.push({
          title,
          description: normalizeDescription(entry.description ?? entry.summary ?? entry.details),
          techStack: (tech as unknown[]).map((x) => String(x)),
          liveUrl:
            entry.liveUrl == null || String(entry.liveUrl).trim() === ""
              ? null
              : normalizeString(entry.liveUrl ?? entry.url),
          sourceUrl:
            entry.sourceUrl == null || String(entry.sourceUrl).trim() === ""
              ? null
              : normalizeString(entry.sourceUrl ?? entry.repo),
        });
        seenProjectTitles.add(key);
      }
      continue;
    }

    customSections.push({ sectionType, label, items });
  }

  function emptyToNull(v: unknown): string | null {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s || /^unknown$/i.test(s)) return null;
    return s;
  }

  const contactRaw = asRecord(o.contact) ?? {};
  const contact: ParsedResume["contact"] = {
    email: emptyToNull(contactRaw.email ?? o.email),
    phone: emptyToNull(contactRaw.phone ?? o.phone ?? o.mobile),
    websiteUrl: emptyToNull(
      contactRaw.websiteUrl ?? contactRaw.website ?? contactRaw.url ?? o.website ?? o.websiteUrl
    ),
    location: emptyToNull(
      contactRaw.location ?? contactRaw.address ?? contactRaw.city ?? o.location ?? o.address
    ),
  };

  const socialRaw: unknown[] = Array.isArray(o.socialProfiles)
    ? o.socialProfiles
    : Array.isArray(o.social_profiles)
      ? o.social_profiles
      : Array.isArray(o.socials)
        ? o.socials
        : [];
  const socialProfiles: ParsedResume["socialProfiles"] = [];
  for (const item of socialRaw) {
    const s = asRecord(item) ?? {};
    const platform = normalizeString(s.platform ?? s.network ?? "unknown").toLowerCase().trim();
    const url = emptyToNull(s.url ?? s.link);
    const username = emptyToNull(s.username ?? s.handle ?? s.user);
    if (!url && !username) continue;
    socialProfiles.push({ platform: platform || "unknown", url, username });
  }

  const resolvedSocialProfiles = normalizeSocialProfiles(socialProfiles);

  const sectionLabelsRaw = asRecord(o.sectionLabels) ?? asRecord(o.section_labels);
  const sectionLabels: ParsedResume["sectionLabels"] = {};
  if (sectionLabelsRaw) {
    for (const [key, value] of Object.entries(sectionLabelsRaw)) {
      if (typeof value === "string" && value.trim()) {
        sectionLabels[key as SectionKey] = value.trim();
      }
    }
  }

  return {
    name: normalizeString(o.name ?? o.fullName ?? o.full_name ?? o.candidateName),
    headline,
    summary,
    contact,
    socialProfiles: resolvedSocialProfiles,
    experiences,
    education,
    skills: dedupedSkills,
    projects,
    achievements,
    certifications,
    customSections,
    ...(Object.keys(sectionLabels).length > 0 ? { sectionLabels } : {}),
  };
}

export async function structureResumeWithAi(
  rawText: string,
  options?: {
    quality?: PdfExtractionQuality;
    signal?: AbortSignal;
  },
): Promise<ParsedResume> {
  const text = await generateOpenRouterResumeText(
    buildResumeUserMessage(rawText, options?.quality),
    RESUME_PARSER_SYSTEM,
    { signal: options?.signal },
  );

  // Strip potential markdown code fences
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  const jsonCandidate =
    cleaned.match(/\{[\s\S]*\}/)?.[0]?.trim() ?? cleaned;

  if (!jsonCandidate) {
    throw new Error("OpenRouter response did not contain JSON");
  }

  try {
    const parsed: unknown = JSON.parse(jsonCandidate);
    return normalizeParsedResume(parsed);
  } catch {
    const preview =
      jsonCandidate.length > 300
        ? `${jsonCandidate.slice(0, 300)}...`
        : jsonCandidate;

    throw new Error(`Failed to parse OpenRouter response as JSON: ${preview}`);
  }
}
