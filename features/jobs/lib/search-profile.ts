export const ROLE_FAMILIES = [
  "engineering",
  "design",
  "marketing",
  "sales",
  "product",
  "ops",
  "writing",
  "general",
] as const;

export type RoleFamily = (typeof ROLE_FAMILIES)[number];

export const SENIORITY_LEVELS = [
  "intern",
  "junior",
  "mid",
  "senior",
  "staff",
  "unknown",
] as const;

export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];

export type IntegrationGates = {
  github: boolean;
  leetcode: boolean;
  medium: boolean;
  liveUrl: boolean;
};

export type JobSearchProfile = {
  version: 1;
  extractedAt: string;
  sourceHash: string;
  roleFamily: RoleFamily;
  confidence: number;
  seniority: SeniorityLevel;
  minYears: number | null;
  location: string | null;
  workplaceType: string | null;
  education: string | null;
  mustHaves: string[];
  niceToHaves: string[];
  domains: string[];
  responsibilities: string[];
  digest: string;
  gates: IntegrationGates;
};

export type JobJdInput = {
  title: string;
  description: string;
  responsibilities?: string | null;
  qualifications?: string | null;
  location?: string | null;
  experienceMin?: number | null;
  department?: string | null;
};

const ENGINEERING_HINTS =
  /\b(software|engineer|developer|swe|backend|frontend|full[- ]?stack|platform|infra|sre|devops|mobile|android|ios|ml|machine learning|data engineer|security engineer)\b/i;
const DESIGN_HINTS = /\b(design(?:er)?|ux|ui|product design|figma)\b/i;
const MARKETING_HINTS = /\b(marketing|growth marketer|brand|seo|demand gen)\b/i;
const SALES_HINTS = /\b(sales|account executive|ae\b|sdr|bdr)\b/i;
const PRODUCT_HINTS = /\b(product manager|pm\b|product owner)\b/i;
const WRITING_HINTS = /\b(devrel|developer advocate|technical writer|content|copywriter)\b/i;
const OPS_HINTS = /\b(operations|hr\b|recruiter|people ops|office manager)\b/i;

function isRoleFamily(value: unknown): value is RoleFamily {
  return (
    typeof value === "string" &&
    (ROLE_FAMILIES as readonly string[]).includes(value)
  );
}

function isSeniority(value: unknown): value is SeniorityLevel {
  return (
    typeof value === "string" &&
    (SENIORITY_LEVELS as readonly string[]).includes(value)
  );
}

function clipList(value: unknown, max = 16): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim().slice(0, 80);
    if (trimmed.length < 2) continue;
    if (out.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      continue;
    }
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

function clipText(value: unknown, max = 400): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function clipNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.trunc(value);
  if (n < 0 || n > 40) return null;
  return n;
}

export function detectRoleFamily(text: string): {
  roleFamily: RoleFamily;
  confidence: number;
} {
  if (ENGINEERING_HINTS.test(text)) return { roleFamily: "engineering", confidence: 0.75 };
  if (DESIGN_HINTS.test(text)) return { roleFamily: "design", confidence: 0.7 };
  if (WRITING_HINTS.test(text)) return { roleFamily: "writing", confidence: 0.7 };
  if (MARKETING_HINTS.test(text)) return { roleFamily: "marketing", confidence: 0.7 };
  if (SALES_HINTS.test(text)) return { roleFamily: "sales", confidence: 0.7 };
  if (PRODUCT_HINTS.test(text)) return { roleFamily: "product", confidence: 0.65 };
  if (OPS_HINTS.test(text)) return { roleFamily: "ops", confidence: 0.65 };
  return { roleFamily: "general", confidence: 0.4 };
}

export function gatesForRole(
  roleFamily: RoleFamily,
  confidence: number,
): IntegrationGates {
  const coding = roleFamily === "engineering" && confidence >= 0.6;
  return {
    github: coding,
    leetcode: coding,
    medium: roleFamily === "writing" && confidence >= 0.6,
    liveUrl: coding || roleFamily === "design",
  };
}

