"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getTemplatePreviewImagePath } from "@/features/templates/template-preview-images";

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
    <div className={cn("aspect-4/3 bg-linear-to-br rounded-2xl p-3", gradient)}>
      <div className="h-full rounded-xl border border-white/20 bg-black/10 p-3">
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
    <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border-default bg-surface-sunken">
      <Image
        src={src}
        alt={template.alt}
        fill
        unoptimized
        className="object-cover object-top"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 280px"
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}

function ShowcaseCard({
  template,
}: {
  template: (typeof SHOWCASE_TEMPLATES)[number];
}) {
  return (
    <div className="group overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-surface-base shadow-[var(--shadow-card)] transition-all duration-200 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-modal)]">
      <div className="p-3">
        <TemplatePreview template={template} />
      </div>
      <p className="border-t border-border-default px-4 py-3 text-center text-sm font-medium text-text-primary">
        {template.name}
      </p>
    </div>
  );
}

export function TemplateShowcase() {
  return (
    <section
      id="showcase"
      className="scroll-mt-16 bg-surface-raised px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">Examples</p>
          <h2 className="mt-3 text-h1 text-text-primary">
            See what Livefolio creates
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            Real layouts generated from a resume. Same content, your choice of
            personality — with room to grow through integrations.
          </p>
        </div>

        <div className="mt-[var(--space-6)] grid grid-cols-1 gap-[var(--space-5)] sm:grid-cols-2 lg:grid-cols-4">
          {SHOWCASE_TEMPLATES.map((template) => (
            <ShowcaseCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </section>
  );
}
