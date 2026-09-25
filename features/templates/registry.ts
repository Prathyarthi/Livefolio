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
import { SynapseTemplate } from "./synapse/synapse-template";
import type { TemplateComponent } from "./types";
import { templateCatalog } from "./template-catalog";

const TEMPLATE_COMPONENTS: Record<
  string,
  TemplateComponent["component"]
> = {
  pulse: PulseTemplate,
  synapse: SynapseTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  developer: DeveloperTemplate,
  creative: CreativeTemplate,
  corporate: CorporateTemplate,
  spotlight: SpotlightTemplate,
  retro: RetroTemplate,
  bento: BentoTemplate,
  vibrant: VibrantTemplate,
  space: SpaceTemplate,
  windows: WindowsTemplate,
  paper: PaperTemplate,
  cyberpunk: CyberpunkTemplate,
  pastel: PastelTemplate,
  monochrome: MonochromeTemplate,
  synthwave: SynthwaveTemplate,
  artdeco: ArtDecoTemplate,
  blueprint: BlueprintTemplate,
  airy: AiryTemplate,
  terracotta: TerracottaTemplate,
  citrus: CitrusTemplate,
  parchment: ParchmentTemplate,
  ledger: LedgerTemplate,
  maximalist: MaximalistTemplate,
};

export const templateRegistry: Record<string, TemplateComponent> =
  Object.fromEntries(
    Object.entries(templateCatalog).map(([id, meta]) => [
      id,
      {
        ...meta,
        component: TEMPLATE_COMPONENTS[id] ?? MinimalTemplate,
      },
    ]),
  );

export function getTemplate(id: string): TemplateComponent {
  return templateRegistry[id] ?? templateRegistry["minimal"];
}
