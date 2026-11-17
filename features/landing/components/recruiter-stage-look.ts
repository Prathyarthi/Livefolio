"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Livefolio's look for every faux-UI stage on the recruiters page. */
const LIGHT = {
  "--ss-font": "var(--font-source-sans), ui-sans-serif, system-ui, sans-serif",
  "--ss-canvas": "#f6f5f3",
  "--ss-chrome": "#ffffff",
  "--ss-surface": "#ffffff",
  "--ss-raised": "#ffffff",
  "--ss-line": "#ebe9e6",
  "--ss-text-strong": "#1a1828",
  "--ss-text": "#5e5a6e",
  "--ss-text-faint": "#8a8696",
  "--ss-icon": "#6b6878",
  "--ss-radius-window": "14px",
} as const;

const DARK = {
  ...LIGHT,
  "--ss-canvas": "#141312",
  "--ss-chrome": "#1a1917",
  "--ss-surface": "#1a1917",
  "--ss-raised": "#23211e",
  "--ss-line": "#2c2a26",
  "--ss-text-strong": "#f4f1ea",
  "--ss-text": "#b0a99f",
  "--ss-text-faint": "#8f877d",
  "--ss-icon": "#b0a99f",
} as const;

export const STAGE_ACCENT = "#e86a5a";

/** Theme and tokens for a Stage, following the site's light/dark toggle after mount. */
export function useRecruiterStageLook() {
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const dark = hydrated && resolvedTheme === "dark";
  return {
    theme: dark ? ("dark" as const) : ("light" as const),
    tokens: dark ? DARK : LIGHT,
    accent: STAGE_ACCENT,
  };
}
