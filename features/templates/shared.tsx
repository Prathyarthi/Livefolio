import { cn } from "@/lib/utils";
import { stripBulletPrefix } from "@/lib/text";
import { Layers } from "lucide-react";
import ExpandableText from "@/components/expandable-text";
import type {
  PortfolioCustomization,
  PortfolioData,
  TemplateNavbarCustomization,
  TemplateSectionId,
} from "./types";
import {
  getSectionLabel,
  NAVBAR_SECTION_TO_KEY,
} from "./section-labels";
import { getStoredSectionLayout, normalizeHidden, type ReorderableSectionKey } from "./section-order";
import { getPlatformIcon } from "./utils";
import { CollapsibleList } from "./collapsible-list";

export { getSectionLabel, getSectionLabels, STANDARD_SECTION_LABELS } from "./section-labels";
export type { SectionKey } from "./section-labels";

const HERO_PROFILE_PLATFORMS = ["github", "linkedin"] as const;

/** Enables container-query breakpoints inside templates (mobile preview, narrow embeds). */
export const TEMPLATE_CONTAINER =
  "@container min-w-0 w-full overflow-x-clip [&_h1]:text-inherit [&_h2]:text-inherit [&_h3]:text-inherit [&_h4]:text-inherit [&_h5]:text-inherit [&_h6]:text-inherit";

/** Hero title overflow + fluid type scaled to template width (not viewport). */
export const HERO_TITLE_BASE = "min-w-0 text-balance [overflow-wrap:anywhere]";
export const HERO_TITLE_SCALE_5XL =
  "text-xl @sm:text-2xl @md:text-3xl @lg:text-5xl";
export const HERO_TITLE_SCALE_6XL =
  "text-2xl @sm:text-3xl @md:text-4xl @lg:text-6xl";
export const HERO_TITLE_SCALE_7XL =
  "text-2xl @sm:text-4xl @md:text-5xl @lg:text-7xl";
export const HERO_TITLE_SCALE_8XL =
  "text-2xl @sm:text-4xl @md:text-6xl @lg:text-8xl";
export const HERO_TITLE_SCALE_9XL =
  "text-2xl @sm:text-4xl @md:text-6xl @lg:text-8xl @xl:text-[9rem]";

/** Hero headline / subcopy — scales with template container. */
export const HERO_HEADLINE_SCALE =
  "text-base leading-relaxed @md:text-lg @lg:text-xl";

/** Two-column hero header (title + summary). */
export const HERO_HEADER_GRID =
  "grid min-w-0 gap-6 @md:gap-8 @lg:grid-cols-[1fr_300px] @lg:items-start";
export const HERO_HEADER_COLUMN = "min-w-0";

/** Project grids sized by template width, not viewport. */
export const PROJECTS_GRID_2 =
  "grid min-w-0 grid-cols-1 gap-6 @md:grid-cols-2 [&>*]:min-w-0";
export const PROJECTS_GRID_3 =
  "grid min-w-0 grid-cols-1 gap-6 @md:grid-cols-2 @lg:grid-cols-3 [&>*]:min-w-0";

export const PROJECT_CARD = "min-w-0 overflow-hidden";
export const PROJECT_CARD_BODY = "min-w-0 p-5 @sm:p-6";
export const PROJECT_CARD_HEADER =
  "flex min-w-0 flex-col gap-3 @md:flex-row @md:items-start @md:justify-between";
export const PROJECT_CARD_TITLE = "min-w-0 text-balance [overflow-wrap:anywhere]";
export const PROJECT_CARD_META = "min-w-0 flex flex-wrap items-center gap-2";
export const PROJECT_CARD_ACTIONS = "shrink-0";

/** Stack related sections vertically (certifications, achievements, etc.). */
export const STACKED_SECTIONS = "flex min-w-0 flex-col gap-8 @lg:gap-12";

/** Two related sections side-by-side only when the template is wide enough. */
export const SPLIT_SECTIONS_GRID =
  "grid min-w-0 grid-cols-1 gap-8 @md:grid-cols-2 [&>*]:min-w-0";

/** Certification / achievement card header row. */
export const SPLIT_CARD_ROW =
  "flex min-w-0 flex-col gap-3 @md:flex-row @md:items-center @md:justify-between";

/** Bento template main grid — sized by template width, not viewport. */
export const BENTO_GRID =
  "grid min-w-0 grid-cols-1 gap-4 auto-rows-[minmax(180px,auto)] @md:grid-cols-3 @lg:grid-cols-4 [&>*]:min-w-0";

export function getTemplateNavbarCustomization(
  customization: PortfolioCustomization | Record<string, unknown> | null | undefined
): TemplateNavbarCustomization {
  const navbar =
    customization &&
      typeof customization === "object" &&
      "navbar" in customization &&
      customization.navbar &&
      typeof customization.navbar === "object"
      ? (customization.navbar as TemplateNavbarCustomization)
      : {};

  const sections =
    navbar.sections && typeof navbar.sections === "object" ? navbar.sections : {};

  return {
    enabled: navbar.enabled !== false,
    sections,
  };
}

