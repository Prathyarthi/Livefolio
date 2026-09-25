"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getTemplateMeta } from "@/features/templates/template-catalog";
import {
  getTemplatePreviewImagePath,
  hasTemplatePreviewImage,
} from "@/features/templates/template-preview-images";

const TEMPLATE_PREVIEW_GRADIENTS: Record<string, string> = {
  minimal: "from-stone-100 to-stone-200",
  modern: "from-violet-500/50 to-cyan-400/40",
  developer: "from-green-500/40 to-emerald-400/30",
  creative: "from-pink-500/40 to-orange-400/30",
  corporate: "from-sky-500/40 to-slate-300/30",
  spotlight: "from-[#fc3]/50 to-[#fbfffe]",
  retro: "from-[#ff90e8]/80 to-[#ffc900]/80",
  bento: "from-zinc-100 to-zinc-200",
  vibrant: "from-fuchsia-600/60 to-cyan-500/60",
  space: "from-[#030014] to-[#0B0F19]",
  windows: "from-[#3a6ea5] to-[#3a6ea5]",
  paper: "from-[#f4f1ea] to-[#e8e4db]",
  cyberpunk: "from-[#050505] to-[#050505]",
  pastel: "from-[#fff5f8] to-[#ffdfba]",
  monochrome: "from-white to-gray-100",
  synthwave: "from-[#120458] to-[#000000]",
  artdeco: "from-[#0b132b] to-[#111c3d]",
  blueprint: "from-[#003366] to-[#002244]",
  airy: "from-sky-100 to-slate-200",
  terracotta: "from-[#F4F1DE] to-[#E07A5F]/40",
  citrus: "from-[#FFE066]/60 to-[#264653]/30",
  parchment: "from-[#F4F1DE] to-[#8C2727]/20",
  synapse: "from-blue-500/40 to-indigo-400/30",
  pulse: "from-blue-500/40 to-slate-800",
  ledger: "from-slate-900 to-blue-500/40",
  maximalist: "from-black to-blue-500/50",
};

type TemplatePreviewThumbnailProps = {
  templateId: string;
  className?: string;
  compact?: boolean;
};

function GradientPlaceholder({
  templateId,
  compact,
}: {
  templateId: string;
  compact: boolean;
}) {
  const gradient =
    TEMPLATE_PREVIEW_GRADIENTS[templateId] ?? TEMPLATE_PREVIEW_GRADIENTS.minimal;

  return (
    <div
      className={cn(
        "aspect-4/3 bg-linear-to-br",
        compact ? "rounded-xl p-2" : "rounded-2xl p-3",
        gradient
      )}
    >
      <div
        className={cn(
          "h-full border border-white/20 bg-black/10",
          compact ? "rounded-lg p-2" : "rounded-xl p-3"
        )}
      >
        <div
          className={cn(
            "rounded-full bg-white/40",
            compact ? "h-2 w-12" : "h-3 w-24"
          )}
        />
        <div
          className={cn(
            "rounded-2xl bg-white/15",
            compact ? "mt-2 h-8" : "mt-4 h-16"
          )}
        />
        <div
          className={cn(
            "grid grid-cols-2",
            compact ? "mt-2 gap-1.5" : "mt-4 gap-3"
          )}
        >
          <div
            className={cn(
              "rounded-2xl bg-white/15",
              compact ? "h-8" : "h-16"
            )}
          />
          <div
            className={cn(
              "rounded-2xl bg-white/15",
              compact ? "h-8" : "h-16"
            )}
          />
        </div>
      </div>
    </div>
  );
}

export function TemplatePreviewThumbnail({
  templateId,
  className,
  compact = false,
}: TemplatePreviewThumbnailProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const template = getTemplateMeta(templateId);
  const src = getTemplatePreviewImagePath(templateId);

  if (imageFailed || !hasTemplatePreviewImage(templateId) || !src) {
    return (
      <GradientPlaceholder templateId={templateId} compact={compact} />
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-4/3 overflow-hidden border border-border-default/60 bg-surface-sunken",
        compact ? "rounded-xl" : "rounded-2xl",
        className
      )}
    >
      <Image
        src={src}
        alt={`${template.name} template preview`}
        fill
        className="object-cover object-top"
        sizes={compact ? "120px" : "(max-width: 768px) 100vw, 320px"}
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}
