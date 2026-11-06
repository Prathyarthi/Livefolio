import {
  CodeforcesIcon,
  DevtoIcon,
  HashnodeIcon,
  StackOverflowIcon,
} from "@/components/icons";
import {
  GitHubIcon,
  LeetCodeIcon,
  MediumIcon,
} from "@/features/landing/components/integration-icons";
import { integrations } from "@/lib/site";

const ICONS = {
  github: GitHubIcon,
  medium: MediumIcon,
  devto: DevtoIcon,
  hashnode: HashnodeIcon,
  leetcode: LeetCodeIcon,
  stackoverflow: StackOverflowIcon,
  codeforces: CodeforcesIcon,
} as const;

/** Platforms shown in the compact end-of-hero strip (truthful, not customers). */
const HERO_PLATFORM_IDS = [
  "github",
  "medium",
  "devto",
  "leetcode",
  "stackoverflow",
  "hashnode",
  "codeforces",
] as const;

/**
 * Compact proof strip inside the hero — caption + inline platform marks.
 * Not fabricated endorsements; only platforms Livefolio actually connects.
 */
export function HeroPlatformStrip() {
  const platforms = integrations.filter((p) =>
    (HERO_PLATFORM_IDS as readonly string[]).includes(p.id),
  );

  return (
    <div className="mx-auto mt-9 w-full max-w-[36rem] border-t border-dashed border-border-default/60 pt-6">
      <p className="text-center text-[13px] text-text-muted">
        Connect the tools you already use
      </p>
      <ul className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 sm:gap-x-5">
        {platforms.map((platform) => {
          const Icon = ICONS[platform.id];
          return (
            <li
              key={platform.id}
              className="inline-flex items-center gap-1.5 text-text-secondary"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-text-primary" />
              <span className="text-[13px] font-medium tracking-[-0.01em]">
                {platform.name}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** @deprecated Prefer HeroPlatformStrip inside Hero — kept for rare imports. */
export function PlatformProof() {
  return <HeroPlatformStrip />;
}