export function buildTemplateSections(data: PortfolioData) {
  const navbar = getTemplateNavbarCustomization(data.portfolio.customization);
  const hasProfiles =
    data.socialProfiles.length > 0 ||
    Boolean(
      data.portfolio.contactEmail ||
      data.portfolio.phone ||
      data.portfolio.websiteUrl ||
      data.portfolio.location
    );

  const availableSections: TemplateSectionId[] = [
    data.portfolio.summary ? "about" : null,
    data.projects.length > 0 ? "work" : null,
    data.experiences.length > 0 ? "experience" : null,
    hasProfiles ? "profiles" : null,
  ].filter((section): section is TemplateSectionId => Boolean(section));

  const customization = data.portfolio.customization;
  const hiddenSections = new Set<ReorderableSectionKey>(
    normalizeHidden(getStoredSectionLayout(customization).hidden),
  );
  const sections = availableSections
    .filter((section) => navbar.sections?.[section] !== false)
    .filter((section) => {
      const key = NAVBAR_SECTION_TO_KEY[section];
      return !hiddenSections.has(key as ReorderableSectionKey);
    })
    .slice(0, 4)
    .map((section) => ({
      id: section,
      label: getSectionLabel(NAVBAR_SECTION_TO_KEY[section], customization),
    }));

  return {
    navbarEnabled: navbar.enabled !== false && sections.length > 0,
    sections,
    hasProfiles,
  };
}

export function TemplateNavbar({
  items,
  className,
  linkClassName,
}: {
  items: Array<{ id: string; label: string }>;
  className?: string;
  linkClassName?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav
      className={cn(
        "sticky top-0 z-30 w-full min-w-0 max-w-full border backdrop-blur-xl scrollbar-none",
        className
      )}
    >
      <div className="flex w-full max-w-full flex-nowrap items-center justify-start gap-1.5 overflow-x-auto p-1.5 scrollbar-none @md:justify-center @md:gap-2 @md:p-2 @lg:w-max">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(linkClassName, "shrink-0 whitespace-nowrap")}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function splitDescription(text: string): string[] {
  return text
    .split(/\n+/)
    .map(stripBulletPrefix)
    .filter(Boolean);
}

function stripLineClamp(className?: string) {
  if (!className) return undefined;
  return className.replace(/\bline-clamp-\d+\b/g, "").replace(/\s+/g, " ").trim();
}

export function DescriptionBlock({
  text,
  paragraphClassName,
  listClassName,
}: {
  text: string;
  paragraphClassName?: string;
  listClassName?: string;
}) {
  const lines = splitDescription(text);

  if (lines.length <= 1) {
    return (
      <ExpandableText
        as="p"
        className={stripLineClamp(paragraphClassName)}
        initialLines={3}
      >
        {text}
      </ExpandableText>
    );
  }

  return (
    <ExpandableText
      as="ul"
      className={stripLineClamp(listClassName)}
      initialLines={3}
    >
      {lines.map((line, index) => (
        <li key={`${index}-${line}`}>{line}</li>
      ))}
    </ExpandableText>
  );
}

export function ContactChips({
  portfolio,
  chipClassName,
}: {
  portfolio: PortfolioData["portfolio"];
  chipClassName?: string;
}) {
  const items = [
    portfolio.location,
    portfolio.contactEmail,
    portfolio.phone,
    portfolio.websiteUrl?.replace(/^https?:\/\//, ""),
  ].filter(Boolean) as string[];

  if (items.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={cn(chipClassName, "max-w-full min-w-0 [overflow-wrap:anywhere]")}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function SocialPills({
  profiles,
  className,
  showUsername = false,
}: {
  profiles: PortfolioData["socialProfiles"];
  className?: string;
  showUsername?: boolean;
}) {
  const visibleProfiles = profiles.filter(
    (profile) => profile.platform.toLowerCase() !== "unknown",
  );

  if (visibleProfiles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleProfiles.map((profile) => {
        const username = profile.username?.replace(/^@+/, "").trim();
        return (
        <a
          key={`${profile.platform}-${profile.url}`}
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          data-lf-track="social"
          data-lf-label={profile.platform}
        >
          {getPlatformIcon(profile.platform)}
          {showUsername && username ? ` · @${username}` : ""}
        </a>
        );
      })}
    </div>
  );
}

export function HeroProfileButtons({
  profiles,
  className,
}: {
  profiles: PortfolioData["socialProfiles"];
  className?: string;
}) {
  const preferredProfiles = HERO_PROFILE_PLATFORMS.map((platform) =>
    profiles.find((profile) => profile.platform.toLowerCase() === platform)
  ).filter(
    (profile): profile is NonNullable<(typeof profiles)[number]> =>
      profile != null && profile.platform.toLowerCase() !== "unknown",
  );

  if (preferredProfiles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {preferredProfiles.map((profile) => (
        <a
          key={`${profile.platform}-${profile.url}`}
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          data-lf-track="social"
          data-lf-label={profile.platform}
        >
          {getPlatformIcon(profile.platform)}
        </a>
      ))}
    </div>
  );
}

export function ProjectActions({
  liveUrl,
  sourceUrl,
  liveClassName,
  sourceClassName,
  label,
  projectId,
}: {
  liveUrl: string | null;
  sourceUrl: string | null;
  liveClassName?: string;
  sourceClassName?: string;
  /** Project title used for analytics labels. */
  label?: string;
  projectId?: string;
}) {
  if (!liveUrl && !sourceUrl) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={liveClassName}
          data-lf-track="project_live"
          data-lf-label={label || undefined}
          data-lf-id={projectId || undefined}
        >
          Live Demo
        </a>
      )}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={sourceClassName}
          data-lf-track="project_source"
          data-lf-label={label || undefined}
          data-lf-id={projectId || undefined}
        >
          Source
        </a>
      )}
    </div>
  );
}

