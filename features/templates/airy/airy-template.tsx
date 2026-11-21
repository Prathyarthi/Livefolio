import { Fraunces, Outfit } from "next/font/google";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { CollapsibleList } from "../collapsible-list";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import {
  ArticleSourceLabel,
  RichText,
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  HERO_TITLE_BASE,
  HERO_TITLE_SCALE_7XL,
  HERO_HEADLINE_SCALE,
  SocialPills,
  TechChip,
  TemplateNavbar,
  TEMPLATE_CONTAINER,
  getSectionLabels,
  hasNonHeroSocialProfiles,
} from "../shared";

/**
 * Airy — open sky portfolio
 * Subject: altitude and light. The name floats on sky; content breathes in open bands.
 * Not a frosted-card inventory — soft horizon, mist rules, cloud shelves for work.
 *
 * Color: sky #9ec9e8 → mist #eef6fb → paper #f8fcff, ink #243447, accent via --lf-accent
 * Type: Fraunces (display) + Outfit (body)
 * Layout: open hero on sky; sections as air bands; projects as soft cloud shelves
 */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-airy-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
  variable: "--font-airy-display",
});

const ink = "text-[#243447]";
const mute = "text-[#5b6d80]";
const moreBtn =
  "mt-8 self-start rounded-full border border-[#9ec9e8]/50 bg-white/70 px-4 py-2 text-sm font-medium text-[#5b6d80] backdrop-blur-sm transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]";

