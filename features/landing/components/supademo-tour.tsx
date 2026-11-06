import {
  StudioHeading,
  StudioSection,
} from "@/features/landing/components/studio-shell";

export function SupademoTour() {
  return (
    <StudioSection>
      <StudioHeading
        eyebrow="Product tour"
        title="See Livefolio in action"
        description="Walk through how a resume becomes a published portfolio."
      />

      <div className="relative mx-auto mt-8 w-full max-h-[70svh] overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-raised [aspect-ratio:1.72]">
        <iframe
          src="https://app.supademo.com/embed/cmsim278j2140qmaaj7ypuliv?embed_v=2&utm_source=embed"
          loading="lazy"
          title="Build and Publish Your Professional Portfolio on Livefolio"
          allow="clipboard-write"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </StudioSection>
  );
}
