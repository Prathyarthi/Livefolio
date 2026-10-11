import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Failed to load image for cropping")),
    );
    image.src = src;
  });
}

export async function getCroppedImageFile(
  imageSrc: string,
  crop: Area,
  options: {
    fileName: string;
    mimeType?: string;
    maxWidth?: number;
    maxHeight?: number;
  },
): Promise<File> {
  const image = await loadImage(imageSrc);
  const mimeType = options.mimeType ?? "image/jpeg";
  const sourceWidth = Math.max(1, Math.round(crop.width));
  const sourceHeight = Math.max(1, Math.round(crop.height));

  let outputWidth = sourceWidth;
  let outputHeight = sourceHeight;
  if (options.maxWidth && outputWidth > options.maxWidth) {
    const scale = options.maxWidth / outputWidth;
    outputWidth = options.maxWidth;
    outputHeight = Math.max(1, Math.round(outputHeight * scale));
  }
  if (options.maxHeight && outputHeight > options.maxHeight) {
    const scale = options.maxHeight / outputHeight;
    outputHeight = options.maxHeight;
    outputWidth = Math.max(1, Math.round(outputWidth * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not crop image");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (!value) {
          reject(new Error("Could not create cropped image"));
          return;
        }
        resolve(value);
      },
      mimeType,
      0.92,
    );
  });

  const baseName = options.fileName.replace(/\.[^.]+$/, "") || "image";
  const extension = mimeType === "image/png" ? "png" : "jpg";
  return new File([blob], `${baseName}-cropped.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}