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
    icon: FileUp,
    title: "Resume-first start",
    body: "Drop a PDF or DOCX and get a structured draft instead of an empty editor.",
  },
  {
    icon: Link2,
    title: "Real integrations",
    body: "Connect GitHub, Medium, Dev.to, Hashnode, LeetCode, Stack Overflow, and Codeforces when you are ready.",
  },
  {
    icon: Palette,
    title: "Template control",
    body: "Choose a layout, then keep editing sections, visibility, and headings after you publish.",
  },
  {
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
    text: "Start free, then upgrade to Pro when you need the fuller workflow.",
  },
] as const;

export function ProductHighlights() {
  return (
    <StudioSection id="product">
      <StudioHeading
        eyebrow="Product"
        title="Built around how portfolios actually get made"
        description="Soft cards for the core product loops — still grounded in what Livefolio ships today."
      />

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
          <article
            key={title}
            className="rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken/40 p-5 transition-colors duration-200 hover:border-border-strong"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border-default bg-surface-raised text-brand-secondary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="mt-4 text-h4 text-text-primary">{title}</h3>
            <p className="mt-1.5 text-body-sm text-text-secondary">{body}</p>
          </article>
        ))}
      </div>

      <ul className="mt-6 space-y-3 border-t border-dashed border-border-default/70 pt-6">
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
