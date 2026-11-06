import {
  DevtoIcon,
  HashnodeIcon,
  StackOverflowIcon,
} from "@/components/icons";
import {
  GitHubIcon,
  LeetCodeIcon,
  MediumIcon,
} from "@/features/landing/components/integration-icons";

/**
 * Decorative floating integration tiles around the hero copy.
 * aria-hidden — accessible platform list remains in HeroPlatformStrip.
 * Stable asymmetric positions (not mirrored rows / not runtime-random).
 * Responsive: hidden < md; 4 at md; 6 at lg+. Side gutters only.
 */
const TILES = [
  {
    id: "github",
    Icon: GitHubIcon,
    rotate: "-11deg",
    visibility: "max-md:hidden",
    pos: "left-[1%] top-[4%] md:-left-2 lg:-left-5",
    size: "size-12 sm:size-[3.35rem] lg:size-[3.75rem]",
  },
  {
    id: "medium",
    Icon: MediumIcon,
    rotate: "9deg",
    visibility: "max-md:hidden",
    pos: "right-[3%] top-[14%] md:right-0 lg:-right-1",
    size: "size-11 sm:size-12 lg:size-[3.25rem]",
  },
  {
    id: "devto",
    Icon: DevtoIcon,
    rotate: "14deg",
    visibility: "max-lg:hidden",
    pos: "left-[4%] top-[38%] lg:-left-8",
    size: "size-[3.15rem] lg:size-14",
  },
  {
    id: "leetcode",
    Icon: LeetCodeIcon,
    rotate: "-7deg",
    visibility: "max-lg:hidden",
    pos: "right-[1%] top-[48%] lg:-right-9",
    size: "size-12 lg:size-[3.4rem]",
  },
  {
    id: "hashnode",
    Icon: HashnodeIcon,
    rotate: "-15deg",
    visibility: "max-md:hidden",
    pos: "bottom-[28%] left-[6%] md:bottom-[32%] md:left-2 lg:bottom-[30%] lg:-left-3",
    size: "size-11 sm:size-12 lg:size-[3.15rem]",
  },
  {
    id: "stackoverflow",
    Icon: StackOverflowIcon,
    rotate: "6deg",
    visibility: "max-md:hidden",
    pos: "bottom-[12%] right-[5%] md:bottom-[16%] md:right-3 lg:bottom-[14%] lg:-right-4",
    size: "size-12 sm:size-[3.35rem] lg:size-14",
  },
] as const;

export function HeroFloatingIntegrations() {
  return (
    <div
      className="studio-hero-float pointer-events-none absolute inset-0 z-0"
      aria-hidden
    >
      {TILES.map(({ id, Icon, rotate, visibility, pos, size }) => (
        <span
          key={id}
          className={`studio-hero-float__tile absolute flex items-center justify-center rounded-2xl border border-border-default bg-surface-raised text-text-primary shadow-[0_8px_24px_rgba(26,24,40,0.08)] ${size} ${visibility} ${pos}`}
          style={{ ["--studio-tile-rot" as string]: rotate }}
        >
          <Icon className="size-[45%] max-h-6 max-w-6" />
        </span>
      ))}
    </div>
  );
}
