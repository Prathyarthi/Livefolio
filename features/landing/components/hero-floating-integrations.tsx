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
 * Decorative T3-style floating integration tiles around the hero copy.
 * aria-hidden — accessible platform list remains in HeroPlatformStrip.
 * Only Livefolio-supported platforms (no fabricated brands).
 *
 * Responsive: hidden < md; 4 tiles at md; all 6 at lg+. Never overlaps
 * central copy (stage is wider; tiles sit in side gutters).
 */
const TILES = [
  {
    id: "github",
    Icon: GitHubIcon,
    rotate: "-8deg",
    visibility: "max-md:hidden",
    pos: "left-[0%] top-[8%] md:-left-1 lg:-left-3",
  },
  {
    id: "medium",
    Icon: MediumIcon,
    rotate: "7deg",
    visibility: "max-md:hidden",
    pos: "right-[0%] top-[6%] md:-right-1 lg:-right-3",
  },
  {
    id: "devto",
    Icon: DevtoIcon,
    rotate: "5deg",
    visibility: "max-lg:hidden",
    pos: "left-0 top-[44%] lg:-left-7",
  },
  {
    id: "leetcode",
    Icon: LeetCodeIcon,
    rotate: "-6deg",
    visibility: "max-lg:hidden",
    pos: "right-0 top-[42%] lg:-right-7",
  },
  {
    id: "hashnode",
    Icon: HashnodeIcon,
    rotate: "-4deg",
    visibility: "max-md:hidden",
    pos: "bottom-[20%] left-[1%] md:left-0 lg:-left-2",
  },
  {
    id: "stackoverflow",
    Icon: StackOverflowIcon,
    rotate: "8deg",
    visibility: "max-md:hidden",
    pos: "bottom-[18%] right-[1%] md:right-0 lg:-right-2",
  },
] as const;

export function HeroFloatingIntegrations() {
  return (
    <div
      className="studio-hero-float pointer-events-none absolute inset-0 z-0"
      aria-hidden
    >
      {TILES.map(({ id, Icon, rotate, visibility, pos }) => (
        <span
          key={id}
          className={`studio-hero-float__tile absolute flex size-12 items-center justify-center rounded-2xl border border-border-default bg-surface-raised text-text-primary shadow-[0_8px_24px_rgba(26,24,40,0.08)] sm:size-[3.25rem] lg:size-14 ${visibility} ${pos}`}
          style={{ ["--studio-tile-rot" as string]: rotate }}
        >
          <Icon className="size-5 sm:size-[1.35rem] lg:size-6" />
        </span>
      ))}
    </div>
  );
}
