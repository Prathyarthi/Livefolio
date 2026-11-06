import {
  CodeforcesIcon,
  DevtoIcon,
  HashnodeIcon,
  StackOverflowIcon,
} from "@/components/icons";
import {
  GitHubIcon,
  LeetCodeIcon,
  MediumIcon,
} from "@/features/landing/components/integration-icons";
import {
  StudioHeading,
  StudioSection,
} from "@/features/landing/components/studio-shell";
import { integrations } from "@/lib/site";

const ICONS = {
  github: GitHubIcon,
  medium: MediumIcon,
  devto: DevtoIcon,
  hashnode: HashnodeIcon,
  leetcode: LeetCodeIcon,
  stackoverflow: StackOverflowIcon,
  codeforces: CodeforcesIcon,
} as const;

/**
 * Truthful proof strip: platforms Livefolio actually connects.
 * Not client logos, testimonials, or fabricated counts.
 */
export function PlatformProof() {
  return (
    <StudioSection>
      <StudioHeading
        eyebrow="Connected platforms"
        title="Bring work that already lives elsewhere"
        description="Import a resume, then optionally connect the platforms below so repos, writing, and coding stats can stay current on your site."
      />

      <ul className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        {integrations.map((platform) => {
          const Icon = ICONS[platform.id];
          return (
            <li
              key={platform.id}
              className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-raised px-3 py-1.5 shadow-[0_1px_2px_rgba(26,24,40,0.04)]"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-text-primary" />
              <span className="text-body-sm font-medium text-text-secondary">
                {platform.name}
              </span>
            </li>
          );
        })}
      </ul>
    </StudioSection>
  );
}
