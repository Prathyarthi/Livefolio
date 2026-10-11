import { RichText } from "@/components/rich-text";
import { splitRichLines } from "@/features/jobs/constants/labels";
import { cn } from "@/lib/utils";

export function JobTextSection({
  title,
  body,
  emptyHint,
  compact = false,
}: {
  title: string;
  body: string | null;
  emptyHint?: string;
  compact?: boolean;
}) {
  const trimmed = body?.trim() ?? "";
  if (!trimmed) {
    if (!emptyHint) return null;
    return (
      <section
        className={cn(
          "rounded-[var(--radius-lg)] border border-dashed border-border-default",
          compact ? "bg-surface-raised/80 p-4" : "bg-surface-raised p-6 md:p-8",
        )}
      >
        <h2
          className={
            compact
              ? "text-sm font-medium text-text-primary"
              : "text-h3 text-text-primary"
          }
        >
          {title}
        </h2>
        <p
          className={
            compact
              ? "mt-2 text-body-sm text-text-muted"
              : "mt-4 text-body-sm text-text-muted"
          }
        >
          {emptyHint}
        </p>
      </section>
    );
  }

  const lines = splitRichLines(trimmed);
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]",
        compact ? "p-4" : "p-6 md:p-8",
      )}
    >
      <h2
        className={
          compact
            ? "text-sm font-medium text-text-primary"
            : "text-h3 text-text-primary"
        }
      >
        {title}
      </h2>
      {lines.length > 1 ? (
        <ul
          className={cn(
            "text-text-secondary",
            compact
              ? "mt-3 space-y-2 text-body-sm"
              : "mt-4 space-y-2.5 text-body",
          )}
        >
          {lines.map((line, index) => (
            <li key={`${index}-${line}`} className="flex gap-3">
              <span
                className={cn(
                  "shrink-0 rounded-full bg-brand-primary",
                  compact ? "mt-2 h-1.5 w-1.5" : "mt-2.5 h-1.5 w-1.5",
                )}
              />
              <RichText as="span" text={line} />
            </li>
          ))}
        </ul>
      ) : (
        <RichText
          as="p"
          text={trimmed}
          className={cn(
            "whitespace-pre-wrap text-text-secondary",
            compact ? "mt-3 text-body-sm" : "mt-4 text-body",
          )}
        />
      )}
    </section>
  );
}

export function JobRequirementCard({
  title,
  items,
  compact = false,
}: {
  title: string;
  items: string[];
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]",
        compact ? "p-4" : "p-6",
      )}
    >
      <h2
        className={
          compact
            ? "text-sm font-medium text-text-primary"
            : "text-h3 text-text-primary"
        }
      >
        {title}
      </h2>
      {items.length === 0 ? (
        <p
          className={
            compact
              ? "mt-2 text-body-sm text-text-muted"
              : "mt-3 text-body-sm text-text-muted"
          }
        >
          {compact ? "None listed yet" : "None listed"}
        </p>
      ) : (
        <ul
          className={cn(
            "flex flex-wrap",
            compact ? "mt-3 gap-1.5" : "mt-4 gap-2",
          )}
        >
          {items.map((item) => (
            <li
              key={item}
              className={
                compact
                  ? "rounded-full border border-border-default bg-surface-base px-2.5 py-1 text-xs text-text-primary"
                  : "rounded-full border border-border-default bg-surface-base px-3 py-1.5 text-body-sm text-text-primary"
              }
            >
              <RichText as="span" text={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}