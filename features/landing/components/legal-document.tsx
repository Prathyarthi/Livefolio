import { cn } from "@/lib/utils";
import { landingSurfaceMuted } from "@/features/landing/surface";

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalDocument({ title, lastUpdated, children }: LegalDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-10 text-center">
        <p className="eyebrow uppercase">Legal</p>
        <h1 className="mt-3 text-h1 text-text-primary">{title}</h1>
        <p className="mt-3 text-body-sm text-text-muted">
          Last updated: {lastUpdated}
        </p>
      </header>

      <div
        className={cn(
          landingSurfaceMuted,
          "legal-prose px-6 py-8 md:rounded-3xl md:px-10 md:py-12"
        )}
      >
        {children}
      </div>
    </article>
  );
}
