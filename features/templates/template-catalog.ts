import type { TemplateMeta } from "./types";
import { getTemplatePreviewImagePath } from "./template-preview-images";
export const templateCatalog: Record<string, TemplateMeta> = {
  pulse: {
    id: "pulse",
    name: "Pulse",
    description:
      "Sophisticated dark developer portfolio with accent theming and interactive project cards.",
    previewImage: getTemplatePreviewImagePath("pulse"),
    category: "developer",
  },
  synapse: {
    id: "synapse",
    name: "Synapse",
    description:
      "Clean light-and-dark developer portfolio with a terminal hero, timelines, and project cards.",
    previewImage: getTemplatePreviewImagePath("synapse"),
    category: "developer",
  },
  modern: {
    id: "modern",
    name: "Modern",
    description:
      "Dark premium presentation with glass cards and product-style composition",
    previewImage: getTemplatePreviewImagePath("modern"),
    category: "general",
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description:
      "Editorial, quiet, and typography-led for a refined personal brand",
    previewImage: getTemplatePreviewImagePath("minimal"),
    category: "general",
  },
  developer: {
    id: "developer",
    name: "Developer",
    description:
      "Terminal-inspired but polished for engineers who want proof and personality",
    previewImage: getTemplatePreviewImagePath("developer"),
    category: "developer",
  },
  creative: {
    id: "creative",
    name: "Creative",
    description:
      "Expressive gallery-style layout built for visual work and standout projects",
    previewImage: getTemplatePreviewImagePath("creative"),
    category: "designer",
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    description:
      "Executive, structured, and clean without feeling like a PDF export",
    previewImage: getTemplatePreviewImagePath("corporate"),
    category: "corporate",
  },
  spotlight: {
    id: "spotlight",
    name: "Spotlight",
    description:
      "Mint canvas (#fbfffe), Made Tommy type, and yellow-accent interactions.",
    previewImage: getTemplatePreviewImagePath("spotlight"),
    category: "developer",
  },
  retro: {
    id: "retro",
    name: "Retro",
    description:
      "Bold neo-brutalism with thick borders, bright colors, and high contrast.",
    previewImage: getTemplatePreviewImagePath("retro"),
    category: "designer",
  },
  bento: {
    id: "bento",
    name: "Bento",
    description:
      "Modern grid-based layout with a clean, premium, and highly scannable design.",
    previewImage: getTemplatePreviewImagePath("bento"),
    category: "general",
  },
  vibrant: {
    id: "vibrant",
    name: "Vibrant",
    description:
      "Dark mode with glowing gradients, glassmorphism, and a highly modern feel.",
    previewImage: getTemplatePreviewImagePath("vibrant"),
    category: "designer",
  },
  space: {
    id: "space",
    name: "Space",
    description:
      "Deep space theme with glowing cyan and violet accents, perfect for futuristic portfolios.",
    previewImage: getTemplatePreviewImagePath("space"),
    category: "developer",
  },
  windows: {
    id: "windows",
    name: "Windows 95",
    description:
      "Nostalgic retro OS theme with classic window borders, teal backgrounds, and pixel-perfect details.",
    previewImage: getTemplatePreviewImagePath("windows"),
    category: "developer",
  },
  paper: {
    id: "paper",
    name: "Paper",
    description:
      "Elegant, editorial newspaper style with serif typography and clean lines.",
    previewImage: getTemplatePreviewImagePath("paper"),
    category: "general",
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    description:
      "High-contrast neon hacker aesthetic with glitch effects and terminal vibes.",
    previewImage: getTemplatePreviewImagePath("cyberpunk"),
    category: "developer",
  },
  pastel: {
    id: "pastel",
    name: "Pastel Dream",
    description:
      "Soft, bubbly, and dreamy with pastel gradients and rounded shapes.",
    previewImage: getTemplatePreviewImagePath("pastel"),
    category: "designer",
  },
  monochrome: {
    id: "monochrome",
    name: "Monochrome",
    description:
      "Strict black and white brutalist design with massive typography.",
    previewImage: getTemplatePreviewImagePath("monochrome"),
    category: "designer",
  },
  synthwave: {
    id: "synthwave",
    name: "Synthwave",
    description:
      "80s retro-futuristic look with neon sunsets and perspective grids.",
    previewImage: getTemplatePreviewImagePath("synthwave"),
    category: "developer",
  },
  artdeco: {
    id: "artdeco",
    name: "Art Deco",
    description:
      "Luxury 1920s style with deep navy, gold accents, and geometric borders.",
    previewImage: getTemplatePreviewImagePath("artdeco"),
    category: "designer",
  },
  blueprint: {
    id: "blueprint",
    name: "Blueprint",
    description:
      "Technical drawing aesthetic with blueprint blue, grids, and monospace.",
    previewImage: getTemplatePreviewImagePath("blueprint"),
    category: "developer",
  },
  airy: {
    id: "airy",
    name: "Airy",
    description: "Cloud-like, clean, soft shadows and sky blue accents.",
    previewImage: getTemplatePreviewImagePath("airy"),
    category: "general",
  },
  terracotta: {
    id: "terracotta",
    name: "Terracotta",
    description: "Warm Mediterranean style with elegant serif fonts.",
    previewImage: getTemplatePreviewImagePath("terracotta"),
    category: "designer",
  },
  citrus: {
    id: "citrus",
    name: "Citrus",
    description: "Energetic and fresh with vibrant orange and yellow accents.",
    previewImage: getTemplatePreviewImagePath("citrus"),
    category: "designer",
  },
  parchment: {
    id: "parchment",
    name: "Parchment",
    description: "Academic, historical layout with classic red accents.",
    previewImage: getTemplatePreviewImagePath("parchment"),
    category: "corporate",
  },
  ledger: {
    id: "ledger",
    name: "Ledger",
    description:
      "Dark developer portfolio with searchable projects and a structured section layout.",
    previewImage: getTemplatePreviewImagePath("ledger"),
    category: "general",
  },
  maximalist: {
    id: "maximalist",
    name: "Maximalist",
    description:
      "Bold high-contrast developer portfolio with an interactive CLI terminal.",
    previewImage: getTemplatePreviewImagePath("maximalist"),
    category: "developer",
  },
};

export const templateCatalogList: TemplateMeta[] = Object.values(templateCatalog);

export function getTemplateMeta(id: string): TemplateMeta {
  return templateCatalog[id] ?? templateCatalog.minimal;
}
