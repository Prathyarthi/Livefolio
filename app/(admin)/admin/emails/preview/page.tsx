import Link from "next/link";
import { getAutomatedEmailDemos } from "@/lib/email-templates";
import { Badge } from "@/components/ui/badge";

export default function AdminEmailPreviewPage() {
  const demos = getAutomatedEmailDemos("Alex", { preview: true });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 text-text-primary">Email template demos</h1>
          <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">
            Preview of the automated emails Livefolio sends. Layout matches the
            branded letter used for waitlist and product mail.
          </p>
        </div>
        <Link
          href="/admin/emails"
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          Back to email blasts
        </Link>
      </div>

      <div className="space-y-10">
        {demos.map((demo) => (
          <section key={demo.id} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h3 text-text-primary">{demo.label}</h2>
              <Badge variant="secondary">{demo.id}</Badge>
            </div>
            <p className="text-body-sm text-text-secondary">{demo.description}</p>
            <p className="text-sm">
              <span className="text-text-muted">Subject: </span>
              <span className="font-medium text-text-primary">{demo.subject}</span>
            </p>
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken">
              <iframe
                title={demo.label}
                srcDoc={demo.html}
                className="h-[720px] w-full bg-white"
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
