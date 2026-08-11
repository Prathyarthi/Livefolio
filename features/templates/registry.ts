import dynamic from "next/dynamic";
import type { TemplateComponent } from "./types";
import { getTemplatePreviewImagePath } from "./template-preview-images";

export const templateRegistry: Record<string, TemplateComponent> = {
  pulse: {
    id: "pulse",
    name: "Pulse",
    description:
      "Sophisticated dark developer portfolio with accent theming and interactive project cards.",
    previewImage: getTemplatePreviewImagePath("pulse"),
    category: "developer",
    component: dynamic(() => import("./pulse/pulse-template").then(m => ({ default: m.PulseTemplate }))),
  },
  modern: {
    id: "modern",
    name: "Modern",
    description:
      "Dark premium presentation with glass cards and product-style composition",
    previewImage: getTemplatePreviewImagePath("modern"),
    category: "general",
    component: dynamic(() => import("./modern/modern-template").then(m => ({ default: m.ModernTemplate }))),
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description:
      "Editorial, quiet, and typography-led for a refined personal brand",
    previewImage: getTemplatePreviewImagePath("minimal"),
    category: "general",
    component: dynamic(() => import("./minimal/minimal-template").then(m => ({ default: m.MinimalTemplate }))),
  },
  developer: {
    id: "developer",
    name: "Developer",
    description:
      "Terminal-inspired but polished for engineers who want proof and personality",
    previewImage: getTemplatePreviewImagePath("developer"),
    category: "developer",
    component: dynamic(() => import("./developer/developer-template")),
  },
  creative: {
    id: "creative",
    name: "Creative",
    description:
      "Expressive gallery-style layout built for visual work and standout projects",
    previewImage: getTemplatePreviewImagePath("creative"),
    category: "designer",
    component: dynamic(() => import("./creative/creative-template")),
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    description:
      "Executive, structured, and clean without feeling like a PDF export",
    previewImage: getTemplatePreviewImagePath("corporate"),
    category: "corporate",
    component: dynamic(() => import("./corporate/corporate-template").then(m => ({ default: m.CorporateTemplate }))),
  },
  spotlight: {
    id: "spotlight",
    name: "Spotlight",
    description:
      "Mint canvas (#fbfffe), Made Tommy type, and yellow-accent interactions.",
    previewImage: getTemplatePreviewImagePath("spotlight"),
    category: "developer",
    component: dynamic(() => import("./spotlight/spotlight-template").then(m => ({ default: m.SpotlightTemplate }))),
  },
  retro: {
    id: "retro",
    name: "Retro",
    description:
      "Bold neo-brutalism with thick borders, bright colors, and high contrast.",
    previewImage: getTemplatePreviewImagePath("retro"),
    category: "designer",
    component: dynamic(() => import("./retro/retro-template").then(m => ({ default: m.RetroTemplate }))),
  },
  bento: {
    id: "bento",
    name: "Bento",
    description:
      "Modern grid-based layout with a clean, premium, and highly scannable design.",
    previewImage: getTemplatePreviewImagePath("bento"),
    category: "general",
    component: dynamic(() => import("./bento/bento-template").then(m => ({ default: m.BentoTemplate }))),
  },
  vibrant: {
    id: "vibrant",
    name: "Vibrant",
    description:
      "Dark mode with glowing gradients, glassmorphism, and a highly modern feel.",
    previewImage: getTemplatePreviewImagePath("vibrant"),
    category: "designer",
    component: dynamic(() => import("./vibrant/vibrant-template").then(m => ({ default: m.VibrantTemplate }))),
  },
  space: {
    id: "space",
    name: "Space",
    description:
      "Deep space theme with glowing cyan and violet accents, perfect for futuristic portfolios.",
    previewImage: getTemplatePreviewImagePath("space"),
    category: "developer",
    component: dynamic(() => import("./space/space-template").then(m => ({ default: m.SpaceTemplate }))),
  },
  windows: {
    id: "windows",
    name: "Windows 95",
    description:
      "Nostalgic retro OS theme with classic window borders, teal backgrounds, and pixel-perfect details.",
    previewImage: getTemplatePreviewImagePath("windows"),
    category: "developer",
    component: dynamic(() => import("./windows/windows-template").then(m => ({ default: m.WindowsTemplate }))),
  },
  paper: {
    id: "paper",
    name: "Paper",
    description:
      "Elegant, editorial newspaper style with serif typography and clean lines.",
    previewImage: getTemplatePreviewImagePath("paper"),
    category: "general",
    component: dynamic(() => import("./paper/paper-template").then(m => ({ default: m.PaperTemplate }))),
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    description:
      "High-contrast neon hacker aesthetic with glitch effects and terminal vibes.",
    previewImage: getTemplatePreviewImagePath("cyberpunk"),
    category: "developer",
    component: dynamic(() => import("./cyberpunk/cyberpunk-template").then(m => ({ default: m.CyberpunkTemplate }))),
  },
  pastel: {
    id: "pastel",
    name: "Pastel Dream",
    description:
      "Soft, bubbly, and dreamy with pastel gradients and rounded shapes.",
    previewImage: getTemplatePreviewImagePath("pastel"),
    category: "designer",
    component: dynamic(() => import("./pastel/pastel-template").then(m => ({ default: m.PastelTemplate }))),
  },
  monochrome: {
    id: "monochrome",
    name: "Monochrome",
    description:
      "Strict black and white brutalist design with massive typography.",
    previewImage: getTemplatePreviewImagePath("monochrome"),
    category: "designer",
    component: dynamic(() => import("./monochrome/monochrome-template").then(m => ({ default: m.MonochromeTemplate }))),
  },
  synthwave: {
    id: "synthwave",
    name: "Synthwave",
    description:
      "80s retro-futuristic look with neon sunsets and perspective grids.",
    previewImage: getTemplatePreviewImagePath("synthwave"),
    category: "developer",
    component: dynamic(() => import("./synthwave/synthwave-template").then(m => ({ default: m.SynthwaveTemplate }))),
  },
  artdeco: {
    id: "artdeco",
    name: "Art Deco",
    description:
      "Luxury 1920s style with deep navy, gold accents, and geometric borders.",
    previewImage: getTemplatePreviewImagePath("artdeco"),
    category: "designer",
    component: dynamic(() => import("./artdeco/artdeco-template").then(m => ({ default: m.ArtDecoTemplate }))),
  },
  blueprint: {
    id: "blueprint",
    name: "Blueprint",
    description:
      "Technical drawing aesthetic with blueprint blue, grids, and monospace.",
    previewImage: getTemplatePreviewImagePath("blueprint"),
    category: "developer",
    component: dynamic(() => import("./blueprint/blueprint-template").then(m => ({ default: m.BlueprintTemplate }))),
  },
  airy: {
    id: "airy",
    name: "Airy",
    description: "Cloud-like, clean, soft shadows and sky blue accents.",
    previewImage: getTemplatePreviewImagePath("airy"),
    category: "general",
    component: dynamic(() => import("./airy/airy-template").then(m => ({ default: m.AiryTemplate }))),
  },
  terracotta: {
    id: "terracotta",
    name: "Terracotta",
    description: "Warm Mediterranean style with elegant serif fonts.",
    previewImage: getTemplatePreviewImagePath("terracotta"),
    category: "designer",
    component: dynamic(() => import("./terracotta/terracotta-template").then(m => ({ default: m.TerracottaTemplate }))),
  },
  citrus: {
    id: "citrus",
    name: "Citrus",
    description: "Energetic and fresh with vibrant orange and yellow accents.",
    previewImage: getTemplatePreviewImagePath("citrus"),
    category: "designer",
    component: dynamic(() => import("./citrus/citrus-template").then(m => ({ default: m.CitrusTemplate }))),
  },
  parchment: {
    id: "parchment",
    name: "Parchment",
    description: "Academic, historical layout with classic red accents.",
    previewImage: getTemplatePreviewImagePath("parchment"),
    category: "corporate",
    component: dynamic(() => import("./parchment/parchment-template").then(m => ({ default: m.ParchmentTemplate }))),
  },
  ledger: {
    id: "ledger",
    name: "Ledger",
    description:
      "Dark developer portfolio with searchable projects and a structured section layout.",
    previewImage: getTemplatePreviewImagePath("ledger"),
    category: "general",
    component: dynamic(() => import("./ledger/ledger-template").then(m => ({ default: m.LedgerTemplate }))),
  },
  maximalist: {
    id: "maximalist",
    name: "Maximalist",
    description:
      "Bold high-contrast developer portfolio with an interactive CLI terminal.",
    previewImage: getTemplatePreviewImagePath("maximalist"),
    category: "developer",
    component: dynamic(() => import("./maximalist/maximalist-template").then(m => ({ default: m.MaximalistTemplate }))),
  },
};

export function getTemplate(id: string): TemplateComponent {
  return templateRegistry[id] ?? templateRegistry["minimal"];
}
