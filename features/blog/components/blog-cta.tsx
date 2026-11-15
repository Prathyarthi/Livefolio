import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Closing CTAs shown at the end of every article. */
export function BlogCta() {
  return (
    <section aria-label="Next steps" className="mt-14 grid gap-4 md:grid-cols-2">
      <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-default bg-surface-raised p-6">
        <h2 className="text-h3 text-text-primary">Build your portfolio</h2>
        <p className="mt-2 flex-1 text-body-sm text-text-secondary">
          Upload your resume, pick a template and go live on your own livefolio.me address.
        </p>
        <Button asChild variant="accent" className="mt-5 w-fit font-sans">
          <Link href="/sign-up">Build your portfolio free</Link>
        </Button>
      </div>
      <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-default bg-surface-raised p-6">
        <h2 className="text-h3 text-text-primary">Hiring?</h2>
        <p className="mt-2 flex-1 text-body-sm text-text-secondary">
          Post a role free and review ranked shortlists with reference-backed profiles.
        </p>
        <Button asChild variant="outline" className="mt-5 w-fit font-sans">
          <Link href="/recruiters">See Livefolio for recruiters</Link>
        </Button>
      </div>
    </section>
  );
}
