import type { ComponentType, ReactNode } from "react";
import type { integrations } from "@/lib/site";
import {
  CodeforcesIcon,
  DevtoIcon,
  HashnodeIcon,
  LeetCodeIcon,
  StackOverflowIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

type IntegrationId = (typeof integrations)[number]["id"];

function IconBase({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function GitHubIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.37-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4 1.02 0 2.05.13 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.19.69.82.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
    </IconBase>
  );
}

export function MediumIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </IconBase>
  );
}

export { LeetCodeIcon };

const INTEGRATION_ICONS: Record<
  IntegrationId,
  ComponentType<{ className?: string }>
> = {
  github: GitHubIcon,
  medium: MediumIcon,
  devto: DevtoIcon,
  hashnode: HashnodeIcon,
  leetcode: LeetCodeIcon,
  stackoverflow: StackOverflowIcon,
  codeforces: CodeforcesIcon,
};

export const PLATFORM_STYLES: Record<
  IntegrationId,
  { accent: string; iconClass: string }
> = {
  github: {
    accent: "bg-[#24292f] dark:bg-[#f0f6fc]",
    iconClass: "text-white dark:text-[#24292f]",
  },
  medium: {
    accent: "bg-[#000000] dark:bg-white",
    iconClass: "text-white dark:text-black",
  },
  leetcode: {
    accent: "bg-black",
    iconClass: "h-9 w-9 max-h-none max-w-none",
  },
  devto: {
    accent: "bg-[#0a0a0a] dark:bg-white",
    iconClass: "text-white dark:text-black",
  },
  hashnode: {
    accent: "bg-[#2962ff]",
    iconClass: "text-white",
  },
  stackoverflow: {
    accent: "bg-[#f48024]",
    iconClass: "text-white",
  },
  codeforces: {
    accent: "bg-[#1f8acb]",
    iconClass: "text-white",
  },
};

export function IntegrationIcon({
  id,
  className,
}: {
  id: IntegrationId;
  className?: string;
}) {
  const Icon = INTEGRATION_ICONS[id];
  const style = PLATFORM_STYLES[id];
  return (
    <span
      className={`flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] ${style.accent} ${className ?? ""}`}
    >
      <Icon className={cn("h-6 w-6", style.iconClass)} />
    </span>
  );
}
