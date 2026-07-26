export const CLICK_TYPES = [
  "project_live",
  "project_source",
  "article",
  "social",
  "custom",
  "outbound",
] as const;

export type ClickType = (typeof CLICK_TYPES)[number];

export const CLICK_TYPE_LABELS: Record<ClickType, string> = {
  project_live: "Project live",
  project_source: "Project source",
  article: "Article",
  social: "Social",
  custom: "Custom link",
  outbound: "Other link",
};

export function isClickType(value: unknown): value is ClickType {
  return typeof value === "string" && (CLICK_TYPES as readonly string[]).includes(value);
}

export const MAX_CLICK_LABEL_CHARS = 160;
export const MAX_CLICK_URL_CHARS = 2048;
