import type { Job, JobInput, JobRequirement } from "@/features/jobs/api/use-jobs";

export const SENIORITY_OPTIONS = [
  "intern",
  "entry",
  "junior",
  "mid",
  "senior",
  "staff",
  "lead",
  "principal",
  "director",
  "executive",
] as const;

export const SALARY_PERIOD_OPTIONS = ["year", "month", "hour"] as const;

export const EDUCATION_OPTIONS = [
  "none",
  "high_school",
  "associate",
  "bachelor",
  "master",
  "phd",
] as const;

export const CURRENCY_OPTIONS = [
  "USD",
  "INR",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "SGD",
  "JPY",
] as const;

export type RequirementDraft = JobRequirement & { key: string };

export type CustomFieldDraft = {
  id: string;
  label: string;
  value: string;
};

export type JobRoleFormState = {
  title: string;
  description: string;
  department: string;
  location: string;
  employmentType: string;
  workplaceType: string;
  experienceMin: string;
  experienceMax: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  applicationDeadline: string;
  responsibilities: string;
  qualifications: string;
  benefits: string;
  customFields: CustomFieldDraft[];
  requirements: RequirementDraft[];
};

export function emptyRequirement(
  type: "required" | "preferred" = "required",
): RequirementDraft {
  return {
    key: crypto.randomUUID(),
    type,
    category: "skill",
    label: "",
  };
}

export function emptyJobRoleForm(): JobRoleFormState {
  return {
    title: "",
    description: "",
    department: "",
    location: "",
    employmentType: "full_time",
    workplaceType: "hybrid",
    experienceMin: "",
    experienceMax: "",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    applicationDeadline: "",
    responsibilities: "",
    qualifications: "",
    benefits: "",
    customFields: [],
    requirements: [emptyRequirement("required")],
  };
}

export function jobToFormState(job: Job): JobRoleFormState {
  return {
    title: job.title,
    description: job.description,
    department: job.department ?? "",
    location: job.location ?? "",
    employmentType: job.employmentType ?? "full_time",
    workplaceType: job.workplaceType ?? "hybrid",
    experienceMin: job.experienceMin != null ? String(job.experienceMin) : "",
    experienceMax: job.experienceMax != null ? String(job.experienceMax) : "",
    salaryMin: job.salaryMin != null ? String(job.salaryMin) : "",
    salaryMax: job.salaryMax != null ? String(job.salaryMax) : "",
    salaryCurrency: job.salaryCurrency || "USD",
    applicationDeadline: job.applicationDeadline
      ? job.applicationDeadline.slice(0, 10)
      : "",
    responsibilities: job.responsibilities ?? "",
    qualifications: job.qualifications ?? "",
    benefits: job.benefits ?? "",
    customFields: Array.isArray(job.customFields)
      ? (job.customFields as CustomFieldDraft[])
      : [],
    requirements:
      job.requirements.length > 0
        ? job.requirements.map((req) => ({
            key: req.id ?? crypto.randomUUID(),
            ...req,
          }))
        : [emptyRequirement("required")],
  };
}

function trimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalInt(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function formStateToPreviewJob(
  form: JobRoleFormState,
  organization: Job["organization"],
  extras?: Partial<Pick<Job, "id" | "slug" | "status" | "workspaceId" | "createdAt" | "updatedAt" | "publishedAt">>,
): Job {
  const now = extras?.createdAt ?? new Date().toISOString();
  return {
    id: extras?.id ?? "preview",
    organizationId: organization.id,
    workspaceId: extras?.workspaceId ?? "preview",
    title: form.title.trim() || "Untitled role",
    slug: extras?.slug ?? "preview",
    description: form.description,
    department: trimOrNull(form.department),
    employmentType: form.employmentType || null,
    location: trimOrNull(form.location),
    workplaceType: form.workplaceType || null,
    experienceMin: parseOptionalInt(form.experienceMin),
    experienceMax: parseOptionalInt(form.experienceMax),
    salaryMin: parseOptionalInt(form.salaryMin),
    salaryMax: parseOptionalInt(form.salaryMax),
    salaryCurrency: form.salaryCurrency || "USD",
    customFields: form.customFields,
    responsibilities: trimOrNull(form.responsibilities),
    qualifications: trimOrNull(form.qualifications),
    benefits: trimOrNull(form.benefits),
    applicationDeadline: form.applicationDeadline || null,
    status: extras?.status ?? "published",
    publishedAt: extras?.publishedAt ?? now,
    createdAt: now,
    updatedAt: extras?.updatedAt ?? now,
    organization,
    requirements: form.requirements
      .filter((r) => r.label.trim())
      .map((r, index) => ({
        id: r.id ?? r.key,
        type: r.type,
        category: r.category,
        label: r.label.trim(),
        description: r.description ?? null,
        sortOrder: index,
      })),
  };
}

export function formStateToJobInput(state: JobRoleFormState): JobInput {
  return {
    title: state.title.trim(),
    description: state.description.trim(),
    department: trimOrNull(state.department),
    location: trimOrNull(state.location),
    employmentType: state.employmentType || null,
    workplaceType: state.workplaceType || null,
    experienceMin: parseOptionalInt(state.experienceMin),
    experienceMax: parseOptionalInt(state.experienceMax),
    salaryMin: parseOptionalInt(state.salaryMin),
    salaryMax: parseOptionalInt(state.salaryMax),
    salaryCurrency: state.salaryCurrency || "USD",
    applicationDeadline: state.applicationDeadline || null,
    responsibilities: trimOrNull(state.responsibilities),
    qualifications: trimOrNull(state.qualifications),
    benefits: trimOrNull(state.benefits),
    customFields: state.customFields.filter((f) => f.label.trim() && f.value.trim()),
    requirements: state.requirements
      .filter((r) => r.label.trim())
      .map(({ type, category, label, description }, index) => ({
        type,
        category,
        label: label.trim(),
        description: description ?? null,
        sortOrder: index,
      })),
  };
}
