"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  uploadStoredFile,
  UploadRequestError,
  getUploadUsage,
} from "@/features/uploads/api/client";
import { useUpdateOrganization } from "@/features/organization/api/use-organization";
import {
  MAX_ORG_BANNER_BYTES,
  MAX_ORG_LOGO_BYTES,
} from "@/lib/uploads";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg";

export function OrgBrandingImageField({
  orgSlug,
  orgId,
  kind,
  imageUrl,
  onImageUrlChange,
}: {
  orgSlug: string;
  orgId: string;
  kind: "org_logo" | "org_banner";
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const updateOrg = useUpdateOrganization(orgSlug);
  const [uploading, setUploading] = useState(false);
  const isBanner = kind === "org_banner";
  const maxBytes = isBanner ? MAX_ORG_BANNER_BYTES : MAX_ORG_LOGO_BYTES;
  const label = isBanner ? "Company banner" : "Company logo";
  const hint = isBanner
    ? "1600×400 recommended · JPEG, PNG, or WebP · up to 5MB"
    : "400×400 recommended · JPEG, PNG, or WebP · up to 2MB";

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > maxBytes) {
      toast.error(
        isBanner ? "Banner must be under 5MB" : "Logo must be under 2MB",
      );
      return;
    }

    const usage = await getUploadUsage().catch(() => null);
    if (usage && usage.configured === false) {
      toast.error("File storage is not configured.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadStoredFile({
        kind,
        file,
        orgId,
      });
      if (result.publicUrl) {
        onImageUrlChange(result.publicUrl);
        await queryClient.invalidateQueries({ queryKey: ["organizations"] });
        await queryClient.invalidateQueries({ queryKey: ["jobs"] });
        toast.success(`${isBanner ? "Banner" : "Logo"} uploaded`);
      }
    } catch (error) {
      toast.error(
        error instanceof UploadRequestError || error instanceof Error
          ? error.message
          : "Failed to upload image",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function clearImage() {
    try {
      await updateOrg.mutateAsync(
        isBanner ? { bannerUrl: null } : { logoUrl: null },
      );
      onImageUrlChange("");
      toast.success(`${isBanner ? "Banner" : "Logo"} removed`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove image",
      );
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-lg)] border-2 border-dashed border-border-default bg-surface-sunken/60",
          isBanner ? "aspect-[4/1] min-h-[140px]" : "aspect-square w-28",
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
            <ImageIcon className="h-6 w-6 text-text-muted" />
            <p className="text-sm font-medium text-text-primary">{label}</p>
            {!isBanner ? null : (
              <p className="hidden text-xs text-text-muted sm:block">{hint}</p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || updateOrg.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {imageUrl ? "Replace" : "Upload"}
        </Button>
        {imageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading || updateOrg.isPending}
            onClick={() => void clearImage()}
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-text-muted">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-label={`Upload ${label}`}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
