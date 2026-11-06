import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StudioShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Candidate-landing only layout.
 * Outer shell matches reference geometry: ~72rem / max-w-6xl (~1152px),
 * with faint dashed rails. Palette unchanged.
 */
export function StudioShell({ children, className }: StudioShellProps) {
  return (
    <div
      className={cn(
        "studio-landing relative min-h-screen overflow-x-hidden bg-surface-base",
        className,
      )}
    >
      <div className="studio-landing__frame relative mx-auto w-full max-w-[calc(72rem-8px)] px-4 sm:px-6 lg:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-4 right-4 border-x border-dashed border-border-default/70 sm:left-6 sm:right-6 lg:left-8 lg:right-8"
        />
        <div className="relative z-[1]">{children}</div>
      </div>
    </div>
  );
}

type StudioSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Draw the horizontal dashed divider above this section. */
  divider?: boolean;
};

export function StudioSection({
  id,
  children,
  className,
  divider = true,
}: StudioSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 py-14 sm:py-16 md:py-20",
        divider && "border-t border-dashed border-border-default/70",
        className,
      )}
    >
      {/* Full shell width — no 765px clamp on card grids / process / pricing */}
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
        align === "center" && "mx-auto max-w-[40ch] text-center md:max-w-[42ch]",
        align === "left" && "max-w-[42ch]",
      )}
    >
      {eyebrow ? <p className="eyebrow uppercase">{eyebrow}</p> : null}
      <h2 className={cn("text-h1 text-text-primary", eyebrow ? "mt-3" : null)}>
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-[56ch] text-body text-text-secondary",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
