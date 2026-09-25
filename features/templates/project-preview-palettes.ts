export type PreviewPlaceholderVariant =
  | "default"
  | "retro"
  | "dark"
  | "minimal";

export type ProjectPreviewPalette = {
  bg: string;
  bgAlt: string;
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  muted: string;
  stroke: string;
};

export type TemplateProjectPreviewConfig = {
  palette: ProjectPreviewPalette;
  variant: PreviewPlaceholderVariant;
};

const RETRO: ProjectPreviewPalette = {
  bg: "#ffc900",
  bgAlt: "#ff90e8",
  primary: "#ff90e8",
  secondary: "#80ffdb",
  accent: "#ffffff",
  surface: "#ffffff",
  muted: "#ffc900",
  stroke: "#000000",
};

const MINIMAL: ProjectPreviewPalette = {
  bg: "#fafaf9",
  bgAlt: "#f5f5f4",
  primary: "#78716c",
  secondary: "#a8a29e",
  accent: "#d6d3d1",
  surface: "#ffffff",
  muted: "#e7e5e4",
  stroke: "#d6d3d1",
};

/** Palettes aligned with each portfolio template's real colors. */
export const TEMPLATE_PROJECT_PREVIEW: Record<string, TemplateProjectPreviewConfig> = {
  minimal: { palette: MINIMAL, variant: "minimal" },
  modern: {
    palette: {
      bg: "#060816",
      bgAlt: "#0a0c18",
      primary: "#8b5cf6",
      secondary: "#22d3ee",
      accent: "#a78bfa",
      surface: "#12141f",
      muted: "#52525b",
      stroke: "rgba(255,255,255,0.12)",
    },
    variant: "dark",
  },
  developer: {
    palette: {
      bg: "#030712",
      bgAlt: "#0a1610",
      primary: "#22c55e",
      secondary: "#16a34a",
      accent: "#4ade80",
      surface: "#111827",
      muted: "#374151",
      stroke: "#1f2937",
    },
    variant: "dark",
  },
  creative: {
    palette: {
      bg: "#fffaf7",
      bgAlt: "#ffe4e6",
      primary: "#fb7185",
      secondary: "#fda4af",
      accent: "#ffedd5",
      surface: "#ffffff",
      muted: "#fecdd3",
      stroke: "#fecdd3",
    },
    variant: "default",
  },
  corporate: {
    palette: {
      bg: "#f3f6fb",
      bgAlt: "#dbeafe",
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#93c5fd",
      surface: "#ffffff",
      muted: "#cbd5e1",
      stroke: "#e2e8f0",
    },
    variant: "default",
  },
  spotlight: {
    palette: {
      bg: "#fbfffe",
      bgAlt: "#fff3b0",
      primary: "#facc15",
      secondary: "#fde047",
      accent: "#bbf7d0",
      surface: "#ffffff",
      muted: "#e5e7eb",
      stroke: "#e5e7eb",
    },
    variant: "default",
  },
  retro: { palette: RETRO, variant: "retro" },
  bento: {
    palette: {
      bg: "#fafafa",
      bgAlt: "#ede9fe",
      primary: "#a78bfa",
      secondary: "#93c5fd",
      accent: "#fef3c7",
      surface: "#ffffff",
      muted: "#e4e4e7",
      stroke: "#e4e4e7",
    },
    variant: "default",
  },
  vibrant: {
    palette: {
      bg: "#020617",
      bgAlt: "#1e293b",
      primary: "#c026d3",
      secondary: "#06b6d4",
      accent: "#8b5cf6",
      surface: "#0f172a",
      muted: "#334155",
      stroke: "#475569",
    },
    variant: "dark",
  },
  space: {
    palette: {
      bg: "#030014",
      bgAlt: "#0b0f19",
      primary: "#06b6d4",
      secondary: "#8b5cf6",
      accent: "#22d3ee",
      surface: "#111827",
      muted: "#334155",
      stroke: "#1e293b",
    },
    variant: "dark",
  },
  windows: {
    palette: {
      bg: "#c0c0c0",
      bgAlt: "#ffffff",
      primary: "#000080",
      secondary: "#808080",
      accent: "#c0c0c0",
      surface: "#ffffff",
      muted: "#c0c0c0",
      stroke: "#000000",
    },
    variant: "default",
  },
  paper: {
    palette: {
      bg: "#f4f1ea",
      bgAlt: "#e8e4db",
      primary: "#2c2c2c",
      secondary: "#78716c",
      accent: "#d6d3d1",
      surface: "#fffdf8",
      muted: "#d6d3d1",
      stroke: "#d6d3d1",
    },
    variant: "minimal",
  },
  cyberpunk: {
    palette: {
      bg: "#050505",
      bgAlt: "#0a0a0a",
      primary: "#00ff00",
      secondary: "#ff00ff",
      accent: "#00ffff",
      surface: "#0a0a0a",
      muted: "#1a1a1a",
      stroke: "#00ff00",
    },
    variant: "dark",
  },
  pastel: {
    palette: {
      bg: "#fff5f8",
      bgAlt: "#bae1ff",
      primary: "#ffb3ba",
      secondary: "#ffdfba",
      accent: "#bae1ff",
      surface: "#ffffff",
      muted: "#e8e5df",
      stroke: "#ffb3ba",
    },
    variant: "default",
  },
  monochrome: {
    palette: {
      bg: "#ffffff",
      bgAlt: "#f5f5f5",
      primary: "#000000",
      secondary: "#525252",
      accent: "#a3a3a3",
      surface: "#ffffff",
      muted: "#d4d4d4",
      stroke: "#000000",
    },
    variant: "minimal",
  },
  synthwave: {
    palette: {
      bg: "#0d0221",
      bgAlt: "#1a0b2e",
      primary: "#00f0ff",
      secondary: "#ff007f",
      accent: "#ff7700",
      surface: "#1a0b2e",
      muted: "#26004c",
      stroke: "#ff007f",
    },
    variant: "dark",
  },
  artdeco: {
    palette: {
      bg: "#0b132b",
      bgAlt: "#111c3d",
      primary: "#d4af37",
      secondary: "#e5c76b",
      accent: "#1a2744",
      surface: "#111c3d",
      muted: "#2a3a5c",
      stroke: "#d4af37",
    },
    variant: "dark",
  },
  blueprint: {
    palette: {
      bg: "#003366",
      bgAlt: "#002244",
      primary: "#ffffff",
      secondary: "#94a3b8",
      accent: "#60a5fa",
      surface: "#002a55",
      muted: "#1e3a5f",
      stroke: "rgba(255,255,255,0.3)",
    },
    variant: "dark",
  },
  airy: {
    palette: {
      bg: "#f8fafc",
      bgAlt: "#dbeafe",
      primary: "#38bdf8",
      secondary: "#7dd3fc",
      accent: "#e0f2fe",
      surface: "#ffffff",
      muted: "#cbd5e1",
      stroke: "#e2e8f0",
    },
    variant: "default",
  },
  terracotta: {
    palette: {
      bg: "#fdfbf7",
      bgAlt: "#f4f1de",
      primary: "#e07a5f",
      secondary: "#3d405b",
      accent: "#f4f1de",
      surface: "#ffffff",
      muted: "#e7e5e4",
      stroke: "#e07a5f",
    },
    variant: "default",
  },
  citrus: {
    palette: {
      bg: "#fffcf2",
      bgAlt: "#ffe066",
      primary: "#f4a261",
      secondary: "#264653",
      accent: "#e9c46a",
      surface: "#ffffff",
      muted: "#fde68a",
      stroke: "#f4a261",
    },
    variant: "default",
  },
  parchment: {
    palette: {
      bg: "#f1eedc",
      bgAlt: "#e8dcc8",
      primary: "#8c2727",
      secondary: "#d4c4a8",
      accent: "#8c2727",
      surface: "#fffaf3",
      muted: "#d4c4a8",
      stroke: "#8c2727",
    },
    variant: "default",
  },
  ledger: {
    palette: {
      bg: "#0a0c10",
      bgAlt: "#111418",
      primary: "#3b82f6",
      secondary: "#60a5fa",
      accent: "#22d3ee",
      surface: "#111827",
      muted: "#334155",
      stroke: "#1e293b",
    },
    variant: "dark",
  },
  pulse: {
    palette: {
      bg: "#0a0a0a",
      bgAlt: "#111111",
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#10b981",
      surface: "#171717",
      muted: "#262626",
      stroke: "rgba(255,255,255,0.1)",
    },
    variant: "dark",
  },
  maximalist: {
    palette: {
      bg: "#0a0a0b",
      bgAlt: "#000000",
      primary: "#3b82f6",
      secondary: "#ffffff",
      accent: "#60a5fa",
      surface: "#111111",
      muted: "#334155",
      stroke: "#ffffff",
    },
    variant: "dark",
  },
  synapse: {
    palette: {
      bg: "#ffffff",
      bgAlt: "#f8fafc",
      primary: "#2563eb",
      secondary: "#6366f1",
      accent: "#93c5fd",
      surface: "#ffffff",
      muted: "#e2e8f0",
      stroke: "#e2e8f0",
    },
    variant: "default",
  },
  bluish: {
    palette: {
      bg: "#0a0a0a",
      bgAlt: "#111111",
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#10b981",
      surface: "#171717",
      muted: "#262626",
      stroke: "rgba(255,255,255,0.1)",
    },
    variant: "dark",
  },
};

export function getTemplateProjectPreviewConfig(
  templateId?: string
): TemplateProjectPreviewConfig | undefined {
  if (!templateId) return undefined;
  return TEMPLATE_PROJECT_PREVIEW[templateId];
}
