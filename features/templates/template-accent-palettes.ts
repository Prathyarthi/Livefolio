import type { PortfolioCustomization } from "./types";
import { getTemplateProjectPreviewConfig } from "./project-preview-palettes";

export type AccentSwatch = {
  name: string;
  hex: string;
};

/** Shared swatch set for the accent picker. */
export const ACCENT_SWATCHES: AccentSwatch[] = [
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#22c55e" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Orange", hex: "#f97316" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Rose", hex: "#fb7185" },
  { name: "Fuchsia", hex: "#c026d3" },
  { name: "Gold", hex: "#d4af37" },
  { name: "Terracotta", hex: "#e07a5f" },
];

/**
 * Per-template default accents (aligned with each template's natural brand color).
 */
const TEMPLATE_DEFAULT_ACCENTS: Record<string, string> = {
  minimal: "#78716c",
  modern: "#8b5cf6",
  developer: "#22c55e",
  creative: "#fb7185",
  corporate: "#3b82f6",
  spotlight: "#facc15",
  retro: "#ff90e8",
  bento: "#a78bfa",
  vibrant: "#c026d3",
  space: "#06b6d4",
  windows: "#000080",
  paper: "#2c2c2c",
  cyberpunk: "#00ff00",
  pastel: "#ffb3ba",
  monochrome: "#525252",
  synthwave: "#00f0ff",
  artdeco: "#d4af37",
  blueprint: "#60a5fa",
  airy: "#38bdf8",
  terracotta: "#e07a5f",
  citrus: "#f4a261",
  parchment: "#8c2727",
  ledger: "#3b82f6",
  pulse: "#3b82f6",
  maximalist: "#3b82f6",
  synapse: "#2563eb",
};

const FALLBACK_ACCENT = "#3b82f6";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** All templates support accents. Kept for call-site compatibility. */
export function isAccentSupportedTemplate(_templateId: string): boolean {
  return true;
}

export function getTemplateDefaultAccent(templateId: string): string {
  const mapped = TEMPLATE_DEFAULT_ACCENTS[templateId];
  if (mapped) return mapped;

  const fromPreview = getTemplateProjectPreviewConfig(templateId)?.palette.primary;
  if (fromPreview && HEX_RE.test(fromPreview)) {
    return fromPreview;
  }

  return FALLBACK_ACCENT;
}

function normalizeHex(hex: string): string {
  return hex.toLowerCase();
}

function isSwatchColor(hex: string): boolean {
  const target = normalizeHex(hex);
  return ACCENT_SWATCHES.some((swatch) => normalizeHex(swatch.hex) === target);
}

/** True when `hex` is another template's stock default (likely carried over after a switch). */
function isForeignTemplateDefault(hex: string, templateId: string): boolean {
  const target = normalizeHex(hex);
  const currentDefault = normalizeHex(getTemplateDefaultAccent(templateId));
  if (target === currentDefault) return false;

  return Object.entries(TEMPLATE_DEFAULT_ACCENTS).some(
    ([id, value]) => id !== templateId && normalizeHex(value) === target,
  );
}

export function resolveAccentColor(
  templateId: string,
  customization?: PortfolioCustomization | null,
): string {
  const fallback = getTemplateDefaultAccent(templateId);
  const saved = customization?.primaryColor;

  if (typeof saved !== "string" || !HEX_RE.test(saved)) {
    return fallback;
  }

  // Explicit palette picks always win.
  if (isSwatchColor(saved)) {
    return saved;
  }

  // Drop accents left over from a previous template's stock default.
  if (isForeignTemplateDefault(saved, templateId)) {
    return fallback;
  }

  return saved;
}

/** Inline style to set the shared accent CSS variable on a template root. */
export function accentRootStyle(accent: string): {
  [key: string]: string;
} {
  return { "--lf-accent": accent };
}
