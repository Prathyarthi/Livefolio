"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getTemplatePreviewImagePath } from "@/features/templates/template-preview-images";
import {
  StudioHeading,
  StudioSection,
} from "@/features/landing/components/studio-shell";

const SHOWCASE_TEMPLATES = [
  {
    id: "modern",
    name: "Modern",
    alt: "Modern portfolio layout",
    gradient: "from-violet-500/50 to-cyan-400/40",
  },
  {
    id: "retro",
    name: "Retro",
    alt: "Retro portfolio layout",
    gradient: "from-[#ff90e8]/80 to-[#ffc900]/80",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    alt: "Blueprint portfolio layout",
    gradient: "from-[#003366] to-[#002244]",
  },
  {
    id: "minimal",
    name: "Minimal",
    alt: "Minimal portfolio layout",
    gradient: "from-stone-100 to-stone-200",
  },
] as const;

function GradientPlaceholder({ gradient }: { gradient: string }) {
  return (
    <div className={cn("aspect-4/3 bg-linear-to-br rounded-[var(--radius-md)] p-3", gradient)}>
      <div className="h-full rounded-[var(--radius-sm)] border border-white/20 bg-black/10 p-3">
        <div className="h-3 w-24 rounded-full bg-white/40" />
        <div className="mt-4 h-16 rounded-2xl bg-white/15" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-16 rounded-2xl bg-white/15" />
          <div className="h-16 rounded-2xl bg-white/15" />
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({
  template,
}: {
  template: (typeof SHOWCASE_TEMPLATES)[number];
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = getTemplatePreviewImagePath(template.id);

  if (imageFailed) {
    return <GradientPlaceholder gradient={template.gradient} />;
  }

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface-sunken">
      <Image
        src={src}
        alt={template.alt}
        fill
        unoptimized
        className="object-cover object-top"
        sizes="(max-width: 640px) 100vw, 50vw"
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}

export function TemplateShowcase() {
  return (
    <StudioSection id="showcase">
      <StudioHeading
        eyebrow="Examples"
        title="See what Livefolio creates"
        description="Real layouts generated from a resume. Same content, your choice of personality, with room to grow through integrations."
      />

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SHOWCASE_TEMPLATES.map((template) => (
          <article
            key={template.id}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-raised transition-colors duration-200 hover:border-border-strong"
          >
            <div className="p-3">
              <TemplatePreview template={template} />
            </div>
            <p className="border-t border-dashed border-border-default/70 px-4 py-3 text-center text-sm font-medium text-text-primary">
              {template.name}
            </p>
          </article>
        ))}
      </div>
    </StudioSection>
  );
}
