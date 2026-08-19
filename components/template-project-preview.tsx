"use client";

import { LivePreviewImage } from "@/components/live-preview-image";
import { getTemplateProjectPreviewConfig } from "@/features/templates/project-preview-palettes";

export type TemplateProjectPreviewProps = {
  templateId: string;
  liveUrl?: string | null;
  imageUrl?: string | null;
  alt: string;
  projectId?: string;
  livePreviewProjectIds?: string[] | null;
  enabled?: boolean;
  className?: string;
  containerClassName?: string;
  placeholderClassName?: string;
  /** Overrides placeholder primary/accent to match the portfolio accent picker. */
  accentColor?: string;
  loading?: "lazy" | "eager";
};

/**
 * Shared project preview for all portfolio templates.
 * Shows a live screenshot when enabled, then a stored thumbnail, then a
 * themed placeholder whose colors match the template via `project-preview-palettes`.
 */
export function TemplateProjectPreview({
  templateId,
  placeholderClassName,
  accentColor,
  ...props
}: TemplateProjectPreviewProps) {
  const config = getTemplateProjectPreviewConfig(templateId);

  return (
    <LivePreviewImage
      {...props}
      templateId={templateId}
      placeholderVariant={config?.variant ?? "default"}
      placeholderClassName={placeholderClassName}
      accentColor={accentColor}
    />
  );
}
