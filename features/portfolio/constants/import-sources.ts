import { FileText, Trophy, type LucideIcon } from "lucide-react";
import { GithubIcon as Github, MediumIcon as Medium } from "@/components/icons";

export const IMPORT_SOURCES = [
  {
    value: "resume",
    label: "Resume",
    short: "PDF",
    icon: FileText,
    description: "Upload a PDF resume to auto-fill experience, education, skills, and more.",
  },
  {
    value: "github",
    label: "GitHub",
    short: "GH",
    icon: Github as LucideIcon,
    description: "Fetch repositories and import them as portfolio projects.",
  },
  {
    value: "medium",
    label: "Medium",
    short: "MD",
    icon: Medium as LucideIcon,
    description: "Pull published articles and showcase your writing.",
  },
  {
    value: "leetcode",
    label: "LeetCode",
    short: "LC",
    icon: Trophy,
    description: "Sync coding stats and problem-solving progress.",
  },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  short: string;
  icon: LucideIcon;
  description: string;
}>;

export type ImportSourceValue = (typeof IMPORT_SOURCES)[number]["value"];
