import type { CSSProperties, ComponentType } from "react";
import {
  DevtoIcon,
  HashnodeIcon,
  LeetCodeMark,
  LinkedinIcon,
  StackOverflowIcon,
} from "@/components/icons";
import { LogoMark } from "@/components/logo";
import {
  GitHubIcon,
  MediumIcon,
} from "@/features/landing/components/integration-icons";
import { integrations } from "@/lib/site";
import { cn } from "@/lib/utils";

const SPOKE = 38;

/** Must match `--orbit-cycle` and the hub-beat keyframes in globals.css. */
const CYCLE_S = 7.4;

/**
 * Point in the shared cycle (0–1) at which each spoke fires, indexed clockwise
 * from top. Shuffled order with uneven gaps of at least 10% of the cycle, so
 * only one comet reaches the hub at a time. Fixed (not Math.random) for hydration.
 */
const FIRE_AT = [0.5, 0.2625, 0.75, 0, 0.3625, 0.8875, 0.1, 0.65] as const;

type PlatformId = (typeof integrations)[number]["id"];

const NODES = integrations.map((platform, index) => {
  const angleDeg = -90 + (360 / integrations.length) * index;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    ...platform,
    x: 50 + Math.cos(angleRad) * SPOKE,
    y: 50 + Math.sin(angleRad) * SPOKE,
    /** Points from the node toward the hub; the comet travels along +x in this frame. */
    inwardDeg: angleDeg + 180,
    timing: {
      animationDelay: `${((FIRE_AT[index % FIRE_AT.length] - 1) * CYCLE_S).toFixed(3)}s`,
    } satisfies CSSProperties,
  };
});

function CodeforcesBars({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <rect x="2" y="8" width="5" height="13" rx="1.2" fill="#1f8acb" />
      <rect x="9.5" y="3" width="5" height="18" rx="1.2" fill="#e74c3c" />
      <rect x="17" y="11" width="5" height="10" rx="1.2" fill="#f1c40f" />
    </svg>
  );
}

const NODE_ICONS: Record<PlatformId, ComponentType<{ className?: string }>> = {
  github: GitHubIcon,
  medium: MediumIcon,
  devto: DevtoIcon,
  hashnode: HashnodeIcon,
  leetcode: LeetCodeMark,
  stackoverflow: StackOverflowIcon,
  codeforces: CodeforcesBars,
  linkedin: LinkedinIcon,
};

const NODE_ICON_CLASS: Record<PlatformId, string> = {
  github: "text-[#24292f] dark:text-white",
  medium: "text-black dark:text-white",
  devto: "text-[#0a0a0a] dark:text-white",
  hashnode: "text-[#2962ff]",
  leetcode: "text-[#FFA116]",
  stackoverflow: "text-[#f48024]",
  codeforces: "",
  linkedin: "text-[#0a66c2]",
};

const SYNC_PULSE = "#e86a5a";
const COMET_TRAIL = 12;

const RINGS = [
  { r: 18, spin: "orbit-ring--ccw", dots: [0, 180] },
  { r: 28, spin: "orbit-ring--cw", dots: [60] },
  { r: 38, spin: "orbit-ring--ccw-slow", dots: [] },
] as const;

