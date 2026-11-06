import {
  StudioHeading,
  StudioSection,
} from "@/features/landing/components/studio-shell";

const STEPS = [
  {
    number: "01",
    title: "Import your resume",
    body: "Upload a PDF or DOCX. We structure your experience, skills, and projects so you start with a draft, not a blank page.",
    visual: "resume",
  },
  {
    number: "02",
    title: "Connect your platforms",
    body: "Link GitHub, writing sites, and coding profiles so your portfolio can stay current with work you already ship.",
    visual: "connect",
  },
  {
    number: "03",
    title: "Choose a template",
    body: "Pick a layout that fits your story. Headings, sections, and accents stay editable after you publish.",
    visual: "template",
  },
  {
    number: "04",
    title: "Publish your link",
    body: "Go live on your Livefolio subdomain and share one place recruiters can review.",
    visual: "publish",
  },
] as const;

function StepVisual({ kind }: { kind: (typeof STEPS)[number]["visual"] }) {
  const shell =
    "studio-hatch relative flex min-h-96 w-full overflow-hidden rounded-xl border border-border-default bg-surface-sunken/50";

  if (kind === "resume") {
    return (
      <div className={shell}>
        <div className="relative z-[1] m-auto w-[min(100%,18rem)] rounded-xl border border-border-default bg-surface-raised p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center gap-2 font-mono text-[11px] text-text-muted">
            <span className="h-2 w-2 rounded-full bg-brand-secondary" />
            resume.pdf
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-2/3 rounded-full bg-text-primary/80" />
            <div className="h-2 w-full rounded-full bg-surface-sunken" />
            <div className="h-2 w-5/6 rounded-full bg-surface-sunken" />
            <div className="h-2 w-4/5 rounded-full bg-surface-sunken" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-14 rounded-lg bg-surface-sunken" />
            <div className="h-14 rounded-lg bg-surface-sunken" />
            <div className="h-14 rounded-lg bg-surface-sunken" />
          </div>
        </div>
      </div>
    );
  }
  if (kind === "connect") {
    return (
      <div className={shell}>
        <div className="relative z-[1] m-auto grid grid-cols-3 gap-3 p-6">
          {["GH", "M", "DV", "HN", "LC", "SO"].map((mark) => (
            <span
              key={mark}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border-default bg-surface-raised font-mono text-xs font-bold text-text-secondary shadow-[var(--shadow-card)] sm:h-16 sm:w-16"
            >
              {mark}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "template") {
    return (
      <div className={shell}>
        <div className="relative z-[1] m-auto grid w-[min(100%,22rem)] grid-cols-2 gap-3 p-5">
          <div className="rounded-xl border border-border-default bg-surface-raised p-3 shadow-[var(--shadow-card)]">
            <div className="h-2.5 w-12 rounded-full bg-brand-primary/60" />
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full rounded-full bg-surface-sunken" />
              <div className="h-2 w-3/4 rounded-full bg-surface-sunken" />
              <div className="mt-3 h-20 rounded-lg bg-surface-sunken" />
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-brand-secondary/60 bg-brand-secondary/5 p-3 shadow-[var(--shadow-card)]">
            <div className="h-2.5 w-12 rounded-full bg-brand-secondary/80" />
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full rounded-full bg-surface-sunken" />
              <div className="h-2 w-2/3 rounded-full bg-surface-sunken" />
              <div className="mt-3 h-20 rounded-lg bg-brand-secondary/15" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={shell}>
      <div className="relative z-[1] m-auto w-[min(100%,18rem)] rounded-xl border border-border-default bg-surface-raised px-5 py-8 text-center shadow-[var(--shadow-card)]">
        <p className="font-mono text-xs text-text-muted">livefolio.me/</p>
        <p className="mt-2 font-display text-lg font-semibold text-text-primary">
          you
        </p>
        <div className="mx-auto mt-5 h-9 w-28 rounded-full bg-brand-secondary text-[12px] font-semibold leading-9 text-white">
          View site
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <StudioSection id="features" padded={false}>
      <div className="px-4 sm:px-6">
        <StudioHeading
          eyebrow="How it works"
          title="From resume to live site"
          description="Import your resume, connect the platforms you already use, pick a template, and publish a shareable link."
          align="left"
        />
      </div>

      <div className="mt-10 grid grid-cols-1 border-y border-border-default md:grid-cols-2 md:[&>*:nth-child(odd)]:border-r md:[&>*:nth-child(odd)]:border-border-default [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-border-default md:[&>*:nth-child(n+3)]:border-b-0">
        {STEPS.map((step) => (
          <article key={step.number} className="flex h-full flex-col">
            <div className="relative flex-1 bg-surface-sunken/30 px-4 py-6 md:px-8 md:py-8">
              <StepVisual kind={step.visual} />
            </div>
            <div className="flex items-start gap-3 px-4 py-5 md:px-8 md:py-6">
              <span className="mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-secondary px-2 font-mono text-[11px] font-bold text-white">
                {step.number}
              </span>
              <div>
                <h3 className="text-h4 text-text-primary">{step.title}</h3>
                <p className="mt-1.5 max-w-[46ch] text-body-sm text-text-secondary">
                  {step.body}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </StudioSection>
  );
}
