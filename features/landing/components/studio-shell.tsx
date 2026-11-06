import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StudioShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Candidate-landing only layout: airy centred column with faint dashed rails.
 * Does not change global palette — only structure and section rhythm.
 */
export function StudioShell({ children, className }: StudioShellProps) {
  return (
    <div className={cn("studio-landing relative min-h-screen overflow-x-hidden bg-surface-base", className)}>
      <div className="studio-landing__frame relative mx-auto w-full max-w-[920px] px-4 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-4 right-4 border-x border-dashed border-border-default/70 sm:left-6 sm:right-6"
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
        "scroll-mt-24 px-1 py-14 sm:py-16 md:py-20",
        divider && "border-t border-dashed border-border-default/70",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[765px]">{children}</div>
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
    <div className={cn(align === "center" && "mx-auto max-w-xl text-center")}>
      {eyebrow ? <p className="eyebrow uppercase">{eyebrow}</p> : null}
      <h2 className={cn("text-h1 text-text-primary", eyebrow ? "mt-3" : null)}>
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-body text-text-secondary",
            align === "center" && "prose-measure mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
