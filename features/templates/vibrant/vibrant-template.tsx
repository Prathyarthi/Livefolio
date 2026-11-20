import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArticleSourceLabel,
  RichText,
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  TechChip,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  HERO_HEADER_COLUMN,
  HERO_TITLE_BASE,
  HERO_TITLE_SCALE_7XL,
  HERO_HEADLINE_SCALE,
  SocialPills,
  hasNonHeroSocialProfiles,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
  getSectionLabels,
} from "../shared";
import { CollapsibleList } from "../collapsible-list";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";

/**
 * Vibrant — dark stage, one accent wash
 * Subject: a portfolio presented like a stage; the accent is a single light
 * that falls on the hero and the lead project, nowhere else.
 * Type: Bricolage Grotesque (display, tight and heavy) + DM Sans (body)
 * Layout: oversized name, one cinematic lead project, quiet index below
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-vibrant-display",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-vibrant-sans",
});

const ink = "text-zinc-50";
const mute = "text-zinc-400";
const line = "border-white/10";
const displayFont = "font-[family-name:var(--font-vibrant-display)]";
const moreBtn =
  "mt-6 self-start rounded-full border border-white/15 bg-transparent px-4 py-1.5 text-sm text-zinc-300 transition-colors hover:border-white/40 hover:text-white";

function formatMonthYear(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function VibrantTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("vibrant", portfolio.customization);
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
  const visibleProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("vibrant"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: `flex flex-col gap-3 pl-5 text-base leading-8 ${mute} marker:text-zinc-600`,
        aboutParagraph: `text-base leading-8 ${mute}`,
        postList: `list-disc flex flex-col gap-2 pl-5 text-sm leading-relaxed ${ink}`,
        postParagraph: `text-sm leading-relaxed ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${mute}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${mute} marker:text-zinc-600`,
        card: `rounded-xl border ${line} bg-white/[0.02] p-5`,
        title: `${displayFont} text-lg font-semibold ${ink}`,
        text: `text-sm leading-7 ${mute}`,
        muted: `text-sm ${mute}`,
        chip: `rounded-full border ${line} px-3 py-1 text-sm ${mute}`,
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: `scroll-mt-24`,
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className="scroll-mt-24">
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName={cn("max-w-2xl whitespace-pre-line text-xl leading-9", "text-zinc-300")}
          listClassName="max-w-2xl flex flex-col gap-3 pl-5 text-xl leading-9 text-zinc-300 marker:text-zinc-600"
        />
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-24 min-w-0">
        <SectionHeading>{labels.projects}</SectionHeading>

        <CollapsibleList
          initial={4}
          wrapperClassName="grid min-w-0 grid-cols-1 gap-x-8 gap-y-12 @md:grid-cols-2"
          buttonClassName={cn("col-span-full", moreBtn)}
        >
          {visibleProjects.map((project) => (
            <article key={project.id} className="flex min-w-0 flex-col">
              <TemplateProjectPreview
                templateId="vibrant"
                liveUrl={project.liveUrl ?? null}
                imageUrl={project.imageUrl ?? null}
                projectId={project.id}
                livePreviewProjectIds={livePreviewProjectIds}
                alt={stripRichTextToPlain(project.title)}
                loading="lazy"
                containerClassName="overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10"
                accentColor={primaryColor}
              />
              <div className="mt-5 flex min-w-0 grow flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={cn(
                      displayFont,
                      "min-w-0 text-balance text-2xl font-semibold tracking-tight",
                      ink,
                    )}
                  >
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && (
                    <Badge
                      variant="outline"
                      className="h-auto rounded-full border-[var(--lf-accent)]/50 bg-transparent px-2 py-0 font-sans text-[11px] font-medium tracking-normal text-[var(--lf-accent)]"
                    >
                      Featured
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-2 text-sm leading-7", mute)}
                    listClassName={cn("mt-2 flex flex-col gap-1.5 pl-5 text-sm leading-7", mute)}
                  />
                )}
                {project.techStack.length > 0 && (
                  <p className="mt-3 text-xs text-zinc-500">
                    {project.techStack.slice(0, 5).join(", ")}
                  </p>
                )}
                <div className="mt-auto pt-4">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName="rounded-full border border-white/15 bg-transparent px-3 py-1 text-xs font-medium text-zinc-100 hover:bg-white/10 hover:text-white"
                    sourceClassName="rounded-full px-2 py-1 text-xs font-medium text-zinc-400 hover:text-white"
                  />
                </div>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className="scroll-mt-24">
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="relative flex flex-col"
          buttonClassName={cn("ml-8", moreBtn)}
        >
          {experiences.map((exp, index) => (
            <article
              key={exp.id}
              className="relative grid grid-cols-1 gap-2 pb-10 pl-8 last:pb-0 @md:grid-cols-[9rem_minmax(0,1fr)] @md:gap-8"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-2 size-2.5 rounded-full",
                  index === 0
                    ? "bg-[var(--lf-accent)]"
                    : "bg-zinc-950 ring-1 ring-zinc-600",
                )}
              />
              <span
                aria-hidden
                className="absolute bottom-0 left-[4.5px] top-6 w-px bg-white/10"
              />
              <p className={cn("pt-0.5 text-sm tabular-nums", mute)}>
                {formatDateRange(exp.startDate, exp.endDate) || "—"}
              </p>
              <div className="min-w-0">
                <h3 className={cn(displayFont, "text-xl font-semibold tracking-tight", ink)}>
                  <RichText text={exp.role} />
                </h3>
                <p className="mt-1 text-sm text-zinc-300">
                  <RichText text={exp.company} />
                  {exp.location ? (
                    <span className="text-zinc-500">
                      , <RichText text={exp.location} />
                    </span>
                  ) : null}
                </p>
                {exp.description && (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-4 max-w-2xl text-sm leading-7", mute)}
                    listClassName={cn("mt-4 max-w-2xl flex flex-col gap-2 pl-5 text-sm leading-7", mute, "marker:text-zinc-600")}
                  />
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills">
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="flex flex-col">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div
              key={category}
              className={cn(
                "grid grid-cols-1 gap-3 border-t py-5 first:border-t-0 first:pt-0 @md:grid-cols-[9rem_minmax(0,1fr)] @md:gap-8",
                line,
              )}
            >
              <h3 className={cn("text-sm", mute)}>{category}</h3>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <TechChip
                    key={name}
                    name={name}
                    className="cursor-default rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-zinc-200"
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
            <article
              key={edu.id}
              className={cn(
                "grid grid-cols-1 gap-2 border-t py-6 first:border-t-0 first:pt-0 @md:grid-cols-[9rem_minmax(0,1fr)] @md:gap-8",
                line,
              )}
            >
              <p className={cn("pt-0.5 text-sm tabular-nums", mute)}>
                {formatDateRange(edu.startDate, edu.endDate) || "—"}
              </p>
              <div className="min-w-0">
                <h3 className={cn(displayFont, "text-lg font-semibold", ink)}>
                  <RichText text={edu.degree} />
                  {edu.field && (
                    <span className="font-normal text-zinc-400">
                      {" "}
                      in <RichText text={edu.field} />
                    </span>
                  )}
                </h3>
                <p className={cn("mt-1 text-sm", mute)}>
                  <RichText text={edu.institution} />
                </p>
                {edu.gpa && <p className="mt-2 text-xs text-zinc-500">{edu.gpa}</p>}
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
              className={cn(
                "flex min-w-0 flex-col gap-1 border-t py-5 first:border-t-0 first:pt-0 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8",
                line,
              )}
            >
              <div className="min-w-0">
                <h3 className={cn("text-base font-medium", ink)}>
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {cert.name}
                    </a>
                  ) : (
                    cert.name
                  )}
                </h3>
                <p className={cn("mt-1 text-sm", mute)}>{cert.issuer}</p>
              </div>
              {cert.issueDate && (
                <p className="shrink-0 text-sm tabular-nums text-zinc-500">
                  {formatMonthYear(cert.issueDate)}
                </p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements">
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {achievements.map((ach) => (
            <article
              key={ach.id}
              className={cn(
                "flex items-start gap-3 border-t py-5 first:border-t-0 first:pt-0",
                line,
              )}
            >
              <Trophy className="mt-1 size-4 shrink-0 text-[var(--lf-accent)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className={cn("text-base leading-relaxed", ink)}>
                  <RichText text={ach.title} />
                </p>
                {ach.date && (
                  <p className="mt-1 text-xs text-zinc-500">{formatMonthYear(ach.date)}</p>
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className="scroll-mt-24">
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {articles.map((article) => (
            <article
              key={article.id}
              className={cn("border-t py-6 first:border-t-0 first:pt-0", line)}
            >
              <ArticleSourceLabel source={article.source} className="mb-1.5 text-zinc-500" />
              <div className="flex min-w-0 flex-col gap-1 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8">
                <h3 className={cn(displayFont, "min-w-0 text-xl font-semibold tracking-tight", ink)}>
                  <a
                    href={article.url}
                    data-lf-track="article"
                    data-lf-label={stripRichTextToPlain(article.title)}
                    data-lf-id={article.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    <RichText text={article.title} />
                  </a>
                </h3>
                <p className="shrink-0 text-sm tabular-nums text-zinc-500">
                  {article.publishedAt ? formatMonthYear(article.publishedAt) : null}
                  {article.readTime != null ? (
                    <span>
                      {article.publishedAt ? ", " : null}
                      {article.readTime} min read
                    </span>
                  ) : null}
                </p>
              </div>
              {article.description && (
                <p className={cn("mt-2 max-w-2xl text-sm leading-7", mute)}>{article.description}</p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className="scroll-mt-24">
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName={cn("rounded-full border px-3 py-1.5 text-sm", line, "text-zinc-300")}
          pillClassName={cn(
            "rounded-full border px-3 py-1.5 text-sm text-zinc-100 transition-colors hover:bg-white/10",
            line,
          )}
          titleClassName={cn(displayFont, "text-2xl font-semibold", ink)}
          textClassName={mute}
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github">
        <SectionHeading>{labels.github}</SectionHeading>
        <div className={cn("overflow-x-auto rounded-xl border p-5 custom-scrollbar", line)}>
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="modern"
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
        display.variable,
        sans.variable,
        "relative min-h-screen bg-[#08080b] font-[family-name:var(--font-vibrant-sans)] antialiased selection:bg-[var(--lf-accent)] selection:text-white",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      {/* The one accent wash: a single light behind the hero and lead work. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[900px]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, color-mix(in srgb, var(--lf-accent) 30%, transparent), transparent 70%)",
        }}
      />

      {navbarEnabled && (
        <TemplateNavbar
          items={sections}
          className="border-x-0 border-t-0 border-white/10 bg-[#08080b]/75"
          linkClassName="px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
        />
      )}

      <div className="relative mx-auto min-w-0 max-w-6xl overflow-x-clip px-5 pb-20 pt-16 sm:px-6 md:px-8 md:pb-32 md:pt-28">
        <header className={cn(HERO_HEADER_COLUMN, "max-w-3xl space-y-4")}>
          <h1
            className={cn(
              HERO_TITLE_BASE,
              HERO_TITLE_SCALE_7XL,
              displayFont,
              "max-w-[14ch] font-extrabold leading-tight tracking-[-0.035em]",
              ink,
            )}
          >
            <RichText text={portfolio.title} />
          </h1>
          {portfolio.headline && (
            <p className={cn(HERO_HEADLINE_SCALE, "max-w-xl text-zinc-300")}>
              <RichText text={portfolio.headline} />
            </p>
          )}

          <div className="flex flex-col gap-4">
            <HeroProfileButtons
              profiles={socialProfiles}
              className="rounded-full bg-[var(--lf-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            />
            <ContactChips
              portfolio={portfolio}
              chipClassName="text-sm text-zinc-400"
            />
            {hasNonHeroSocialProfiles(socialProfiles) && (
              <SocialPills
                profiles={socialProfiles}
                showUsername
                excludeHeroPlatforms
                className="text-sm text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline"
              />
            )}
          </div>
        </header>

        <div className="mt-28 flex min-w-0 flex-col gap-24 md:mt-40 md:gap-32">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}

          {customSections.length > 0 &&
            customSections.map((cs) => (
              <section key={cs.id} className="scroll-mt-24">
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn(displayFont, "text-xl font-semibold", ink)}
                  textClassName={cn("text-sm leading-7", mute)}
                  chipClassName="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-zinc-400"
                  buttonClassName={moreBtn}
                />
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2
        className={cn(
          displayFont,
          "text-3xl font-bold tracking-[-0.03em] md:text-5xl",
          ink,
        )}
      >
        {children}
      </h2>
      <Separator className="mt-5 bg-white/10" />
    </div>
  );
}
