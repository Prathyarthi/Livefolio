import {
  BookOpen,
  Code,
  GitBranch,
  Layers,
  Briefcase,
  Newspaper,
  PenLine,
  Rocket,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { BadgeIcon as BadgeIconName } from "@/lib/badges-catalog";

const ICONS: Record<BadgeIconName, LucideIcon> = {
  sparkles: Sparkles,
  rocket: Rocket,
  github: GitBranch,
  linkedin: Briefcase,
  code: Code,
  "pen-line": PenLine,
  newspaper: Newspaper,
  "book-open": BookOpen,
  layers: Layers,
  trophy: Trophy,
};

export function BadgeIcon({ name, className }: { name: BadgeIconName; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
