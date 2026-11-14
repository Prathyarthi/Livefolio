import {
  DevtoIcon,
  HashnodeIcon,
  StackOverflowIcon,
} from "@/components/icons";
import {
  GitHubIcon,
  LeetCodeIcon,
  MediumIcon,
  PLATFORM_STYLES,
} from "@/features/landing/components/integration-icons";

/**
 * Decorative floating integration tiles around the hero copy.
 * aria-hidden — accessible platform list remains in HeroPlatformStrip.
 * Offsets are fixed but uneven in both axes so the marks don't form columns.
 * Hidden below md. On md they hug the edges; from lg they scatter in the gutters.
 */
const TILES = [
  {
    id: "github",
    Icon: GitHubIcon,
    rotate: "-18deg",
    visibility: "max-md:hidden",
    pos: "left-0 top-[8%] lg:left-0 lg:top-[1%]",
    size: "size-[2.65rem] lg:size-[3.05rem]",
  },
  {
    id: "medium",
    Icon: MediumIcon,
    rotate: "11deg",
    visibility: "max-lg:hidden",
    pos: "right-0 top-[36%] lg:right-0 lg:top-[48%] xl:right-[1%] xl:top-[46%]",
    size: "size-[3rem] lg:size-[3.35rem]",
  },
  {
    id: "devto",
    Icon: DevtoIcon,
    rotate: "-5deg",
    visibility: "max-lg:hidden",
    pos: "left-0 top-[42%] lg:left-[7%] lg:top-[40%] xl:left-[11%] xl:top-[34%]",
    size: "size-[2.5rem] lg:size-[2.8rem]",
  },
  {
    id: "leetcode",
    Icon: LeetCodeIcon,
    rotate: "16deg",
    visibility: "max-md:hidden",
    pos: "right-0 top-[16%] lg:right-[4%] lg:top-[12%] xl:right-[6%] xl:top-[13%]",
    size: "size-10 lg:size-[2.55rem]",
  },
  {
    id: "hashnode",
    Icon: HashnodeIcon,
    rotate: "20deg",
    visibility: "max-md:hidden",
    pos: "bottom-[10%] left-0 lg:bottom-[18%] lg:left-[2%] xl:left-[5%]",
    size: "size-[2.35rem] lg:size-[2.7rem]",
  },
  {
    id: "stackoverflow",
    Icon: StackOverflowIcon,
    rotate: "-12deg",
    visibility: "max-md:hidden",
    pos: "bottom-[2%] right-0 lg:bottom-[6%] lg:right-[7%] xl:right-[10%] xl:bottom-[3%]",
    size: "size-12 lg:size-[3.4rem]",
  },
] as const;

export function HeroFloatingIntegrations() {
  return (
    <div
      className="studio-hero-float pointer-events-none absolute inset-0 z-0"
      aria-hidden
    >
      {TILES.map(({ id, Icon, rotate, visibility, pos, size }) => {
        const style = PLATFORM_STYLES[id];
        return (
          <span
            key={id}
            className={`studio-hero-float__tile absolute flex items-center justify-center rounded-2xl shadow-[0_8px_24px_rgba(26,24,40,0.08)] ${style.accent} ${size} ${visibility} ${pos}`}
            style={{ ["--studio-tile-rot" as string]: rotate }}
          >
            <Icon
              className={
                id === "leetcode"
                  ? "size-[86%]"
                  : `size-[46%] max-h-6 max-w-6 ${style.iconClass}`
              }
            />
          </span>
        );
      })}
    </div>
  );
}
