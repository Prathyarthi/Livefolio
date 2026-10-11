"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getCroppedImageFile } from "@/features/uploads/lib/crop-image";

type ImageCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  title: string;
  description?: string;
  aspect: number;
  outputMaxWidth: number;
  outputMaxHeight: number;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

export function ImageCropDialog({
  open,
  imageSrc,
  title,
  description = "Drag to reposition. Use zoom to frame the area you want.",
  aspect,
  outputMaxWidth,
  outputMaxHeight,
  confirmLabel = "Use selection",
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [open, imageSrc]);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, pixels: Area) => {
      setCroppedAreaPixels(pixels);
    },
    [],
  );

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, {
        fileName: "upload.jpg",
        mimeType: "image/jpeg",
        maxWidth: outputMaxWidth,
        maxHeight: outputMaxHeight,
      });
      await onConfirm(file);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onCancel();
      }}
    >
      <DialogContent
        className="sm:max-w-2xl"
        showCloseButton={!busy}
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative h-72 overflow-hidden rounded-[var(--radius-lg)] bg-black/90 sm:h-80">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              objectFit="contain"
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-crop-zoom">Zoom</Label>
          <input
            id="image-crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            disabled={busy}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[var(--color-brand-primary,#2563eb)]"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !croppedAreaPixels}
            onClick={() => void handleConfirm()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}