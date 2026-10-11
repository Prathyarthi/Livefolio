export const JOB_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  paused: "Paused",
  closed: "Closed",
};

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const WORKPLACE_TYPE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  on_site: "On-site",
};

export const SENIORITY_LABELS: Record<string, string> = {
  intern: "Intern",
  entry: "Entry level",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  staff: "Staff",
  lead: "Lead",
  principal: "Principal",
  director: "Director",
  executive: "Executive",
};

export const EDUCATION_LABELS: Record<string, string> = {
  none: "No degree required",
  high_school: "High school",
  associate: "Associate degree",
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  phd: "PhD",
};

export const SALARY_PERIOD_LABELS: Record<string, string> = {
  year: "year",
  month: "month",
  hour: "hour",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  type PipelineStage,
} from "@/features/applications/lib/pipeline";

export function formatJobMeta(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

export function formatSalaryRange(options: {
  min: number | null | undefined;
  max: number | null | undefined;
  currency?: string | null;
}): string | null {
  const { min, max } = options;
  if (min == null && max == null) return null;
  const currency = (options.currency || "USD").toUpperCase();
  const format = (value: number) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${currency} ${value.toLocaleString("en-US")}`;
    }
  };
  if (min != null && max != null) return `${format(min)} – ${format(max)}`;
  if (min != null) return `From ${format(min)}`;
  return `Up to ${format(max!)}`;
}

export function formatExperienceRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min}–${max} years`;
  if (min != null) return `${min}+ years`;
  return `Up to ${max} years`;
}

export function formatOpenings(openings: number | null | undefined): string | null {
  if (openings == null || openings < 1) return null;
  return openings === 1 ? "1 opening" : `${openings} openings`;
}

export function formatDeadline(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function splitRichLines(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s+/, "").trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : [];
}