export function IntegrationOrbit() {
  return (
    <div
      className="integration-orbit relative mx-auto mt-10 aspect-square w-full max-w-[44rem] select-none"
      role="img"
      aria-label="Portfolio connected to GitHub, Medium, Dev.to, Hashnode, LeetCode, Stack Overflow, Codeforces, and LinkedIn"
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <defs>
          {/* Blur is applied in each comet's rotated frame, so x is the direction of travel. */}
          <filter
            id="orbit-motion-blur"
            filterUnits="userSpaceOnUse"
            x={-COMET_TRAIL - 6}
            y="-4"
            width={COMET_TRAIL + 12}
            height="8"
          >
            <feGaussianBlur stdDeviation="0.45 0.08" result="streak" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.15" result="glow" />
            <feMerge>
              <feMergeNode in="streak" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient
            id="orbit-comet"
            gradientUnits="userSpaceOnUse"
            x1={-COMET_TRAIL}
            y1="0"
            x2="0"
            y2="0"
          >
            <stop offset="0%" stopColor={SYNC_PULSE} stopOpacity="0" />
            <stop offset="60%" stopColor={SYNC_PULSE} stopOpacity="0.5" />
            <stop offset="100%" stopColor={SYNC_PULSE} stopOpacity="1" />
          </linearGradient>
          <clipPath id="orbit-spoke-clip">
            <circle cx="50" cy="50" r={SPOKE} />
          </clipPath>
          <radialGradient id="orbit-core-glow">
            <stop offset="0%" stopColor={SYNC_PULSE} stopOpacity="0.22" />
            <stop offset="100%" stopColor={SYNC_PULSE} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          className="orbit-core-glow"
          cx="50"
          cy="50"
          r="16"
          fill="url(#orbit-core-glow)"
        />

        {RINGS.map(({ r, spin, dots }) => (
          <g key={r} className={cn("orbit-ring", spin)}>
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="color-mix(in srgb, var(--color-border-strong) 42%, transparent)"
              strokeWidth="0.35"
              strokeDasharray="0.9 1.55"
            />
          </g>
        ))}

        {NODES.map((node) => {
          const pulseStyle = node.timing;
          return (
            <g key={node.id} clipPath="url(#orbit-spoke-clip)">
              <line
                x1="50"
                y1="50"
                x2={node.x}
                y2={node.y}
                stroke="color-mix(in srgb, var(--color-border-strong) 38%, transparent)"
                strokeWidth="0.35"
              />
              <g
                transform={`translate(${node.x} ${node.y}) rotate(${node.inwardDeg})`}
              >
                <g className="orbit-comet" style={pulseStyle}>
                  <line
                    x1={-COMET_TRAIL}
                    y1="0"
                    x2="0"
                    y2="0"
                    stroke="url(#orbit-comet)"
                    strokeWidth="0.45"
                    strokeLinecap="round"
                    filter="url(#orbit-motion-blur)"
                  />
                </g>
              </g>
            </g>
          );
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-10 flex w-[5.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center sm:w-[6.25rem]">
        <span
          aria-hidden
          className="orbit-hub-ripple absolute inset-0 rounded-full border border-[#e86a5a]/40"
        />
        <span
          aria-hidden
          className="orbit-hub-ripple absolute inset-0 rounded-full border border-[#e86a5a]/40 [animation-delay:-1.5s]"
        />
        <div
          className={cn(
            "orbit-hub relative flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-full",
            "border border-border-default bg-surface-raised",
            "shadow-[0_8px_28px_rgba(26,24,40,0.08)]",
            "dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)]",
          )}
        >
          <LogoMark className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-primary sm:text-[11px]">
            Livefolio
          </span>
        </div>
      </div>

      {NODES.map((node, i) => {
        const Icon = NODE_ICONS[node.id];
        const ringStyle = node.timing;
        return (
          <div
            key={node.id}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div
              className="integration-orbit__node relative"
              style={{
                animation: `orbit-node-float 6.5s ease-in-out ${i * -0.85}s infinite`,
              }}
            >
              <span
                aria-hidden
                className="orbit-node-ring absolute inset-0 rounded-full"
                style={ringStyle}
              />
              <div
                className={cn(
                  "orbit-node-face relative flex size-11 items-center justify-center rounded-full border border-border-default bg-surface-raised sm:size-12",
                  "shadow-[0_6px_18px_rgba(26,24,40,0.08)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.35)]",
                )}
                style={ringStyle}
              >
                <Icon
                  className={cn(
                    "size-[1.35rem] sm:size-[1.45rem]",
                    NODE_ICON_CLASS[node.id],
                  )}
                />
              </div>
            </div>
            <span className="max-w-[5.5rem] text-center text-[11px] leading-tight text-text-muted sm:text-xs">
              {node.name}
            </span>
          </div>
        );
      })}

      <ul className="sr-only">
        {integrations.map((p) => (
          <li key={p.id}>
            {p.name}: {p.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
