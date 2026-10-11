import type { ComponentType, ReactNode } from "react";
import type { integrations } from "@/lib/site";

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

export function LeetCodeIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.346c.467-.467 1.125-.645 1.837-.645s1.357.195 1.824.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.055 5.055 0 00-2.445-1.337l2.467-2.503c.516-.514.498-1.366-.037-1.901-.535-.535-1.387-.553-1.902-.039l-10.1 10.101c-.981.982-1.464 2.337-1.464 3.835 0 1.498.483 2.853 1.464 3.835l4.347 4.361c.981.983 2.337 1.467 3.835 1.467s2.853-.484 3.835-1.467l10.1-10.101c.515-.514.533-1.366.037-1.901-.535-.535-1.387-.553-1.902-.039l-2.585 2.611a5.043 5.043 0 00-1.337 2.445z" />
    </IconBase>
  );
}

const INTEGRATION_ICONS: Record<
  IntegrationId,
  ComponentType<{ className?: string }>
> = {
  github: GitHubIcon,
  medium: MediumIcon,
  leetcode: LeetCodeIcon,
};

const PLATFORM_STYLES: Record<
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
    accent: "bg-[#ffa116]",
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
      <Icon className={`h-6 w-6 ${style.iconClass}`} />
    </span>
  );
}
