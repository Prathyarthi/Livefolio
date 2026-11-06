import {
  CodeforcesIcon,
  DevtoIcon,
  HashnodeIcon,
  LeetCodeMark,
  StackOverflowIcon,
} from "@/components/icons";
import {
  GitHubIcon,
  MediumIcon,
} from "@/features/landing/components/integration-icons";
import { integrations } from "@/lib/site";

const ICONS = {
  github: GitHubIcon,
  medium: MediumIcon,
  devto: DevtoIcon,
  hashnode: HashnodeIcon,
  leetcode: LeetCodeMark,
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
    <div className="mx-auto mt-8 w-full max-w-[48rem] pt-2">
      <p className="text-center text-[13px] text-text-muted">
        Connect the tools you already use
      </p>
      <ul className="mt-3.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 sm:gap-x-3 md:flex-nowrap md:gap-x-3.5 lg:gap-x-4">
        {platforms.map((platform) => {
          const Icon = ICONS[platform.id];
          return (
            <li
              key={platform.id}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-text-secondary"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-text-primary" />
              <span className="text-[12px] font-medium tracking-[-0.01em] sm:text-[13px]">
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
