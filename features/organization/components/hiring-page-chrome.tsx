import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HiringBackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function HiringLoadingState({
  backHref,
  backLabel,
  message = "Loading…",
  className,
}: {
  backHref?: string;
  backLabel?: string;
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-4xl space-y-8", className)}>
      {backHref && backLabel ? (
        <HiringBackLink href={backHref}>{backLabel}</HiringBackLink>
      ) : null}
      <p className="text-body-sm text-text-muted">{message}</p>
    </div>
  );
}

export function HiringNotFoundState({
  backHref,
  backLabel,
  title,
  description,
  className,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-4xl space-y-8", className)}>
      <HiringBackLink href={backHref}>{backLabel}</HiringBackLink>
      <div className="space-y-2">
        <h1 className="text-h3 text-text-primary">{title}</h1>
        {description ? (
          <p className="text-body-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
