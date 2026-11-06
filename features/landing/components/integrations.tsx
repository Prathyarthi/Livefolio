import { Plug } from "lucide-react";
import { IntegrationIcon } from "@/features/landing/components/integration-icons";
import {
  StudioHeading,
  StudioSection,
} from "@/features/landing/components/studio-shell";
import { integrations } from "@/lib/site";

export function Integrations() {
  return (
    <StudioSection id="integrations">
      <StudioHeading
        eyebrow="Integrations"
        title="Enrich your portfolio beyond the resume"
        description="Your resume gets you live fast. Then connect the platforms where your work already lives — repos, articles, and coding stats."
      />

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {integrations.map((platform) => (
          <article
            key={platform.id}
            className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 transition-colors duration-200 hover:border-border-strong"
          >
            <IntegrationIcon id={platform.id} />
            <h3 className="mt-4 text-h3 text-text-primary">{platform.name}</h3>
            <p className="mt-2 text-body-sm text-text-secondary">
              {platform.description}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-center text-body-sm text-text-muted">
        <Plug className="h-4 w-4 shrink-0" aria-hidden />
        More integrations on the roadmap — we ship what helps you get hired
        faster.
      </p>
    </StudioSection>
  );
}
