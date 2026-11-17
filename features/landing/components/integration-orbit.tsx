"use client";

import { useEffect, useState, type ComponentType } from "react";
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

const CYCLE_MS = 900;
const TRAVEL_MS = 500;
const SPOKE = 38;
const BEAM = 7;

type PlatformId = (typeof integrations)[number]["id"];

/** Clockwise from top — matches the reference orbit. */
const NODES = integrations.map((platform, index) => {
  const angleDeg = -90 + (360 / integrations.length) * index;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    ...platform,
    x: 50 + Math.cos(angleRad) * SPOKE,
    y: 50 + Math.sin(angleRad) * SPOKE,
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
  hashnode: "text-[#0a0a0a] dark:text-white",
  leetcode: "text-[#FFA116]",
  stackoverflow: "text-[#f48024]",
  codeforces: "",
  linkedin: "text-[#0a66c2]",
};

function pointOnSpoke(node: { x: number; y: number }, distanceFromNode: number) {
  const t = Math.min(SPOKE, Math.max(0, distanceFromNode)) / SPOKE;
  return {
    x: node.x + (50 - node.x) * t,
    y: node.y + (50 - node.y) * t,
  };
}

/** Head leads toward the center. Tail stays behind it, toward the icon. */
function beamOnSpoke(node: { x: number; y: number }, progress: number) {
  const headDist = progress * (SPOKE + BEAM);
  const tailDist = headDist - BEAM;
  if (tailDist >= SPOKE || headDist <= 0) return null;
  return {
    tail: pointOnSpoke(node, tailDist),
    head: pointOnSpoke(node, headDist),
  };
}

export function IntegrationOrbit() {
  const [step, setStep] = useState({ index: 0, progress: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const index = Math.floor(elapsed / CYCLE_MS) % NODES.length;
      const progress = Math.min(1, (elapsed % CYCLE_MS) / TRAVEL_MS);
      setStep({ index, progress });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [prefersReducedMotion]);

  const activeIndex = prefersReducedMotion ? 0 : step.index;
  const activeNode = NODES[activeIndex];
  const beam = beamOnSpoke(
    activeNode,
    prefersReducedMotion ? 0.45 : step.progress,
  );

  return (
    <div
      className="integration-orbit relative mx-auto mt-10 aspect-square w-full max-w-[34rem] select-none"
      role="img"
      aria-label="Portfolio connected to GitHub, Medium, Dev.to, Hashnode, LeetCode, Stack Overflow, Codeforces, and LinkedIn"
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <defs>
          <filter
            id="orbit-glow-blur"
            filterUnits="userSpaceOnUse"
            x="-8"
            y="-8"
            width="116"
            height="116"
          >
            <feGaussianBlur stdDeviation="0.32" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {beam ? (
            <linearGradient
              id="orbit-beam"
              gradientUnits="userSpaceOnUse"
              x1={beam.tail.x}
              y1={beam.tail.y}
              x2={beam.head.x}
              y2={beam.head.y}
            >
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0" />
              <stop offset="55%" stopColor="#60a5fa" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
            </linearGradient>
          ) : null}
        </defs>

        {[18, 28, 38].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="color-mix(in srgb, var(--color-border-strong) 42%, transparent)"
            strokeWidth="0.35"
            strokeDasharray="0.9 1.55"
          />
        ))}

        {NODES.map((node) => (
          <g key={node.id}>
            <line
              x1="50"
              y1="50"
              x2={node.x}
              y2={node.y}
              stroke="color-mix(in srgb, var(--color-border-strong) 38%, transparent)"
              strokeWidth="0.35"
            />
            {node.id === activeNode.id && beam ? (
              <line
                x1={beam.tail.x}
                y1={beam.tail.y}
                x2={beam.head.x}
                y2={beam.head.y}
                stroke="url(#orbit-beam)"
                strokeWidth="0.7"
                strokeLinecap="round"
                filter="url(#orbit-glow-blur)"
                opacity={prefersReducedMotion ? 0.85 : undefined}
              />
            ) : null}
          </g>
        ))}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-10 flex w-[5.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center sm:w-[6.25rem]">
        <div
          className={cn(
            "flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl",
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
        return (
          <div
            key={node.id}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div
              className={cn(
                "integration-orbit__node flex size-11 items-center justify-center rounded-xl bg-surface-raised sm:size-12",
                "shadow-[0_6px_18px_rgba(26,24,40,0.08)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.35)]",
                "transition-[border-color,box-shadow] duration-500 ease-[var(--ease-out)]",
                i === activeIndex
                  ? "border-[2.5px] border-text-primary shadow-[0_0_0_4px_color-mix(in_srgb,#5b9cf5_18%,transparent),0_8px_22px_rgba(26,24,40,0.1)]"
                  : "border border-border-default",
              )}
              style={
                !prefersReducedMotion
                  ? {
                      animation: `orbit-node-float 6.5s ease-in-out ${i * -0.85}s infinite`,
                    }
                  : undefined
              }
            >
              <Icon
                className={cn(
                  "size-[1.35rem] sm:size-[1.45rem]",
                  NODE_ICON_CLASS[node.id],
                )}
              />
            </div>
            <span
              className={cn(
                "max-w-[5.5rem] text-center text-[11px] leading-tight text-text-muted transition-colors duration-500 sm:text-xs",
                i === activeIndex && "text-text-secondary",
              )}
            >
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