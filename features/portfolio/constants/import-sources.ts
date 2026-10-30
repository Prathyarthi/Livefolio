import { FileText, Trophy, type LucideIcon } from "lucide-react";
import {
  CodeforcesIcon,
  DevtoIcon,
  GithubIcon as Github,
  HashnodeIcon,
  LinkedinIcon,
  MediumIcon as Medium,
  StackOverflowIcon,
} from "@/components/icons";

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
  {
    value: "devto",
    label: "Dev.to",
    short: "DEV",
    icon: DevtoIcon as LucideIcon,
    description: "Pull articles you have published on Dev.to.",
  },
  {
    value: "hashnode",
    label: "Hashnode",
    short: "HN",
    icon: HashnodeIcon as LucideIcon,
    description: "Pull posts from your Hashnode blog.",
  },
  {
    value: "stackoverflow",
    label: "Stack Overflow",
    short: "SO",
    icon: StackOverflowIcon as LucideIcon,
    description: "Sync reputation and import your top answers.",
  },
  {
    value: "codeforces",
    label: "Codeforces",
    short: "CF",
    icon: CodeforcesIcon as LucideIcon,
    description: "Sync contest rating, rank, and solved problems.",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    short: "IN",
    icon: LinkedinIcon as LucideIcon,
    description: "Pro: fetch profile details and recent posts, then pick what to showcase.",
  },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  short: string;
  icon: LucideIcon;
  description: string;
}>;

export type ImportSourceValue = (typeof IMPORT_SOURCES)[number]["value"];