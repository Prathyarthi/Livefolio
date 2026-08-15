"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { extractPdfText, UploadRequestError } from "@/features/uploads/api/client";

export function PdfExtractField({
  label = "Upload JD (PDF)",
  hint = "We’ll fill the description from the PDF. You can still edit it.",
  onExtracted,
}: {
  label?: string;
  hint?: string;
  onExtracted: (text: string, file: File) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPending(true);
    try {
      const text = await extractPdfText(file);
      await onExtracted(text, file);
      toast.success("Description filled from the PDF. You can still edit it.");
    } catch (error) {
      toast.error(
        error instanceof UploadRequestError || error instanceof Error
          ? error.message
          : "Failed to read PDF",
      );
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {label}
        </Button>
        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
          <FileText className="h-3.5 w-3.5" />
          PDF, up to 10MB
        </span>
      </div>
      <p className="text-xs text-text-muted">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        aria-label={label}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
