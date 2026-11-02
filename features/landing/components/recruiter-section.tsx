import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Linear-style section: hairline top border, numbered eyebrow, big two-line heading, short body. */
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
        "scroll-mt-20 border-t border-border-default px-6 py-24 md:py-32",
        className,
      )}
    >
      <div className="mx-auto max-w-[1120px]">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-secondary">
          {index ? <span className="text-brand-secondary">{index}</span> : null}
          {label}
        </p>
        <div className="mt-4 grid gap-6 md:grid-cols-2 md:items-end">
          <h2
            id={headingId}
            className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-text-primary md:text-5xl"
          >
            {title}
          </h2>
          {body ? (
            <p className="max-w-md text-body text-text-secondary md:justify-self-end">
              {body}
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-14">{children}</div> : null}
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
        "flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-gradient-to-b from-surface-raised to-surface-base",
        className,
      )}
    >
      <div className="flex-1 p-5">{children}</div>
      <div className="border-t border-border-default p-5">
        <h3 className="text-body font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-body-sm text-text-secondary">{body}</p>
      </div>
    </div>
  );
}
