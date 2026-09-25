"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/features/portfolio/components/field-label";
import {
  removeProfilePhoto,
  uploadStoredFile,
  UploadRequestError,
} from "@/features/uploads/api/client";
import { MAX_PROFILE_PHOTO_BYTES } from "@/lib/uploads";

const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg";
const INPUT_ID = "profile-photo-file";

export function ProfilePhotoField({
  imageUrl: savedImageUrl,
}: {
  imageUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [override, setOverride] = useState<string | null | undefined>(undefined);
  const imageUrl = override === undefined ? savedImageUrl : override;
  const busy = uploading || removing;

  // Refetching would re-run PortfolioForm's sync effect and wipe unsaved text edits.
  const markPortfolioStale = () =>
    queryClient.invalidateQueries({ queryKey: ["portfolio"], refetchType: "none" });

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      toast.error("Photo must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadStoredFile({ kind: "profile_photo", file });
      setOverride(result.publicUrl ?? null);
      await markPortfolioStale();
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(
        error instanceof UploadRequestError || error instanceof Error
          ? error.message
          : "Failed to upload photo",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await removeProfilePhoto();
      setOverride(null);
      await markPortfolioStale();
      toast.success("Profile photo removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove photo");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={INPUT_ID}>
        <UserRound className="h-4 w-4 text-muted-foreground" />
        Profile photo
      </FieldLabel>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Profile photo preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {imageUrl ? "Replace photo" : "Upload photo"}
            </Button>
            {imageUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void handleRemove()}
              >
                {removing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, or WebP up to 5MB. Shown on templates with a portrait
            (currently Veil).
          </p>
        </div>
      </div>
      <input
        id={INPUT_ID}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-label="Upload profile photo"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}