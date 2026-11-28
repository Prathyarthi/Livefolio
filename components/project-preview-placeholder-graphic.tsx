"use client";

import { cn } from "@/lib/utils";
import {
  getTemplateProjectPreviewConfig,
  type ProjectPreviewPalette,
  type PreviewPlaceholderVariant,
} from "@/features/templates/project-preview-palettes";

export type { PreviewPlaceholderVariant } from "@/features/templates/project-preview-palettes";

type Palette = ProjectPreviewPalette;

const DEFAULT_PALETTES: Palette[] = [
  {
    bg: "#f3f0ea",
    bgAlt: "#e8e2d8",
    primary: "#6366f1",
    secondary: "#f472b6",
    accent: "#fbbf24",
    surface: "#ffffff",
    muted: "#d4d4d8",
    stroke: "#e4e4e7",
  },
  {
    bg: "#eef6f3",
    bgAlt: "#dceee8",
    primary: "#0d9488",
    secondary: "#fb923c",
    accent: "#a78bfa",
    surface: "#ffffff",
    muted: "#cbd5e1",
    stroke: "#e2e8f0",
  },
  {
    bg: "#f5f0ff",
    bgAlt: "#ebe3ff",
    primary: "#7c3aed",
    secondary: "#ec4899",
    accent: "#38bdf8",
    surface: "#ffffff",
    muted: "#ddd6fe",
    stroke: "#e9d5ff",
  },
  {
    bg: "#fff7ed",
    bgAlt: "#ffedd5",
    primary: "#ea580c",
    secondary: "#0891b2",
    accent: "#84cc16",
    surface: "#ffffff",
    muted: "#fed7aa",
    stroke: "#fdba74",
  },
  {
    bg: "#eff6ff",
    bgAlt: "#dbeafe",
    primary: "#2563eb",
    secondary: "#db2777",
    accent: "#14b8a6",
    surface: "#ffffff",
    muted: "#bfdbfe",
    stroke: "#93c5fd",
  },
];

const RETRO_PALETTE: Palette = {
  bg: "#ffc900",
  bgAlt: "#ff90e8",
  primary: "#ff90e8",
  secondary: "#80ffdb",
  accent: "#ffffff",
  surface: "#ffffff",
  muted: "#ffc900",
  stroke: "#000000",
};

const DARK_PALETTE: Palette = {
  bg: "#0f172a",
  bgAlt: "#1e293b",
  primary: "#22d3ee",
  secondary: "#a78bfa",
  accent: "#f472b6",
  surface: "#1e293b",
  muted: "#334155",
  stroke: "#475569",
};

