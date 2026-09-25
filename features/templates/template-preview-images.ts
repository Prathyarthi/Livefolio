/** Maps template ids to preview image filenames in `public/templates/`. */
const TEMPLATE_PREVIEW_FILES: Record<string, string> = {
  minimal: "minimal.webp",
  modern: "modern.webp",
  developer: "developer.webp",
  creative: "creative.webp",
  corporate: "corporate.webp",
  spotlight: "spotlight.webp",
  retro: "retro.webp",
  bento: "bento.webp",
  vibrant: "vibrant.webp",
  space: "space.webp",
  windows: "windows95.webp",
  paper: "paper.webp",
  cyberpunk: "cyberpunk.webp",
  pastel: "pasteldream.webp",
  monochrome: "monochrome.webp",
  synthwave: "synthwave.webp",
  artdeco: "artdeco.webp",
  blueprint: "blueprint.webp",
  airy: "airy.webp",
  terracotta: "terracotta.webp",
  citrus: "citrus.webp",
  parchment: "parchment.webp",
  ledger: "ledger.webp",
  pulse: "pulse.webp",
  maximalist: "maximalist.webp",
};

export function hasTemplatePreviewImage(templateId: string): boolean {
  return Boolean(TEMPLATE_PREVIEW_FILES[templateId]);
}

export function getTemplatePreviewImagePath(templateId: string): string {
  const file = TEMPLATE_PREVIEW_FILES[templateId];
  if (!file) return "";
  return `/templates/${file}`;
}
