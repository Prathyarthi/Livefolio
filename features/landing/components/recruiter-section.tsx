import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Centered studio section, matching the candidate landing headings. */
export function RecruiterSection({
  id,
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
        "scroll-mt-24 px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-12 md:pb-16 md:pt-14",
        className,
      )}
    >
      <div className="mx-auto w-full">
        <div className="mx-auto max-w-[44rem] text-center">
          <p className="eyebrow uppercase">{label}</p>
          <h2
            id={headingId}
            className="mt-2.5 text-h1 text-balance font-semibold tracking-[-0.03em] text-text-primary"
          >
            {title}
          </h2>
          {body ? (
            <p className="studio-lead mx-auto mt-4 max-w-[40rem] text-text-secondary">
              {body}
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-10 md:mt-12">{children}</div> : null}
      </div>
    </section>
  );
}

/** Three short points under a section's figure: no boxes, the figure carries the weight. */
export function SectionPoints({
  points,
}: {
  points: readonly { title: string; body: string }[];
}) {
  return (
    <ul className="mx-auto mt-8 grid max-w-[60rem] gap-6 px-1 sm:grid-cols-3 sm:gap-8 md:mt-10">
      {points.map((p) => (
        <li key={p.title}>
          <h3 className="text-xl font-semibold tracking-[-0.02em] text-text-primary">{p.title}</h3>
          <p className="mt-1.5 text-base leading-relaxed text-text-secondary">{p.body}</p>
        </li>
      ))}
    </ul>
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
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-text-primary">{title}</h3>
        <p className="mt-1.5 text-base leading-relaxed text-text-secondary">{body}</p>
      </div>
    </div>
  );
}