const MINIMAL_PALETTE: Palette = {
  bg: "#fafaf9",
  bgAlt: "#f5f5f4",
  primary: "#78716c",
  secondary: "#a8a29e",
  accent: "#d6d3d1",
  surface: "#ffffff",
  muted: "#e7e5e4",
  stroke: "#d6d3d1",
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getPalette(
  seed: string,
  variant: PreviewPlaceholderVariant,
  templateId?: string,
  accentColor?: string
): Palette {
  const templateConfig = getTemplateProjectPreviewConfig(templateId);
  let palette: Palette;
  if (templateConfig) {
    palette = templateConfig.palette;
  } else if (variant === "retro") {
    palette = RETRO_PALETTE;
  } else if (variant === "dark") {
    palette = DARK_PALETTE;
  } else if (variant === "minimal") {
    palette = MINIMAL_PALETTE;
  } else {
    palette = DEFAULT_PALETTES[hashString(seed) % DEFAULT_PALETTES.length];
  }

  if (accentColor && /^#[0-9a-fA-F]{6}$/.test(accentColor)) {
    return {
      ...palette,
      primary: accentColor,
      accent: accentColor,
    };
  }

  // Prefer CSS variable when the template root sets --lf-accent.
  return {
    ...palette,
    primary: `var(--lf-accent, ${palette.primary})`,
    accent: `var(--lf-accent, ${palette.accent})`,
  };
}

function resolveVariant(
  variant: PreviewPlaceholderVariant,
  templateId?: string
): PreviewPlaceholderVariant {
  return getTemplateProjectPreviewConfig(templateId)?.variant ?? variant;
}

function DecorativeBackground({
  palette,
  variant,
  seed,
}: {
  palette: Palette;
  variant: PreviewPlaceholderVariant;
  seed: number;
}) {
  const isRetro = variant === "retro";
  const isDark = variant === "dark";

  return (
    <>
      <rect width="800" height="500" fill={`url(#bg-gradient-${seed})`} />

      {isRetro ? (
        <>
          <circle cx="680" cy="90" r="48" fill={palette.secondary} stroke="#000" strokeWidth="4" />
          <rect x="48" y="380" width="64" height="64" fill={palette.primary} stroke="#000" strokeWidth="4" />
          <polygon
            points="720,380 760,420 720,460 680,420"
            fill={palette.accent}
            stroke="#000"
            strokeWidth="4"
          />
          <g opacity="0.35">
            {Array.from({ length: 6 }).map((_, i) => (
              <circle
                key={i}
                cx={120 + i * 28}
                cy={60 + (i % 2) * 12}
                r="5"
                fill="#000"
              />
            ))}
          </g>
        </>
      ) : (
        <>
          <circle cx="680" cy="70" r="110" fill={palette.primary} opacity={isDark ? 0.18 : 0.12} />
          <circle cx="90" cy="420" r="85" fill={palette.secondary} opacity={isDark ? 0.16 : 0.1} />
          <circle cx="620" cy="430" r="55" fill={palette.accent} opacity={isDark ? 0.14 : 0.14} />
          <g opacity={isDark ? 0.08 : 0.05}>
            {Array.from({ length: 12 }).map((_, row) =>
              Array.from({ length: 20 }).map((__, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={24 + col * 38}
                  cy={18 + row * 38}
                  r="1.5"
                  fill={isDark ? "#fff" : "#000"}
                />
              ))
            )}
          </g>
        </>
      )}
    </>
  );
}

function BrowserChrome({
  palette,
  variant,
  seed,
  templateId,
}: {
  palette: Palette;
  variant: PreviewPlaceholderVariant;
  seed: number;
  templateId?: string;
}) {
  const isRetro = variant === "retro";
  const isDark = variant === "dark";
  const isMinimal = variant === "minimal";
  const layout =
    templateId === "corporate" || templateId === "space" ? 0 : seed % 3;

  const x = 72;
  const y = 52;
  const w = 656;
  const h = 396;
  const radius = isRetro ? 0 : isMinimal ? 6 : 14;
  const strokeW = isRetro ? 4 : isDark ? 1.5 : 1;
  const stroke = isRetro ? "#000" : palette.stroke;

  return (
    <g>
      {isRetro && (
        <rect
          x={x + 8}
          y={y + 8}
          width={w}
          height={h}
          fill="#000"
          aria-hidden
        />
      )}

      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={radius}
        fill={palette.surface}
        stroke={stroke}
        strokeWidth={strokeW}
      />

      {/* Title bar */}
      <rect
        x={x}
        y={y}
        width={w}
        height={isRetro ? 44 : 40}
        rx={radius}
        fill={isRetro ? palette.primary : isDark ? palette.bgAlt : "#f4f4f5"}
        stroke={stroke}
        strokeWidth={isRetro ? strokeW : 0}
      />
      <rect
        x={x}
        y={y + (isRetro ? 40 : 36)}
        width={w}
        height={isRetro ? 4 : 4}
        fill={isRetro ? "#000" : palette.stroke}
        opacity={isRetro ? 1 : 0.6}
      />

      {/* Traffic lights */}
      {!isMinimal && (
        <g transform={`translate(${x + 18}, ${y + (isRetro ? 16 : 14)})`}>
          {[
            isRetro ? palette.secondary : "#fb7185",
            isRetro ? palette.accent : "#fbbf24",
            isRetro ? palette.bg : "#4ade80",
          ].map((color, i) => (
            <circle
              key={i}
              cx={i * 18}
              cy={6}
              r={isRetro ? 7 : 5.5}
              fill={color}
              stroke={isRetro ? "#000" : "none"}
              strokeWidth={isRetro ? 2.5 : 0}
            />
          ))}
        </g>
      )}

      {/* URL bar */}
      <rect
        x={x + (isMinimal ? 20 : 88)}
        y={y + (isRetro ? 10 : 9)}
        width={isMinimal ? w - 40 : w - 110}
        height={isRetro ? 24 : 22}
        rx={isRetro ? 0 : 11}
        fill={isRetro ? palette.accent : isDark ? palette.bg : "#ffffff"}
        stroke={stroke}
        strokeWidth={isRetro ? 3 : 1}
      />
      <rect
        x={x + (isMinimal ? 32 : 100)}
        y={y + (isRetro ? 18 : 16)}
        width={120 + (seed % 4) * 24}
        height={8}
        rx={4}
        fill={isRetro ? palette.muted : isDark ? palette.muted : palette.muted}
        opacity={0.85}
      />

      {/* Content area */}
      <g transform={`translate(${x + 24}, ${y + (isRetro ? 68 : 60)})`}>
        {layout === 0 && (
          <>
            <rect
              width={608}
              height={layout === 0 ? 108 : 96}
              rx={isRetro ? 0 : 8}
              fill={isRetro ? palette.muted : palette.primary}
              opacity={isRetro ? 1 : isDark ? 0.35 : 0.18}
              stroke={isRetro ? "#000" : "none"}
              strokeWidth={isRetro ? 3 : 0}
            />
            <rect y={124} width={280} height={12} rx={4} fill={palette.muted} opacity={0.9} />
            <rect y={148} width={420} height={10} rx={4} fill={palette.muted} opacity={0.65} />
            <rect y={168} width={360} height={10} rx={4} fill={palette.muted} opacity={0.45} />
            <rect
              y={200}
              width={140}
              height={36}
              rx={isRetro ? 0 : 18}
              fill={isRetro ? palette.secondary : palette.primary}
              opacity={isRetro ? 1 : 0.85}
              stroke={isRetro ? "#000" : "none"}
              strokeWidth={isRetro ? 3 : 0}
            />
            <rect
              x={320}
              y={200}
              width={288}
              height={148}
              rx={isRetro ? 0 : 10}
              fill={isRetro ? palette.bgAlt : palette.bgAlt}
              opacity={isRetro ? 1 : isDark ? 0.5 : 0.55}
              stroke={isRetro ? "#000" : palette.stroke}
              strokeWidth={isRetro ? 3 : 1}
            />
            <rect
              x={0}
              y={200}
              width={288}
              height={148}
              rx={isRetro ? 0 : 10}
              fill={isRetro ? palette.primary : palette.secondary}
              opacity={isRetro ? 1 : isDark ? 0.28 : 0.16}
              stroke={isRetro ? "#000" : palette.stroke}
              strokeWidth={isRetro ? 3 : 1}
            />
          </>
        )}

        {layout === 1 && (
          <>
            <rect
              width={180}
              height={280}
              rx={isRetro ? 0 : 8}
              fill={isRetro ? palette.secondary : palette.secondary}
              opacity={isRetro ? 1 : isDark ? 0.32 : 0.2}
              stroke={isRetro ? "#000" : "none"}
              strokeWidth={isRetro ? 3 : 0}
            />
            <rect
              x={200}
              width={408}
              height={88}
              rx={isRetro ? 0 : 8}
              fill={isRetro ? palette.muted : palette.primary}
              opacity={isRetro ? 1 : isDark ? 0.35 : 0.2}
              stroke={isRetro ? "#000" : "none"}
              strokeWidth={isRetro ? 3 : 0}
            />
            <rect x={200} y={104} width={190} height={80} rx={isRetro ? 0 : 8} fill={palette.bgAlt} opacity={0.75} stroke={isRetro ? "#000" : palette.stroke} strokeWidth={isRetro ? 3 : 1} />
            <rect x={406} y={104} width={202} height={80} rx={isRetro ? 0 : 8} fill={palette.accent} opacity={isRetro ? 1 : isDark ? 0.25 : 0.18} stroke={isRetro ? "#000" : palette.stroke} strokeWidth={isRetro ? 3 : 1} />
            <rect x={200} y={200} width={408} height={12} rx={4} fill={palette.muted} opacity={0.7} />
            <rect x={200} y={224} width={320} height={10} rx={4} fill={palette.muted} opacity={0.5} />
            <rect x={200} y={248} width={260} height={10} rx={4} fill={palette.muted} opacity={0.35} />
          </>
        )}

        {layout === 2 && (
          <>
            <rect width={608} height={72} rx={isRetro ? 0 : 8} fill={palette.primary} opacity={isRetro ? 1 : isDark ? 0.3 : 0.16} stroke={isRetro ? "#000" : "none"} strokeWidth={isRetro ? 3 : 0} />
            <rect y={88} width={190} height={190} rx={isRetro ? 0 : 8} fill={palette.secondary} opacity={isRetro ? 1 : isDark ? 0.28 : 0.18} stroke={isRetro ? "#000" : palette.stroke} strokeWidth={isRetro ? 3 : 1} />
            <rect x={210} y={88} width={190} height={190} rx={isRetro ? 0 : 8} fill={palette.accent} opacity={isRetro ? 1 : isDark ? 0.22 : 0.15} stroke={isRetro ? "#000" : palette.stroke} strokeWidth={isRetro ? 3 : 1} />
            <rect x={420} y={88} width={188} height={190} rx={isRetro ? 0 : 8} fill={palette.bgAlt} opacity={0.8} stroke={isRetro ? "#000" : palette.stroke} strokeWidth={isRetro ? 3 : 1} />
            <rect y={296} width={480} height={10} rx={4} fill={palette.muted} opacity={0.55} />
            <rect y={318} width={360} height={10} rx={4} fill={palette.muted} opacity={0.35} />
          </>
        )}
      </g>

      {isRetro && (
        <g transform={`translate(${x + w - 56}, ${y + h - 56})`}>
          <polygon
            points="0,0 24,0 24,24 0,24"
            fill={palette.secondary}
            stroke="#000"
            strokeWidth="3"
          />
          <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000">
            *
          </text>
        </g>
      )}
    </g>
  );
}

export function ProjectPreviewPlaceholderGraphic({
  title,
  seedKey,
  variant = "default",
  templateId,
  accentColor,
  className,
}: {
  title: string;
  seedKey?: string;
  variant?: PreviewPlaceholderVariant;
  templateId?: string;
  /** When set, overrides the placeholder's primary/accent colors. */
  accentColor?: string;
  className?: string;
}) {
  const seed = hashString(seedKey ?? title);
  const resolvedVariant = resolveVariant(variant, templateId);
  const palette = getPalette(seedKey ?? title, variant, templateId, accentColor);

  return (
    <div
      role="img"
      aria-label={`${title} — preview unavailable`}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <svg
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={`bg-gradient-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.bg} />
            <stop offset="100%" stopColor={palette.bgAlt} />
          </linearGradient>
        </defs>

        <DecorativeBackground palette={palette} variant={resolvedVariant} seed={seed} />
        <BrowserChrome
          palette={palette}
          variant={resolvedVariant}
          seed={seed}
          templateId={templateId}
        />
      </svg>

      <span className="sr-only">{title}</span>
    </div>
  );
}
