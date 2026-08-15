"use client";

import { useState } from "react";
import { getPreviewImage } from "@/lib/link-preview-code";
import { isLivePreviewEnabledForProject } from "@/lib/live-preview";
import { cn } from "@/lib/utils";
import {
  ProjectPreviewPlaceholderGraphic,
  type PreviewPlaceholderVariant,
} from "@/components/project-preview-placeholder-graphic";

interface LivePreviewImageProps {
  liveUrl?: string | null;
  imageUrl?: string | null;
  alt: string;
  projectId?: string;
  livePreviewProjectIds?: string[] | null;
  enabled?: boolean;
  className?: string;
  containerClassName?: string;
  placeholderClassName?: string;
  placeholderVariant?: PreviewPlaceholderVariant;
  templateId?: string;
  /** Overrides placeholder primary/accent when no live screenshot is shown. */
  accentColor?: string;
  loading?: "lazy" | "eager";
}

export function LivePreviewImage({
  liveUrl,
  imageUrl,
  alt,
  projectId,
  livePreviewProjectIds,
  enabled: enabledProp,
  className,
  containerClassName,
  placeholderClassName,
  placeholderVariant = "default",
  templateId,
  accentColor,
  loading = "lazy",
}: LivePreviewImageProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [liveFailed, setLiveFailed] = useState(false);

  const enabled =
    enabledProp ??
    (projectId
      ? isLivePreviewEnabledForProject(projectId, livePreviewProjectIds)
      : false);

  const liveSrc =
    enabled && Boolean(liveUrl?.trim()) && !liveFailed
      ? getPreviewImage(liveUrl!)
      : undefined;
  const customSrc =
    !liveSrc && imageUrl?.trim() && !imageFailed ? imageUrl.trim() : undefined;
  const src = liveSrc ?? customSrc;

  return (
    <div
      className={cn(
        "relative aspect-[8/5] w-full shrink-0 overflow-hidden bg-stone-900/20",
        containerClassName
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={loading}
          className={cn("block h-full w-full object-cover object-top", className)}
          onError={() => {
            if (liveSrc) setLiveFailed(true);
            else setImageFailed(true);
          }}
        />
      ) : (
        <ProjectPreviewPlaceholderGraphic
          title={alt}
          seedKey={projectId ?? alt}
          variant={placeholderVariant}
          templateId={templateId}
          accentColor={accentColor}
          className={placeholderClassName}
        />
      )}
    </div>
  );
}
