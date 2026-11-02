import type { ReactNode } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Monospace eyebrow label, matching the recruiters landing page. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs uppercase tracking-wider text-text-secondary", className)}>
      {children}
    </p>
  );
}

/** Page header: eyebrow, tight heading, short description and optional actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-body-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Flat bordered panel without a card shadow. */
export function Panel({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  return (
    <Tag
      className={cn(
        "rounded-[var(--radius-lg)] border border-border-default bg-surface-raised",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Skeleton rows for list loading states. */
export function ListSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div
      className={cn("divide-y divide-border-default overflow-hidden rounded-[var(--radius-lg)] border border-border-default", className)}
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-10" />
        </div>
      ))}
    </div>
  );
}

/** Error alert with an optional retry action. */
export function QueryError({
  error,
  fallback = "Something went wrong.",
  onRetry,
  className,
}: {
  error: unknown;
  fallback?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Alert variant="destructive" className={cn("border-border-default", className)}>
      <AlertCircle className="h-4 w-4" aria-hidden />
      <AlertTitle>Couldn&apos;t load this</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{error instanceof Error ? error.message : fallback}</span>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RotateCw className="h-3.5 w-3.5" aria-hidden />
            Retry
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

type BadgeVariant = "neutral" | "secondary" | "brand" | "warning" | "success" | "danger" | "outline";

/** One colour per pipeline stage, used in rows, tabs, compare and detail. */
export const STAGE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  new: "outline",
  reviewing: "neutral",
  shortlisted: "brand",
  interview: "warning",
  offer: "success",
  hired: "success",
  rejected: "danger",
};

export function StageBadge({
  stage,
  label,
  className,
}: {
  stage: string;
  label: string;
  className?: string;
}) {
  return (
    <Badge variant={STAGE_BADGE_VARIANT[stage] ?? "neutral"} className={className}>
      {label}
    </Badge>
  );
}
