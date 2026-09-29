import { ModernTemplate } from "./modern/modern-template";
import { MinimalTemplate } from "./minimal/minimal-template";
import DeveloperTemplate from "./developer/developer-template";
import CreativeTemplate from "./creative/creative-template";
import { CorporateTemplate } from "./corporate/corporate-template";
import { SpotlightTemplate } from "./spotlight/spotlight-template";
import { RetroTemplate } from "./retro/retro-template";
import { BentoTemplate } from "./bento/bento-template";
import { VibrantTemplate } from "./vibrant/vibrant-template";
import { SpaceTemplate } from "./space/space-template";
import { WindowsTemplate } from "./windows/windows-template";
import { PaperTemplate } from "./paper/paper-template";
import { CyberpunkTemplate } from "./cyberpunk/cyberpunk-template";
import { PastelTemplate } from "./pastel/pastel-template";
import { MonochromeTemplate } from "./monochrome/monochrome-template";
import { SynthwaveTemplate } from "./synthwave/synthwave-template";
import { ArtDecoTemplate } from "./artdeco/artdeco-template";
import { BlueprintTemplate } from "./blueprint/blueprint-template";
import { AiryTemplate } from "./airy/airy-template";
import { TerracottaTemplate } from "./terracotta/terracotta-template";
import { CitrusTemplate } from "./citrus/citrus-template";
import { ParchmentTemplate } from "./parchment/parchment-template";
import { LedgerTemplate } from "./ledger/ledger-template";
import { PulseTemplate } from "./pulse/pulse-template";
import { MaximalistTemplate } from "./maximalist/maximalist-template";
import { VeilTemplate } from "./veil/veil-template";
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
    component: PulseTemplate,
  },
  modern: {
    id: "modern",
    name: "Modern",
    description:
      "Dark premium presentation with glass cards and product-style composition",
    previewImage: getTemplatePreviewImagePath("modern"),
    category: "general",
    component: ModernTemplate,
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description:
      "Editorial, quiet, and typography-led for a refined personal brand",
    previewImage: getTemplatePreviewImagePath("minimal"),
    category: "general",
    component: MinimalTemplate,
  },
  developer: {
    id: "developer",
    name: "Developer",
    description:
      "Terminal-inspired but polished for engineers who want proof and personality",
    previewImage: getTemplatePreviewImagePath("developer"),
    category: "developer",
    component: DeveloperTemplate,
  },
  creative: {
    id: "creative",
    name: "Creative",
    description:
      "Expressive gallery-style layout built for visual work and standout projects",
    previewImage: getTemplatePreviewImagePath("creative"),
    category: "designer",
    component: CreativeTemplate,
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    description:
      "Executive, structured, and clean without feeling like a PDF export",
    previewImage: getTemplatePreviewImagePath("corporate"),
    category: "corporate",
    component: CorporateTemplate,
  },
  spotlight: {
    id: "spotlight",
    name: "Spotlight",
    description:
      "Mint canvas (#fbfffe), Made Tommy type, and yellow-accent interactions.",
    previewImage: getTemplatePreviewImagePath("spotlight"),
    category: "developer",
    component: SpotlightTemplate,
  },
  retro: {
    id: "retro",
    name: "Retro",
    description:
      "Bold neo-brutalism with thick borders, bright colors, and high contrast.",
    previewImage: getTemplatePreviewImagePath("retro"),
    category: "designer",
    component: RetroTemplate,
  },
  bento: {
    id: "bento",
    name: "Bento",
    description:
      "Modern grid-based layout with a clean, premium, and highly scannable design.",
    previewImage: getTemplatePreviewImagePath("bento"),
    category: "general",
    component: BentoTemplate,
  },
  vibrant: {
    id: "vibrant",
    name: "Vibrant",
    description:
      "Dark mode with glowing gradients, glassmorphism, and a highly modern feel.",
    previewImage: getTemplatePreviewImagePath("vibrant"),
    category: "designer",
    component: VibrantTemplate,
  },
  space: {
    id: "space",
    name: "Space",
    description:
      "Deep space theme with glowing cyan and violet accents, perfect for futuristic portfolios.",
    previewImage: getTemplatePreviewImagePath("space"),
    category: "developer",
    component: SpaceTemplate,
  },
  windows: {
    id: "windows",
    name: "Windows 95",
    description:
      "Nostalgic retro OS theme with classic window borders, teal backgrounds, and pixel-perfect details.",
    previewImage: getTemplatePreviewImagePath("windows"),
    category: "developer",
    component: WindowsTemplate,
  },
  paper: {
    id: "paper",
    name: "Paper",
    description:
      "Elegant, editorial newspaper style with serif typography and clean lines.",
    previewImage: getTemplatePreviewImagePath("paper"),
    category: "general",
    component: PaperTemplate,
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    description:
      "High-contrast neon hacker aesthetic with glitch effects and terminal vibes.",
    previewImage: getTemplatePreviewImagePath("cyberpunk"),
    category: "developer",
    component: CyberpunkTemplate,
  },
  pastel: {
    id: "pastel",
    name: "Pastel Dream",
    description:
      "Soft, bubbly, and dreamy with pastel gradients and rounded shapes.",
    previewImage: getTemplatePreviewImagePath("pastel"),
    category: "designer",
    component: PastelTemplate,
  },
  monochrome: {
    id: "monochrome",
    name: "Monochrome",
    description:
      "Strict black and white brutalist design with massive typography.",
    previewImage: getTemplatePreviewImagePath("monochrome"),
    category: "designer",
    component: MonochromeTemplate,
  },
  synthwave: {
    id: "synthwave",
    name: "Synthwave",
    description:
      "80s retro-futuristic look with neon sunsets and perspective grids.",
    previewImage: getTemplatePreviewImagePath("synthwave"),
    category: "developer",
    component: SynthwaveTemplate,
  },
  artdeco: {
    id: "artdeco",
    name: "Art Deco",
    description:
      "Luxury 1920s style with deep navy, gold accents, and geometric borders.",
    previewImage: getTemplatePreviewImagePath("artdeco"),
    category: "designer",
    component: ArtDecoTemplate,
  },
  blueprint: {
    id: "blueprint",
    name: "Blueprint",
    description:
      "Technical drawing aesthetic with blueprint blue, grids, and monospace.",
    previewImage: getTemplatePreviewImagePath("blueprint"),
    category: "developer",
    component: BlueprintTemplate,
  },
  airy: {
    id: "airy",
    name: "Airy",
    description: "Cloud-like, clean, soft shadows and sky blue accents.",
    previewImage: getTemplatePreviewImagePath("airy"),
    category: "general",
    component: AiryTemplate,
  },
  terracotta: {
    id: "terracotta",
    name: "Terracotta",
    description: "Warm Mediterranean style with elegant serif fonts.",
    previewImage: getTemplatePreviewImagePath("terracotta"),
    category: "designer",
    component: TerracottaTemplate,
  },
  citrus: {
    id: "citrus",
    name: "Citrus",
    description: "Energetic and fresh with vibrant orange and yellow accents.",
    previewImage: getTemplatePreviewImagePath("citrus"),
    category: "designer",
    component: CitrusTemplate,
  },
  parchment: {
    id: "parchment",
    name: "Parchment",
    description: "Academic, historical layout with classic red accents.",
    previewImage: getTemplatePreviewImagePath("parchment"),
    category: "corporate",
    component: ParchmentTemplate,
  },
  ledger: {
    id: "ledger",
    name: "Ledger",
    description:
      "Dark developer portfolio with searchable projects and a structured section layout.",
    previewImage: getTemplatePreviewImagePath("ledger"),
    category: "general",
    component: LedgerTemplate,
  },
  maximalist: {
    id: "maximalist",
    name: "Maximalist",
    description:
      "Bold high-contrast developer portfolio with an interactive CLI terminal.",
    previewImage: getTemplatePreviewImagePath("maximalist"),
    category: "developer",
    component: MaximalistTemplate,
  },
  veil: {
    id: "veil",
    name: "Veil",
    description:
      "Editorial dark portfolio with a 1-bit dithered portrait that develops into full colour under the cursor.",
    previewImage: getTemplatePreviewImagePath("veil"),
    category: "designer",
    component: VeilTemplate,
  },
};

export function getTemplate(id: string): TemplateComponent {
  return templateRegistry[id] ?? templateRegistry["minimal"];
}
