import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StudioShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Candidate-landing shell.
 * Outer frame = calc(72rem - 8px) ≈ 1144px. Rails sit on the frame edges
 * (not inset by horizontal padding), so measured rail/process width matches
 * the shell. Section content uses its own mobile-safe padding.
 */
export function StudioShell({ children, className }: StudioShellProps) {
  return (
    <div
      className={cn(
        "studio-landing relative min-h-screen overflow-x-hidden bg-surface-base",
        className,
      )}
    >
      {/*
        Full-bleed mountain at page top (behind sticky nav). Provenance:
        public/landing/PROVENANCE.md — Unsplash / Daniel Seßler.
      */}
      <div className="studio-hero-backdrop" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/hero-mountains.jpg"
          alt=""
          width={1400}
          height={934}
          decoding="async"
          fetchPriority="high"
        />
      </div>

      <div className="studio-landing__frame relative z-[1] mx-auto w-full max-w-[calc(72rem-8px)]">
        <div className="relative z-[1]">{children}</div>
      </div>
    </div>
  );
}

type StudioSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  divider?: boolean;
  /** Extra horizontal padding inside the full-width shell (mobile-safe). */
  padded?: boolean;
};

export function StudioSection({
  id,
  children,
  className,
  divider = true,
  padded = true,
}: StudioSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 pb-12 pt-10 sm:pb-14 sm:pt-12 md:pb-16 md:pt-14",
        padded && "px-4 sm:px-6",
        divider && "border-t-0",
        className,
      )}
    >
      <div className="mx-auto w-full">{children}</div>
    </section>
  );
}

export function StudioHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-[36rem] text-center",
        align === "left" && "max-w-[34rem] text-left",
      )}
    >
      {eyebrow ? <p className="eyebrow uppercase">{eyebrow}</p> : null}
      <h2
        className={cn(
          "text-h1 font-semibold tracking-[-0.03em] text-text-primary",
          eyebrow ? "mt-2.5" : null,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-3 max-w-[40rem] text-body text-text-secondary",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
