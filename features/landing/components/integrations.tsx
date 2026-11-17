import { Plug } from "lucide-react";
import { IntegrationOrbit } from "@/features/landing/components/integration-orbit";
import {
  StudioHeading,
  StudioSection,
} from "@/features/landing/components/studio-shell";

export function Integrations() {
  return (
    <StudioSection id="integrations">
      <StudioHeading
        eyebrow="Integrations"
        title="Enrich your portfolio beyond the resume"
        description="Your resume gets you live fast. Then connect the platforms where your work already lives: repos, articles, and coding stats."
      />

      <IntegrationOrbit />

      <p className="mt-8 flex items-center justify-center gap-2 text-center text-body-sm text-text-muted">
        <Plug className="h-4 w-4 shrink-0" aria-hidden />
        More integrations on the roadmap. We ship what helps you get hired
        faster.
      </p>
    </StudioSection>
  );
}