export function jobJdSource(job: JobJdInput): string {
  return [
    job.title,
    job.department ?? "",
    job.location ?? "",
    job.experienceMin != null ? `${job.experienceMin} years` : "",
    job.description,
    job.responsibilities ?? "",
    job.qualifications ?? "",
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

export function emptySearchProfile(
  sourceHash: string,
  overrides: Partial<JobSearchProfile> = {},
): JobSearchProfile {
  return {
    version: 1,
    extractedAt: new Date().toISOString(),
    sourceHash,
    roleFamily: "general",
    confidence: 0.4,
    seniority: "unknown",
    minYears: null,
    location: null,
    workplaceType: null,
    education: null,
    mustHaves: [],
    niceToHaves: [],
    domains: [],
    responsibilities: [],
    digest: "",
    gates: gatesForRole("general", 0.4),
    ...overrides,
  };
}

export function heuristicSearchProfile(
  job: JobJdInput,
  sourceHash: string,
): JobSearchProfile {
  const source = jobJdSource(job);
  const { roleFamily, confidence } = detectRoleFamily(
    `${job.title}\n${job.description}`,
  );
  return emptySearchProfile(sourceHash, {
    roleFamily,
    confidence,
    minYears: job.experienceMin ?? null,
    location: job.location?.trim() || null,
    digest: source.slice(0, 400),
    gates: gatesForRole(roleFamily, confidence),
  });
}

export function parseJobSearchProfile(value: unknown): JobSearchProfile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1) return null;
  if (typeof raw.sourceHash !== "string" || !raw.sourceHash) return null;
  const roleFamily = isRoleFamily(raw.roleFamily) ? raw.roleFamily : "general";
  const confidence =
    typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
      ? Math.min(1, Math.max(0, raw.confidence))
      : 0.4;
  const gatesRaw =
    raw.gates && typeof raw.gates === "object"
      ? (raw.gates as Record<string, unknown>)
      : {};
  const parsedGates: IntegrationGates = {
    github: gatesRaw.github === true,
    leetcode: gatesRaw.leetcode === true,
    medium: gatesRaw.medium === true,
    liveUrl: gatesRaw.liveUrl === true,
  };
  const gated = gatesForRole(roleFamily, confidence);
  return {
    version: 1,
    extractedAt:
      typeof raw.extractedAt === "string"
        ? raw.extractedAt
        : new Date().toISOString(),
    sourceHash: raw.sourceHash,
    roleFamily,
    confidence,
    seniority: isSeniority(raw.seniority) ? raw.seniority : "unknown",
    minYears: clipNumber(raw.minYears),
    location: clipText(raw.location, 120) || null,
    workplaceType: clipText(raw.workplaceType, 40) || null,
    education: clipText(raw.education, 120) || null,
    mustHaves: clipList(raw.mustHaves),
    niceToHaves: clipList(raw.niceToHaves),
    domains: clipList(raw.domains, 8),
    responsibilities: clipList(raw.responsibilities, 12),
    digest: clipText(raw.digest, 500),
    gates: {
      github: parsedGates.github && gated.github,
      leetcode: parsedGates.leetcode && gated.leetcode,
      medium: parsedGates.medium && gated.medium,
      liveUrl: parsedGates.liveUrl || gated.liveUrl,
    },
  };
}

export function sanitizeExtractedProfile(
  value: unknown,
  sourceHash: string,
  job: JobJdInput,
): JobSearchProfile {
  const parsed = parseJobSearchProfile(
    value && typeof value === "object"
      ? { ...(value as object), version: 1, sourceHash }
      : null,
  );
  const fallback = heuristicSearchProfile(job, sourceHash);
  if (!parsed) return fallback;

  const roleFamily = parsed.roleFamily;
  const confidence = parsed.confidence;
  const gates = gatesForRole(roleFamily, confidence);
  return {
    ...parsed,
    sourceHash,
    extractedAt: new Date().toISOString(),
    minYears: parsed.minYears ?? job.experienceMin ?? null,
    location: parsed.location || job.location?.trim() || null,
    digest: parsed.digest || fallback.digest,
    gates: {
      github: (parsed.gates.github || gates.github) && gates.github,
      leetcode: (parsed.gates.leetcode || gates.leetcode) && gates.leetcode,
      medium: (parsed.gates.medium || gates.medium) && gates.medium,
      liveUrl: parsed.gates.liveUrl || gates.liveUrl,
    },
  };
}