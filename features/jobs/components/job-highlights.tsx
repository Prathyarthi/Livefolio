import type { ReactNode } from "react";
import {
  Banknote,
  Briefcase,
  CalendarClock,
  GraduationCap,
  MapPin,
  Sparkles,
  Users,
  Building2,
  Info,
} from "lucide-react";
import type { Job } from "@/features/jobs/api/use-jobs";
import type { CustomFieldDraft } from "@/features/jobs/lib/role-fields";
import {
  EDUCATION_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  SENIORITY_LABELS,
  WORKPLACE_TYPE_LABELS,
  formatDeadline,
  formatExperienceRange,
  formatOpenings,
  formatSalaryRange,
} from "@/features/jobs/constants/labels";

type Highlight = {
  icon: ReactNode;
  label: string;
  value: string;
};

function highlightItems(job: Job): Highlight[] {
  const items: Highlight[] = [];
  const salary = formatSalaryRange({
    min: job.salaryMin,
    max: job.salaryMax,
    currency: job.salaryCurrency,
  });
  if (salary) {
    items.push({
      icon: <Banknote className="h-4 w-4" />,
      label: "Compensation",
      value: salary,
    });
  }
  if (job.location) {
    items.push({
      icon: <MapPin className="h-4 w-4" />,
      label: "Location",
      value: job.location,
    });
  }
  if (job.workplaceType) {
    items.push({
      icon: <Building2 className="h-4 w-4" />,
      label: "Workplace",
      value: WORKPLACE_TYPE_LABELS[job.workplaceType] ?? job.workplaceType,
    });
  }
  if (job.employmentType) {
    items.push({
      icon: <Briefcase className="h-4 w-4" />,
      label: "Employment",
      value: EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType,
    });
  }
  const experience = formatExperienceRange(job.experienceMin, job.experienceMax);
  if (experience) {
    items.push({
      icon: <GraduationCap className="h-4 w-4" />,
      label: "Experience",
      value: experience,
    });
  }
  const deadline = formatDeadline(job.applicationDeadline);
  if (deadline) {
    items.push({
      icon: <CalendarClock className="h-4 w-4" />,
      label: "Apply by",
      value: deadline,
    });
  }
  if (job.department) {
    items.push({
      icon: <Building2 className="h-4 w-4" />,
      label: "Department",
      value: job.department,
    });
  }
  if (Array.isArray(job.customFields)) {
    for (const field of job.customFields as CustomFieldDraft[]) {
      if (!field.label?.trim() || !field.value?.trim()) continue;
      items.push({
        icon: <Info className="h-4 w-4" />,
        label: field.label,
        value: field.value,
      });
    }
  }
  return items;
}

export function JobHighlights({ job }: { job: Job }) {
  const items = highlightItems(job);
  if (items.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li
          key={`${item.label}-${item.value}`}
          className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4 shadow-[var(--shadow-card)]"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-brand-light text-brand-primary">
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              {item.label}
            </p>
            <p className="mt-0.5 font-medium text-text-primary">{item.value}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function JobPerkPills({ job }: { job: Job }) {
  const perks: string[] = [];
  if (perks.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {perks.map((perk) => (
        <span
          key={perk}
          className="rounded-full border border-brand-primary/20 bg-brand-light px-3 py-1 text-xs font-medium text-brand-dark"
        >
          {perk}
        </span>
      ))}
    </div>
  );
}
