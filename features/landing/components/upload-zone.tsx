"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "idle" | "uploading" | "done";

const ACCEPTED = [".pdf"];
const MAX_MB = 10;

/**
 * Foliofy's signature interaction — drop a resume to start.
 * On the landing page this previews the flow then sends the user to sign-up
 * with the chosen file remembered.
 */
export function UploadZone({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = (file: File): string | null => {
    const lower = file.name.toLowerCase();
    if (!ACCEPTED.some((ext) => lower.endsWith(ext))) {
      return "Unsupported file. Upload a PDF.";
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `File is too large. Max ${MAX_MB} MB.`;
    }
    return null;
  };

  const startUpload = useCallback(
    (file: File) => {
      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        setPhase("idle");
        return;
      }
      setError(null);
      setFileName(file.name);
      setPhase("uploading");
      setProgress(0);

      let pct = 0;
      const timer = setInterval(() => {
        pct += Math.random() * 22 + 8;
        if (pct >= 100) {
          pct = 100;
          clearInterval(timer);
          setProgress(100);
          setPhase("done");
          window.setTimeout(() => router.push("/sign-up"), 1100);
        } else {
          setProgress(pct);
        }
      }, 220);
    },
    [router]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) startUpload(file);
  };

  const isBusy = phase === "uploading" || phase === "done";

  return (
    <div className={cn("w-full max-w-[600px]", className)}>
      <button
        type="button"
        onClick={() => !isBusy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isBusy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => !isBusy && onDrop(e)}
        aria-label="Upload your resume, PDF only, up to 10 megabytes"
        className={cn(
          "group relative flex h-[240px] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[var(--radius-xl)] border-2 border-dashed px-6 text-center outline-none transition-all duration-200 ease-[var(--ease-spring)]",
          "focus-visible:shadow-[var(--shadow-focus)]",
          "max-[480px]:h-[180px]",
          phase === "done"
            ? "border-success bg-success-bg"
            : dragOver
              ? "scale-[1.01] border-brand-secondary bg-brand-secondary text-white shadow-[var(--shadow-modal)]"
              : "border-border-strong bg-brand-light hover:border-brand-secondary"
        )}
      >
        {phase === "idle" && (
          <>
            <UploadCloud
              className={cn(
                "h-10 w-10 transition-colors",
                dragOver ? "text-white" : "text-brand-secondary"
              )}
              aria-hidden
            />
            <p
              className={cn(
                "text-h3",
                dragOver ? "text-white" : "text-text-primary"
              )}
            >
              Drop your resume here
            </p>
            <p
              className={cn(
                "text-body-sm",
                dragOver ? "text-white/80" : "text-text-muted"
              )}
            >
              PDF only &middot; Max 10 MB
            </p>
          </>
        )}

        {phase === "uploading" && (
          <div className="flex w-full max-w-sm flex-col items-center gap-4">
            <Loader2 className="h-9 w-9 animate-spin text-brand-primary" aria-hidden />
            <div className="flex w-full items-center gap-2 text-text-secondary">
              <FileText className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
              <span className="truncate text-body-sm">{fileName}</span>
              <span className="ml-auto text-mono text-text-muted">
                {Math.round(progress)}%
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-brand-primary transition-[width] duration-200 ease-[var(--ease-out)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
            <p className="text-h3 text-text-primary">Resume received</p>
            <p className="flex items-center gap-1.5 text-body-sm text-text-secondary">
              <FileText className="h-4 w-4" aria-hidden />
              <span className="max-w-[260px] truncate">{fileName}</span>
            </p>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) startUpload(file);
        }}
      />

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-center gap-1.5 text-body-sm text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
