import { BRAND_LOGOS } from "@/features/landing/components/brand-logos";
import { integrations } from "@/lib/site";

/** Platforms shown in the compact end-of-hero strip (truthful, not customers). */
const HERO_PLATFORM_IDS = [
  "github",
  "medium",
  "devto",
  "leetcode",
  "stackoverflow",
  "hashnode",
  "codeforces",
  "linkedin",
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
    <div className="relative z-[1] mx-auto mt-12 w-full max-w-[68rem] sm:mt-24">
      <p className="text-center text-[15px] text-text-muted sm:text-[16px]">
        Connect the tools you already use
      </p>
      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-6 lg:flex-nowrap lg:gap-x-7">
        {platforms.map((platform) => {
          const Logo = BRAND_LOGOS[platform.id];
          return (
            <li
              key={platform.id}
              className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-text-secondary"
            >
              <Logo className="h-6 w-6 shrink-0 text-text-primary sm:h-7 sm:w-7" />
              <span className="text-[15px] font-medium tracking-[-0.01em] sm:text-[17px]">
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
