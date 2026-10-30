import type { EditStepValue } from "@/features/portfolio/constants/edit-steps";

type PortfolioLike = {
  title?: string | null;
  slug?: string | null;
  isPublished?: boolean | null;
  experiences?: unknown[] | null;
  educations?: unknown[] | null;
  skills?: unknown[] | null;
  projects?: unknown[] | null;
  achievements?: unknown[] | null;
  customSections?: unknown[] | null;
  socialProfiles?: unknown[] | null;
} | null | undefined;

export function isEditStepComplete(
  step: EditStepValue,
  portfolio: PortfolioLike
): boolean {
  if (!portfolio) return false;

  switch (step) {
    case "basic":
      return Boolean(portfolio.title?.trim());
    case "experience":
      return (portfolio.experiences?.length ?? 0) > 0;
    case "education":
      return (portfolio.educations?.length ?? 0) > 0;
    case "skills":
      return (portfolio.skills?.length ?? 0) > 0;
    case "projects":
      return (portfolio.projects?.length ?? 0) > 0;
    case "achievements":
      return (portfolio.achievements?.length ?? 0) > 0;
    case "custom":
      return (portfolio.customSections?.length ?? 0) > 0;
    case "social":
      return (portfolio.socialProfiles?.length ?? 0) > 0;
    case "references":
      return false;
    case "publish":
      return Boolean(portfolio.isPublished);
    default:
      return false;
  }
}

export function countCompletedEditSteps(portfolio: PortfolioLike): number {
  const steps: EditStepValue[] = [
    "basic",
    "experience",
    "education",
    "skills",
    "projects",
    "achievements",
    "custom",
    "social",
    "publish",
  ];
  return steps.filter((step) => isEditStepComplete(step, portfolio)).length;
}
