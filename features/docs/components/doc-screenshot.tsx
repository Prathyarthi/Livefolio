import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { DocInlineText } from "@/features/docs/components/doc-inline-text";
import type { DocScreenshot as DocScreenshotType } from "@/features/docs/types";
import { cn } from "@/lib/utils";

export function DocScreenshot({
  screenshot,
  className,
}: {
  screenshot: DocScreenshotType;
  className?: string;
}) {
  return (
    <figure className={cn("my-6", className)}>
      <div className="overflow-hidden rounded-xl border border-border-default bg-surface-sunken shadow-sm">
        {screenshot.available ? (
          <Image
            src={screenshot.src}
            alt={screenshot.alt}
            width={1440}
            height={900}
            sizes="(min-width: 1024px) 720px, 100vw"
            className="h-auto w-full"
          />
        ) : (
          <div
            className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-border-strong/60 p-6 text-center"
            data-screenshot-placeholder={screenshot.src}
          >
            <ImageIcon className="size-6 text-text-muted" aria-hidden />
            <p className="text-sm font-medium text-text-secondary">
              {screenshot.alt}
            </p>
            <p className="text-xs text-text-muted">Screenshot coming soon</p>
          </div>
        )}
      </div>
      {screenshot.caption ? (
        <figcaption className="mt-2 text-center text-xs text-text-muted">
          <DocInlineText text={screenshot.caption} />
        </figcaption>
      ) : null}
    </figure>
  );
}
