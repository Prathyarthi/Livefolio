import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Studio-aligned recruiter section: dotted top rule, numbered eyebrow, heading + body. */
export function RecruiterSection({
  id,
  index,
  label,
  title,
  body,
  children,
  className,
}: {
  id?: string;
  index?: string;
  label: string;
  title: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "studio-dot-divider scroll-mt-24 px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-12 md:pb-16 md:pt-14",
        className,
      )}
    >
      <div className="mx-auto w-full">
        <p className="eyebrow flex items-center gap-2 uppercase">
          {index ? <span className="text-brand-secondary">{index}</span> : null}
          {label}
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2 md:items-end md:gap-6">
          <h2
            id={headingId}
            className="text-h1 text-balance font-semibold tracking-[-0.03em] text-text-primary"
          >
            {title}
          </h2>
          {body ? (
            <p className="max-w-md text-body text-text-secondary md:justify-self-end">
              {body}
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-10 md:mt-12">{children}</div> : null}
      </div>
    </section>
  );
}

/** Bento card with hairline border and a subtle inner gradient. */
export function BentoCard({
  title,
  body,
  children,
  className,
}: {
  title: string;
  body: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-default bg-gradient-to-b from-surface-raised to-surface-base",
        className,
      )}
    >
      <div className="flex-1 p-5">{children}</div>
      <div className="border-t border-dashed border-border-default/70 p-5">
        <h3 className="text-body font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-body-sm text-text-secondary">{body}</p>
      </div>
    </div>
  );
}
