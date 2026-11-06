import {
  StudioHeading,
  StudioSection,
} from "@/features/landing/components/studio-shell";

const STEPS = [
  {
    number: "01",
    title: "Import your resume",
    body: "Upload a PDF or DOCX. We structure your experience, skills, and projects so you are not starting from a blank page.",
    visual: "resume",
  },
  {
    number: "02",
    title: "Connect your platforms",
    body: "Optionally link GitHub, writing sites, and coding profiles so your portfolio can reflect work that already exists.",
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
    body: "Go live on your Livefolio subdomain and share a single place recruiters can review.",
    visual: "publish",
  },
] as const;

function StepVisual({ kind }: { kind: (typeof STEPS)[number]["visual"] }) {
  if (kind === "resume") {
    return (
      <div className="studio-hatch relative h-36 overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface-raised p-3">
        <div className="space-y-2 rounded-[var(--radius-sm)] border border-border-default bg-surface-base p-3">
          <div className="h-2 w-16 rounded-full bg-brand-secondary/70" />
          <div className="h-1.5 w-full rounded-full bg-surface-sunken" />
          <div className="h-1.5 w-5/6 rounded-full bg-surface-sunken" />
          <div className="h-1.5 w-4/5 rounded-full bg-surface-sunken" />
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <div className="h-8 rounded bg-surface-sunken" />
            <div className="h-8 rounded bg-surface-sunken" />
            <div className="h-8 rounded bg-surface-sunken" />
          </div>
        </div>
      </div>
    );
  }
  if (kind === "connect") {
    return (
      <div className="studio-hatch relative flex h-36 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface-raised p-3">
        <div className="grid grid-cols-3 gap-2">
          {["GH", "M", "DV", "HN", "LC", "SO"].map((mark) => (
            <span
              key={mark}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default bg-surface-base font-mono text-[10px] font-bold text-text-muted"
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
      <div className="studio-hatch relative h-36 overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface-raised p-3">
        <div className="grid h-full grid-cols-2 gap-2">
          <div className="rounded-[var(--radius-sm)] border border-border-default bg-surface-base p-2">
            <div className="h-2 w-10 rounded-full bg-brand-primary/50" />
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full rounded-full bg-surface-sunken" />
              <div className="h-1.5 w-3/4 rounded-full bg-surface-sunken" />
            </div>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-dashed border-brand-secondary/50 bg-brand-secondary/5 p-2">
            <div className="h-2 w-10 rounded-full bg-brand-secondary/70" />
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full rounded-full bg-surface-sunken" />
              <div className="h-1.5 w-2/3 rounded-full bg-surface-sunken" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="studio-hatch relative flex h-36 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface-raised p-3">
      <div className="w-full rounded-[var(--radius-sm)] border border-border-default bg-surface-base px-3 py-4 text-center">
        <p className="font-mono text-[11px] text-text-muted">livefolio.me/</p>
        <p className="mt-1 font-display text-sm font-semibold text-text-primary">
          you
        </p>
        <div className="mx-auto mt-3 h-7 w-24 rounded-full bg-brand-secondary/90" />
      </div>
    </div>
  );
}

export function Features() {
  return (
    <StudioSection id="features">
      <StudioHeading
        eyebrow="How it works"
        title="From resume to live site"
        description="Four clear steps — import, connect, customize, and publish — without inventing workflows Livefolio does not support."
      />

      <div className="mt-10 grid grid-cols-1 overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-raised sm:grid-cols-2">
        {STEPS.map((step, index) => (
          <article
            key={step.number}
            className={[
              "flex flex-col gap-4 p-5 sm:p-6",
              index % 2 === 0 ? "sm:border-r border-border-default" : "",
              index < 2 ? "border-b border-border-default" : "",
            ].join(" ")}
          >
            <StepVisual kind={step.visual} />
            <div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-secondary px-2 font-mono text-[11px] font-bold text-white">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-h4 text-text-primary">{step.title}</h3>
                  <p className="mt-1.5 text-body-sm text-text-secondary">
                    {step.body}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </StudioSection>
  );
}
