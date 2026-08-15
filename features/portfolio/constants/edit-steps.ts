import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderKanban,
  Globe,
  Trophy,
  Layers,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export const EDIT_STEPS = [
  { value: "basic", label: "Basic Info", short: "Basic", icon: User },
  { value: "experience", label: "Experience", short: "Exp", icon: Briefcase },
  { value: "education", label: "Education", short: "Edu", icon: GraduationCap },
  { value: "skills", label: "Skills", short: "Skills", icon: Wrench },
  { value: "projects", label: "Projects", short: "Projects", icon: FolderKanban },
  { value: "achievements", label: "Achievements", short: "Awards", icon: Trophy },
  { value: "custom", label: "Custom Sections", short: "Custom", icon: Layers },
  { value: "social", label: "Social Links", short: "Social", icon: Globe },
  { value: "publish", label: "Publish", short: "Publish", icon: Rocket },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  short: string;
  icon: LucideIcon;
}>;

export type EditStepValue = (typeof EDIT_STEPS)[number]["value"];

export const EDIT_STEP_DESCRIPTIONS: Record<EditStepValue, string> = {
  basic:
    "Your name, headline, summary, how people can reach you, and whether recruiters can find you.",
  experience: "Roles, companies, and what you accomplished in each job.",
  education: "Degrees, institutions, and relevant academic details.",
  skills: "Technologies and strengths grouped by category.",
  projects: "Featured work with links, tech stack, and descriptions.",
  achievements: "Awards, talks, milestones, and standout moments.",
  custom: "Extra sections for anything that does not fit elsewhere.",
  social: "GitHub, LinkedIn, Medium, LeetCode, and other profiles.",
  publish: "Choose your subdomain, go live, and share your portfolio.",
};