/** Renders a single custom section's items generically. */
function CustomSectionItemValue({ value }: { value: unknown }) {
  if (value == null || value === "") return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <>{String(value)}</>;
  }
  if (Array.isArray(value)) {
    return <>{value.map(String).join(", ")}</>;
  }
  return <>{JSON.stringify(value)}</>;
}

const HIDDEN_ITEM_KEYS = new Set(["id", "sortOrder"]);

export function CustomSectionItems({
  items,
  titleClassName,
  textClassName,
  chipClassName,
  buttonClassName,
}: {
  items: Record<string, unknown>[];
  titleClassName?: string;
  textClassName?: string;
  chipClassName?: string;
  buttonClassName?: string;
}) {
  if (items.length === 0) return null;

  return (
    <CollapsibleList
      initial={4}
      wrapperClassName="space-y-3"
      buttonClassName={
        buttonClassName ??
        "mt-2 text-xs uppercase tracking-[0.18em] text-current/70 hover:text-current"
      }
    >
      {items.map((item, i) => {
        const title = item.title ?? item.name ?? item.label;
        const description = item.description ?? item.details ?? item.summary;
        const date = item.date ?? item.startDate ?? item.year;
        const url = item.url ?? item.link;
        const otherKeys = Object.keys(item).filter(
          (k) =>
            !HIDDEN_ITEM_KEYS.has(k) &&
            !["title", "name", "label", "description", "details", "summary", "date", "startDate", "year", "url", "link"].includes(k)
        );

        return (
          <div key={i} className="space-y-1">
            {title != null && (
              <p className={titleClassName}>
                {url ? (
                  <a
                    href={String(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted hover:decoration-solid"
                    data-lf-track="custom"
                    data-lf-label={title != null ? String(title) : undefined}
                  >
                    <CustomSectionItemValue value={title} />
                  </a>
                ) : (
                  <CustomSectionItemValue value={title} />
                )}
                {date != null && (
                  <span className={textClassName}> ({String(date)})</span>
                )}
              </p>
            )}
            {description != null && String(description).trim() !== "" && (
              <p className={textClassName}><CustomSectionItemValue value={description} /></p>
            )}
            {otherKeys.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {otherKeys.map((k) => {
                  const v = item[k];
                  if (v == null || v === "") return null;
                  return (
                    <span key={k} className={chipClassName}>
                      {k}: <CustomSectionItemValue value={v} />
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </CollapsibleList>
  );
}

export function StatStrip({
  items,
  className,
  labelClassName,
  valueClassName,
}: {
  items: Array<{ label: string; value: string | number | null | undefined }>;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  const visibleItems = items.filter((item) => item.value !== null && item.value !== undefined);

  if (visibleItems.length === 0) return null;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {visibleItems.map((item) => (
        <div key={item.label} className="rounded-2xl border p-4">
          <div className={valueClassName}>{item.value}</div>
          <div className={labelClassName}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function ProfileLinksSection({
  portfolio,
  profiles,
  chipClassName,
  pillClassName,
  titleClassName,
  textClassName,
}: {
  portfolio: PortfolioData["portfolio"];
  profiles: PortfolioData["socialProfiles"];
  chipClassName?: string;
  pillClassName?: string;
  titleClassName?: string;
  textClassName?: string;
}) {
  const hasProfiles =
    profiles.length > 0 ||
    Boolean(
      portfolio.contactEmail ||
      portfolio.phone ||
      portfolio.websiteUrl ||
      portfolio.location
    );

  if (!hasProfiles) return null;

  return (
    <div className="space-y-5">
      <div>
        <p className={cn("text-sm font-medium", titleClassName)}>Reach out</p>
        <p className={cn("mt-2 text-sm", textClassName)}>
          Use these links to connect, collaborate, or explore more work.
        </p>
      </div>

      <ContactChips portfolio={portfolio} chipClassName={chipClassName} />
      <SocialPills profiles={profiles} showUsername className={pillClassName} />
    </div>
  );
}
