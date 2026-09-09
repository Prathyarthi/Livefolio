"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/features/portfolio/components/field-label";
import {
  getUploadUsage,
  uploadStoredFile,
  UploadRequestError,
} from "@/features/uploads/api/client";
import { MAX_PROJECT_THUMB_BYTES } from "@/lib/uploads";

const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg";

export function ProjectThumbnailField({
  projectId,
  imageUrl,
  unsaved,
  usage,
  storageConfigured,
  livePreviewEnabled = false,
  hideLabel = false,
  onImageUrlChange,
  onPendingFileChange,
  onUsageChange,
}: {
  projectId?: string;
  imageUrl: string;
  unsaved?: boolean;
  usage: { used: number; max: number } | null;
  storageConfigured: boolean | null;
  livePreviewEnabled?: boolean;
  hideLabel?: boolean;
  onImageUrlChange: (url: string) => void;
  onPendingFileChange?: (file: File | null) => void;
  onUsageChange?: (usage: { used: number; max: number }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const atCap =
    Boolean(usage) &&
    usage!.used >= usage!.max &&
    !imageUrl.trim();
  const uploadDisabled = uploading || atCap || livePreviewEnabled;

  async function handleFile(file: File | undefined) {
    if (!file || livePreviewEnabled) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > MAX_PROJECT_THUMB_BYTES) {
      toast.error("Thumbnail must be under 2MB");
      return;
    }

    if (!projectId) {
      onPendingFileChange?.(file);
      onImageUrlChange(URL.createObjectURL(file));
      return;
    }

    if (storageConfigured === false) {
      toast.error("File storage is not configured.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadStoredFile({
        kind: "project_thumb",
        file,
        projectId,
      });
      if (result.publicUrl) onImageUrlChange(result.publicUrl);
      if (result.usage) onUsageChange?.(result.usage);
      else {
        const next = await getUploadUsage().catch(() => null);
        if (next) onUsageChange?.(next.projectThumbnails);
      }
      toast.success("Thumbnail uploaded");
    } catch (error) {
      toast.error(
        error instanceof UploadRequestError || error instanceof Error
          ? error.message
          : "Failed to upload thumbnail",
        error instanceof UploadRequestError && error.upgradeRequired
          ? {
              action: {
                label: "Upgrade",
                onClick: () => {
                  router.push("/dashboard/billing");
                },
              },
            }
          : undefined,
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clearImage() {
    onPendingFileChange?.(null);
    onImageUrlChange("");
  }

  const inputId = `proj-thumbnail-file-${projectId ?? "new"}`;

  return (
    <div className="space-y-2">
      {hideLabel ? null : (
        <FieldLabel htmlFor={inputId} unsaved={unsaved}>
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          Thumbnail
        </FieldLabel>
      )}
      {imageUrl && !livePreviewEnabled ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Project thumbnail preview"
          className="h-28 w-full rounded-md object-cover object-top bg-muted"
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploadDisabled}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {imageUrl ? "Replace image" : "Upload image"}
        </Button>
        {imageUrl && !livePreviewEnabled ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearImage}>
            <X className="h-4 w-4" />
            Remove
          </Button>
        ) : null}
      </div>
      {livePreviewEnabled ? (
        <p className="text-xs text-muted-foreground">
          Live preview is on, so this project uses a screenshot of the live URL.
          Turn live preview off to upload a thumbnail instead.
        </p>
      ) : null}
      {usage && !livePreviewEnabled && !hideLabel ? (
        <p className="text-xs text-muted-foreground">
          {usage.used} of {usage.max} uploaded thumbnails used
          {usage.used >= usage.max ? (
            <>
              {" · "}
              <Link href="/dashboard/billing" className="underline">
                Upgrade for more
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-label="Upload project thumbnail"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}