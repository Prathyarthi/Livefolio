import {
  FileUp,
  Link2,
  Palette,
  RefreshCw,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  StudioHeading,
  StudioSection,
} from "@/features/landing/components/studio-shell";

const HIGHLIGHTS = [
  {
    kind: "resume" as const,
    icon: FileUp,
    title: "Resume-first start",
    body: "Drop a PDF or DOCX and get a structured draft instead of an empty editor.",
  },
  {
    kind: "integrations" as const,
    icon: Link2,
    title: "Real integrations",
    body: "Connect GitHub, Medium, Dev.to, Hashnode, LeetCode, Stack Overflow, and Codeforces when you are ready.",
  },
  {
    kind: "template" as const,
    icon: Palette,
    title: "Template control",
    body: "Choose a layout, then keep editing sections, visibility, and headings after you publish.",
  },
  {
    kind: "share" as const,
    icon: Share2,
    title: "Shareable link",
    body: "Publish on your Livefolio subdomain and send one URL instead of a pile of profiles.",
  },
] as const;

const BULLETS = [
  {
    icon: RefreshCw,
    text: "Keep connected sources in sync so your portfolio can stay current.",
  },
  {
    icon: Sparkles,
    text: "Start free, then upgrade to Pro when you need more publishing power.",
  },
] as const;

function HighlightVisual({
  kind,
}: {
  kind: (typeof HIGHLIGHTS)[number]["kind"];
}) {
  if (kind === "resume") {
    return (
      <div className="flex h-80 items-end justify-center overflow-hidden rounded-t-2xl bg-surface-sunken/60 px-8 pt-8">
        <div className="h-full w-full max-w-sm rounded-t-xl border border-border-default bg-surface-raised p-5 shadow-[var(--shadow-card)]">
          <div className="h-3 w-24 rounded-full bg-brand-secondary/70" />
          <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded-full bg-surface-sunken" />
            <div className="h-2 w-5/6 rounded-full bg-surface-sunken" />
            <div className="h-2 w-2/3 rounded-full bg-surface-sunken" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="h-24 rounded-lg bg-surface-sunken" />
            <div className="h-24 rounded-lg bg-surface-sunken" />
          </div>
        </div>
      </div>
    );
  }
  if (kind === "integrations") {
    return (
      <div className="flex h-80 items-center justify-center overflow-hidden rounded-t-2xl bg-surface-sunken/60 p-8">
        <div className="grid grid-cols-3 gap-3">
          {["GH", "M", "DV", "HN", "LC", "CF"].map((m) => (
            <span
              key={m}
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border-default bg-surface-raised font-mono text-xs font-bold text-text-secondary shadow-[var(--shadow-card)]"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "template") {
    return (
      <div className="flex h-80 items-center justify-center overflow-hidden rounded-t-2xl bg-surface-sunken/60 p-6">
        <div className="grid w-full max-w-md grid-cols-2 gap-3">
          <div className="h-56 rounded-xl border border-border-default bg-surface-raised p-3 shadow-[var(--shadow-card)]">
            <div className="h-2 w-10 rounded-full bg-brand-primary/50" />
            <div className="mt-3 h-28 rounded-lg bg-surface-sunken" />
            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-surface-sunken" />
              <div className="h-1.5 w-2/3 rounded-full bg-surface-sunken" />
            </div>
          </div>
          <div className="h-56 rounded-xl border border-brand-secondary/40 bg-brand-secondary/5 p-3 shadow-[var(--shadow-card)]">
            <div className="h-2 w-10 rounded-full bg-brand-secondary/80" />
            <div className="mt-3 h-28 rounded-lg bg-brand-secondary/15" />
            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-surface-sunken" />
              <div className="h-1.5 w-1/2 rounded-full bg-surface-sunken" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-80 items-center justify-center overflow-hidden rounded-t-2xl bg-surface-sunken/60 p-8">
      <div className="w-full max-w-xs rounded-2xl border border-border-default bg-surface-raised px-5 py-8 text-center shadow-[var(--shadow-card)]">
        <p className="font-mono text-xs text-text-muted">livefolio.me/you</p>
        <div className="mx-auto mt-6 h-10 w-32 rounded-full bg-brand-secondary text-sm font-semibold leading-10 text-white">
          Open portfolio
        </div>
      </div>
    </div>
  );
}

export function ProductHighlights() {
  return (
    <StudioSection id="product">
      <StudioHeading
        eyebrow="Product"
        title="Everything you need to go from resume to live site"
        description="Import once, connect your platforms, customize a template, and share a single polished link."
      />

      {/* max-w-5xl (64rem / 1024px) — ~504px cards in 2 columns with gap-4 */}
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        {HIGHLIGHTS.map(({ kind, icon: Icon, title, body }) => (
          <article
            key={title}
            className="overflow-hidden rounded-2xl border border-border-default bg-surface-raised transition-colors duration-200 hover:border-border-strong"
          >
            <HighlightVisual kind={kind} />
            <div className="border-t border-dashed border-border-default/70 p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-border-default bg-surface-sunken text-brand-secondary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="text-h4 text-text-primary">{title}</h3>
              </div>
              <p className="mt-2 text-body-sm text-text-secondary">{body}</p>
            </div>
          </article>
        ))}
      </div>

      <ul className="mx-auto mt-8 max-w-5xl space-y-3 border-t border-dashed border-border-default/70 pt-6">
        {BULLETS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-start gap-3 text-body-sm text-text-secondary"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-primary">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </StudioSection>
  );
}