export function AiryTemplate({ data }: { data: PortfolioData }) {
  const {
    portfolio,
    experiences,
    educations,
    skills,
    projects,
    articles,
    socialProfiles,
    certifications,
    achievements,
    customSections,
    livePreviewProjectIds,
  } = data;
  const primaryColor = resolveAccentColor("airy", portfolio.customization);
  const labels = getSectionLabels(portfolio.customization);
  const groupedSkills = groupSkillsByCategory(skills);
  const githubProfile = socialProfiles.find(
    (profile) => profile.platform.toLowerCase() === "github",
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar,
  );
  const featuredProjects = projects.filter((project) => project.featured);
  const orderedProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("airy"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: cn("flex max-w-[40rem] flex-col gap-3 pl-5 text-base leading-8 marker:text-[var(--lf-accent)]", mute),
        aboutParagraph: cn("max-w-[40rem] text-base leading-8", mute),
        postList: cn("flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed", ink),
        postParagraph: cn("text-sm leading-relaxed", ink),
        descriptionParagraph: cn("text-sm leading-7", mute),
        descriptionList: cn("flex flex-col gap-2 pl-5 text-sm leading-7 marker:text-[var(--lf-accent)]", mute),
        card: "rounded-[1.5rem] border border-white/70 bg-white/55 p-5 shadow-[0_20px_60px_-28px_rgba(56,126,184,0.35)] backdrop-blur-[2px]",
        title: "font-[family-name:var(--font-airy-display)] text-xl font-medium text-[#243447]",
        text: cn("text-sm leading-7", mute),
        muted: "text-sm text-[#7a8fa3]",
        chip: "rounded-full border border-[#9ec9e8]/40 bg-white/80 px-3 py-1.5 text-sm text-[#5b6d80]",
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: "scroll-mt-28",
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className="scroll-mt-28">
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName={cn("max-w-[38rem] text-lg leading-9", mute)}
          listClassName={cn("flex max-w-[38rem] flex-col gap-3 pl-5 text-lg leading-9 marker:text-[var(--lf-accent)]", mute)}
        />
      </section>
    ) : null,

    projects: orderedProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-28 min-w-0">
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="flex min-w-0 flex-col gap-7"
          buttonClassName={moreBtn}
        >
          {orderedProjects.map((project) => (
            <article
              key={project.id}
              className="group grid min-w-0 grid-cols-1 gap-5 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/55 p-3 shadow-[0_24px_70px_-32px_rgba(56,126,184,0.45)] backdrop-blur-[2px] @md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)] @md:items-stretch @md:gap-0 @md:p-0"
            >
              <div className="overflow-hidden rounded-[1.35rem] bg-[#dcebf8]/40 @md:rounded-none @md:rounded-l-[1.75rem]">
                <TemplateProjectPreview
                  templateId="airy"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  accentColor={primaryColor}
                  containerClassName="bg-[#dcebf8]/50"
                />
              </div>
              <div className="flex min-w-0 flex-col justify-center px-2 pb-2 @md:px-7 @md:py-6">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className={cn("font-[family-name:var(--font-airy-display)] text-2xl font-medium tracking-[-0.02em]", ink)}>
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && (
                    <Badge
                      variant="outline"
                      className="h-auto rounded-full border-[#9ec9e8]/60 bg-[#e8f4fc] px-2 py-0 font-sans text-[11px] font-medium tracking-normal text-[var(--lf-accent)]"
                    >
                      Featured
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-3 max-w-[34rem] text-sm leading-7", mute)}
                    listClassName={cn("mt-3 flex max-w-[34rem] flex-col gap-1.5 pl-5 text-sm leading-7", mute)}
                  />
                )}
                {project.techStack.length > 0 && (
                  <p className="mt-4 text-xs text-[#7a8fa3]">
                    {project.techStack.slice(0, 6).join("  ·  ")}
                  </p>
                )}
                <div className="mt-5">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName="rounded-full bg-[#243447] px-4 py-1.5 text-xs font-semibold text-white hover:bg-black"
                    sourceClassName="rounded-full border border-[#9ec9e8]/55 bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#5b6d80] hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]"
                  />
                </div>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className="scroll-mt-28">
        <SectionHeading>{labels.experience}</SectionHeading>
        <div className="relative">
          <div
            aria-hidden
            className="absolute bottom-2 left-[0.35rem] top-2 w-px bg-gradient-to-b from-[#9ec9e8] via-[#c5dff0] to-transparent @md:left-[0.4rem]"
          />
          <CollapsibleList initial={4} wrapperClassName="relative flex flex-col" buttonClassName={moreBtn}>
            {experiences.map((exp) => (
              <article key={exp.id} className="relative grid grid-cols-[1rem_minmax(0,1fr)] gap-4 py-5 @md:gap-6">
                <span
                  aria-hidden
                  className="mt-2 size-2.5 rounded-full bg-[var(--lf-accent)] shadow-[0_0_0_4px_rgba(255,255,255,0.85)]"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className={cn("font-[family-name:var(--font-airy-display)] text-xl font-medium", ink)}>
                      <RichText text={exp.role} />
                    </h3>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-xs tabular-nums text-[#7a8fa3]">
                        {formatDateRange(exp.startDate, exp.endDate)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-[var(--lf-accent)]">
                    <RichText text={exp.company} />
                    {exp.location ? (
                      <span className={cn("font-normal", mute)}>
                        {" · "}
                        <RichText text={exp.location} />
                      </span>
                    ) : null}
                  </p>
                  {exp.description && (
                    <DescriptionBlock
                      text={exp.description}
                      paragraphClassName={cn("mt-3 max-w-[40rem] text-sm leading-7", mute)}
                      listClassName={cn("mt-3 flex max-w-[40rem] flex-col gap-2 pl-5 text-sm leading-7", mute)}
                    />
                  )}
                </div>
              </article>
            ))}
          </CollapsibleList>
        </div>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className="scroll-mt-28">
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {articles.map((article) => (
            <article
              key={article.id}
              className="border-t border-[#9ec9e8]/35 py-5 first:border-t-0 first:pt-0"
            >
              <ArticleSourceLabel source={article.source} className="mb-1 text-[#7a8fa3]" />
              <div className="flex flex-col gap-1 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8">
                <h3 className={cn("font-[family-name:var(--font-airy-display)] text-lg font-medium", ink)}>
                  <a
                    href={article.url}
                    data-lf-track="article"
                    data-lf-label={stripRichTextToPlain(article.title)}
                    data-lf-id={article.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:text-[var(--lf-accent)] hover:underline"
                  >
                    <RichText text={article.title} />
                  </a>
                </h3>
                <p className="shrink-0 text-xs tabular-nums text-[#7a8fa3]">
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : null}
                  {article.readTime != null ? (
                    <span>
                      {article.publishedAt ? " · " : null}
                      {article.readTime} min
                    </span>
                  ) : null}
                </p>
              </div>
              {article.description && (
                <p className={cn("mt-2 max-w-[36rem] text-sm leading-6", mute)}><RichText text={article.description} /></p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills">
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="grid gap-8 @md:grid-cols-2">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category}>
              <h3 className={cn("mb-3 text-sm font-medium text-[var(--lf-accent)]")}>{category}</h3>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <TechChip
                    key={name}
                    name={name}
                    className="rounded-full border border-[#9ec9e8]/40 bg-white/70 px-3 py-1.5 text-sm text-[#456078]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education">
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article key={edu.id} className="border-t border-[#9ec9e8]/35 py-5 first:border-t-0 first:pt-0">
              <h3 className={cn("font-[family-name:var(--font-airy-display)] text-lg font-medium", ink)}>
                <RichText text={edu.degree} />
                {edu.field && (
                  <span className={cn("font-normal", mute)}>
                    {" "}
                    in <RichText text={edu.field} />
                  </span>
                )}
              </h3>
              <p className={cn("mt-1 text-sm", mute)}>
                <RichText text={edu.institution} />
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#7a8fa3]">
                {(edu.startDate || edu.endDate) && (
                  <span className="tabular-nums">{formatDateRange(edu.startDate, edu.endDate)}</span>
                )}
                {edu.gpa && <span>{edu.gpa}</span>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications">
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article
              key={cert.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[#9ec9e8]/35 py-4 first:border-t-0 first:pt-0"
            >
              <div>
                <h3 className={cn("text-sm font-semibold", ink)}>
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--lf-accent)] hover:underline"
                    >
                      {cert.name}
                    </a>
                  ) : (
                    cert.name
                  )}
                </h3>
                <p className="mt-0.5 text-xs text-[#7a8fa3]">{cert.issuer}</p>
              </div>
              {cert.issueDate && (
                <span className="text-xs tabular-nums text-[#7a8fa3]">
                  {new Date(cert.issueDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements">
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col gap-3" buttonClassName={moreBtn}>
          {achievements.map((ach) => (
            <article key={ach.id} className="flex items-start gap-3">
              <Trophy className="mt-0.5 size-4 shrink-0 text-[var(--lf-accent)]" aria-hidden />
              <div>
                <p className={cn("text-sm font-medium", ink)}>
                  <RichText text={ach.title} />
                </p>
                {ach.date && (
                  <p className="mt-0.5 text-xs text-[#7a8fa3]">
                    {new Date(ach.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className="scroll-mt-28">
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName="rounded-full border border-[#9ec9e8]/40 bg-white/80 px-3 py-1.5 text-sm text-[#5b6d80]"
          pillClassName="rounded-full border border-[#9ec9e8]/40 bg-white/80 px-3 py-1.5 text-sm text-[#243447] hover:border-[var(--lf-accent)]"
          titleClassName={ink}
          textClassName="text-[#7a8fa3]"
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github">
        <SectionHeading>{labels.github}</SectionHeading>
        <div className="overflow-x-auto rounded-[1.5rem] border border-white/70 bg-white/50 p-4 shadow-[0_20px_60px_-30px_rgba(56,126,184,0.4)]">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="minimal"
            label={labels.github}
          />
        </div>
      </section>
    ) : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        outfit.variable,
        fraunces.variable,
        "relative min-h-screen overflow-hidden font-[family-name:var(--font-airy-sans)] antialiased",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      {/* Horizon sky — the brand surface, not decoration behind cards */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#9ec9e8_0%,#c5dff0_18%,#e8f4fc_48%,#f8fcff_78%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] overflow-hidden">
        <Cloud className="airy-cloud absolute -left-16 top-16 h-40 w-[28rem] opacity-70 [animation:airy-drift_18s_ease-in-out_infinite]" />
        <Cloud className="airy-cloud absolute right-[-6rem] top-28 h-48 w-[32rem] opacity-55 [animation:airy-drift_22s_ease-in-out_infinite_reverse]" />
        <Cloud className="airy-cloud absolute left-1/3 top-52 h-28 w-[22rem] opacity-40 [animation:airy-drift_26s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes airy-drift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(1.5rem); }
        }
        @media (prefers-reduced-motion: reduce) {
          .airy-cloud { animation: none !important; }
        }
      `}</style>

      <div className="relative mx-auto min-w-0 max-w-6xl overflow-x-clip px-5 pb-24 pt-8 sm:px-8 md:pb-32 md:pt-10">
        {navbarEnabled && (
          <div className="mb-14 flex justify-center">
            <TemplateNavbar
              items={sections}
              className="rounded-full border border-white/80 bg-white/55 shadow-[0_16px_40px_-20px_rgba(56,126,184,0.45)] backdrop-blur-md"
              linkClassName="rounded-full px-4 py-2 text-sm font-medium text-[#5b6d80] transition-colors hover:bg-white/80 hover:text-[var(--lf-accent)]"
            />
          </div>
        )}

        {/* Name in open sky — not inside a card */}
        <header className="relative mb-20 min-h-[18rem] pt-6 @md:mb-28 @md:min-h-[22rem] @md:pt-10">
          <h1
            className={cn(
              HERO_TITLE_BASE,
              HERO_TITLE_SCALE_7XL,
              "max-w-[14ch] font-[family-name:var(--font-airy-display)] font-medium leading-[1.02] tracking-[-0.035em] text-[#1c2d3d]",
            )}
          >
            <RichText text={portfolio.title} />
          </h1>
          {portfolio.headline && (
            <p className={cn(HERO_HEADLINE_SCALE, "mt-6 max-w-[34rem] leading-8", mute)}>
              <RichText text={portfolio.headline} />
            </p>
          )}
          <div className="mt-9 flex flex-col gap-3">
            <ContactChips
              portfolio={portfolio}
              chipClassName="rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-sm text-[#5b6d80] shadow-sm backdrop-blur-sm"
            />
            <div className="flex flex-wrap gap-2">
              <HeroProfileButtons
                profiles={socialProfiles}
                className="rounded-full bg-[#243447] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black"
              />
              {hasNonHeroSocialProfiles(socialProfiles) && (
                <SocialPills
                  profiles={socialProfiles}
                  showUsername
                  excludeHeroPlatforms
                  className="rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-sm text-[#243447] shadow-sm hover:border-[var(--lf-accent)]"
                />
              )}
            </div>
          </div>
        </header>

        <div className="flex min-w-0 flex-col gap-16 @md:gap-20">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
        </div>

        {customSections.length > 0 && (
          <div className="mt-16 grid gap-10 @md:grid-cols-2">
            {customSections.map((cs) => (
              <section key={cs.id}>
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn("font-medium", ink)}
                  textClassName={cn("text-sm", mute)}
                  chipClassName="rounded-full border border-[#9ec9e8]/40 bg-white/70 px-2.5 py-1 text-xs text-[#5b6d80]"
                  buttonClassName={moreBtn}
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-7 font-[family-name:var(--font-airy-display)] text-2xl font-medium tracking-[-0.02em] text-[#1c2d3d] @md:text-[1.75rem]">
      {children}
    </h2>
  );
}

/** Soft cloud silhouette for the sky field. */
function Cloud({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 480 160"
      className={cn("text-white", className)}
      fill="currentColor"
    >
      <ellipse cx="120" cy="98" rx="90" ry="42" />
      <ellipse cx="200" cy="78" rx="70" ry="48" />
      <ellipse cx="280" cy="92" rx="100" ry="46" />
      <ellipse cx="360" cy="100" rx="72" ry="36" />
      <ellipse cx="170" cy="108" rx="110" ry="34" />
    </svg>
  );
}
