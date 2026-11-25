import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import {
  corporatePlexSans as plexSans,
  corporatePlexSerif as plexSerif,
} from "@/features/templates/fonts/ibm-plex";
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
  RichText,
  buildTemplateSections,
  CustomSectionItems,
  DescriptionBlock,
  TechChip,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  HERO_TITLE_BASE,
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
 * Corporate - executive brief portfolio
 * Color: cool slate paper, deep ink hero, restrained accent signals.
 * Type: IBM Plex Serif for names and section titles, IBM Plex Sans for body copy.
 * Layout: one lead work sample with a quiet index of supporting evidence.
 */

const paper = "bg-[#f4f5f7]";
const ink = "text-[#0b1220]";
const mute = "text-[#5c6578]";
const hairline = "border-[#0b1220]/12";
const heroPaper = "text-[#f4f5f7]";
const heroMute = "text-[#c8ced8]";
const moreButton =
  "mt-6 self-start rounded-none border-0 bg-transparent px-0 py-1.5 text-sm font-medium text-[#5c6578] underline-offset-4 hover:text-[#0b1220] hover:underline";

export function CorporateTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("corporate", portfolio.customization);
  const labels = getSectionLabels(portfolio.customization);
  const skillsByCategory = groupSkillsByCategory(skills);
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
    getTemplateSectionLayout("corporate"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: cn("flex flex-col gap-3 pl-5 text-base leading-8", mute, "marker:text-[#0b1220]/30"),
        aboutParagraph: cn("text-base leading-8", mute),
        postList: cn("list-disc flex flex-col gap-2 pl-5 text-sm leading-relaxed", ink),
        postParagraph: cn("text-sm leading-relaxed", ink),
        descriptionParagraph: cn("text-sm leading-7", mute),
        descriptionList: cn("flex flex-col gap-2 pl-5 text-sm leading-7", mute, "marker:text-[#0b1220]/30"),
        card: cn("rounded-none border bg-transparent p-5", hairline),
        title: cn("font-[family-name:var(--font-corporate-serif)] text-xl font-medium", ink),
        text: cn("text-sm leading-7", mute),
        muted: cn("text-sm", mute),
        chip: cn("rounded-none border px-2.5 py-1 text-sm", hairline, mute),
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: cn("scroll-mt-28 border-t pt-12", hairline),
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName={cn("whitespace-pre-line text-lg leading-8", mute)}
          listClassName={cn("flex flex-col gap-3 pl-5 text-lg leading-8", mute, "marker:text-[#0b1220]/30")}
        />
      </section>
    ) : null,

    projects: orderedProjects.length > 0 ? (
      <section key="projects" id="work" className={cn("scroll-mt-28 min-w-0 border-t pt-12", hairline)}>
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList initial={5} wrapperClassName="flex flex-col" buttonClassName={moreButton}>
          {orderedProjects.map((project) => (
            <article
              key={project.id}
              className={cn("grid min-w-0 grid-cols-1 gap-4 border-t py-6 first:border-t-0 first:pt-0 @md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_9.5rem] @md:items-start @md:gap-8", hairline)}
            >
              <div className="aspect-[8/5] w-full overflow-hidden rounded-none border border-[#0b1220]/10 bg-white">
                <TemplateProjectPreview
                  templateId="corporate"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  accentColor={primaryColor}
                  containerClassName="size-full bg-white"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className={cn("font-[family-name:var(--font-corporate-serif)] text-xl font-medium tracking-tight", ink)}>
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && (
                    <Badge
                      variant="outline"
                      className="h-auto rounded-none border-[var(--lf-accent)] bg-transparent px-2 py-0.5 text-xs font-medium tracking-normal text-[var(--lf-accent)]"
                    >
                      Featured
                    </Badge>
                  )}
                </div>
                {project.language && <p className={cn("mt-1 text-sm", mute)}>{project.language}</p>}
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-2 text-sm leading-6", mute)}
                    listClassName={cn("mt-2 flex flex-col gap-1.5 pl-5 text-sm leading-6", mute, "marker:text-[#0b1220]/30")}
                  />
                )}
                {(project.techStack.length > 0 ||
                  project.githubStars !== null ||
                  project.githubForks !== null) && (
                  <p className={cn("mt-3 text-xs leading-5", mute)}>
                    {[
                      ...project.techStack.slice(0, 6),
                      project.githubStars !== null ? `${project.githubStars} stars` : null,
                      project.githubForks !== null ? `${project.githubForks} forks` : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
              <div className="shrink-0 @md:pt-1">
                <ProjectActions
                  liveUrl={project.liveUrl}
                  sourceUrl={project.sourceUrl}
                  label={stripRichTextToPlain(project.title)}
                  projectId={project.id}
                  liveClassName="rounded-none border border-[#0b1220]/20 bg-transparent px-3 py-1.5 text-xs font-medium text-[#0b1220] hover:border-[#0b1220]/45 hover:bg-transparent"
                  sourceClassName="rounded-none px-3 py-1.5 text-xs font-medium text-[#5c6578] hover:bg-transparent hover:text-[#0b1220] hover:underline"
                />
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreButton}>
          {experiences.map((exp) => (
            <article
              key={exp.id}
              className={cn("grid grid-cols-1 gap-3 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-10", hairline)}
            >
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>
                {formatDateRange(exp.startDate, exp.endDate) || "Present"}
              </p>
              <div className="min-w-0">
                <h3 className={cn("font-[family-name:var(--font-corporate-serif)] text-xl font-medium tracking-tight", ink)}>
                  <RichText text={exp.role} />
                </h3>
                <p className="mt-1 text-sm font-medium text-[var(--lf-accent)]">
                  <RichText text={exp.company} />
                  {exp.location ? (
                    <span className={mute}>
                      {" in "}
                      <RichText text={exp.location} />
                    </span>
                  ) : null}
                </p>
                {exp.description && (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-4 max-w-[42rem] text-sm leading-7", mute)}
                    listClassName={cn("mt-4 max-w-[42rem] flex flex-col gap-2 pl-5 text-sm leading-7", mute, "marker:text-[#0b1220]/30")}
                  />
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList initial={5} wrapperClassName="flex flex-col" buttonClassName={moreButton}>
          {articles.map((article) => (
            <article key={article.id} className={cn("border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <div className="flex min-w-0 flex-col gap-2 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8">
                <h3 className={cn("min-w-0 font-[family-name:var(--font-corporate-serif)] text-lg font-medium tracking-tight", ink)}>
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
                <p className={cn("shrink-0 text-sm tabular-nums", mute)}>
                  {formatArticleDate(article.publishedAt)}
                  {article.readTime != null ? `${article.publishedAt ? ", " : ""}${article.readTime} min` : null}
                </p>
              </div>
              {article.description && (
                <p className={cn("mt-2 max-w-[42rem] text-sm leading-6", mute)}><RichText text={article.description} /></p>
              )}
              {(article.source || article.tags.length > 0) && (
                <p className={cn("mt-2 text-xs leading-5", mute)}>
                  {[article.source, ...article.tags].filter(Boolean).join(", ")}
                </p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="grid grid-cols-1 gap-7 @md:grid-cols-2">
          {Object.entries(skillsByCategory).map(([category, names]) => (
            <div key={category} className="min-w-0">
              <h3 className={cn("mb-2 font-[family-name:var(--font-corporate-serif)] text-lg font-medium", ink)}>{category}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {names.map((name) => (
                  <TechChip key={name} name={name} className={cn("text-base leading-7", mute)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreButton}>
          {educations.map((edu) => (
            <article
              key={edu.id}
              className={cn("grid grid-cols-1 gap-3 border-t py-6 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-10", hairline)}
            >
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>
                {formatDateRange(edu.startDate, edu.endDate) || "Completed"}
              </p>
              <div className="min-w-0">
                <h3 className={cn("font-[family-name:var(--font-corporate-serif)] text-lg font-medium", ink)}>
                  <RichText text={edu.degree} />
                  {edu.field ? (
                    <>
                      {" "}
                      in <RichText text={edu.field} />
                    </>
                  ) : null}
                </h3>
                <p className={cn("mt-1 text-sm", mute)}>
                  <RichText text={edu.institution} />
                </p>
                {edu.gpa && <p className={cn("mt-2 text-xs", mute)}>{edu.gpa}</p>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreButton}>
          {certifications.map((cert) => (
            <article
              key={cert.id}
              className={cn("flex min-w-0 flex-col gap-2 border-t py-5 first:border-t-0 first:pt-0 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8", hairline)}
            >
              <div className="min-w-0">
                <h3 className={cn("text-base font-medium", ink)}>
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:text-[var(--lf-accent)] hover:underline"
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
                <p className={cn("shrink-0 text-sm tabular-nums", mute)}>{formatArticleDate(cert.issueDate)}</p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreButton}>
          {achievements.map((ach) => (
            <article key={ach.id} className={cn("flex items-start gap-3 border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <Trophy className="mt-0.5 size-4 shrink-0 text-[var(--lf-accent)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm leading-relaxed", ink)}>
                  <RichText text={ach.title} />
                </p>
                {ach.date && <p className={cn("mt-1 text-xs", mute)}>{formatArticleDate(ach.date)}</p>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName={cn("rounded-none border px-2.5 py-1 text-sm", hairline, mute)}
          pillClassName={cn("rounded-none border px-2.5 py-1 text-sm transition-colors hover:border-[#0b1220]/35", hairline, ink)}
          titleClassName={ink}
          textClassName={mute}
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.github}</SectionHeading>
        <div className="min-w-0 overflow-x-auto">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="corporate"
            stretch
            className="mt-0 border-0 pt-0"
            label={null}
          />
        </div>
      </section>
    ) : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        plexSans.variable,
        plexSerif.variable,
        paper,
        "min-h-screen font-[family-name:var(--font-corporate-sans)] antialiased",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      <header className="bg-[#0b1220] text-[#f4f5f7]">
        <div className="mx-auto min-w-0 max-w-6xl px-5 py-12 sm:px-6 md:px-8 md:py-18">
          <div className="grid min-w-0 grid-cols-1 gap-10 @lg:grid-cols-[minmax(0,1fr)_18rem] @lg:items-end">
            <div className="min-w-0">
              <h1
                className={cn(
                  HERO_TITLE_BASE,
                  "font-[family-name:var(--font-corporate-serif)] text-4xl font-medium leading-[1.04] tracking-[-0.035em] @sm:text-5xl @md:text-6xl @lg:text-7xl",
                  heroPaper,
                )}
              >
                <RichText text={portfolio.title} />
              </h1>
              {portfolio.headline && (
                <p className={cn("mt-6 max-w-[42rem] text-lg leading-8 @md:text-xl", heroMute)}>
                  <RichText text={portfolio.headline} />
                </p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-4 @lg:items-start">
              <HeroContactLine portfolio={portfolio} />
              <HeroProfileButtons
                profiles={socialProfiles}
                className="rounded-none border-0 bg-transparent px-0 py-0 text-sm text-[#f4f5f7] underline-offset-4 hover:bg-transparent hover:text-white hover:underline"
              />
              {hasNonHeroSocialProfiles(socialProfiles) && (
                <SocialPills
                  profiles={socialProfiles}
                  excludeHeroPlatforms
                  className="rounded-none border-0 bg-transparent px-0 py-0 text-sm text-[#c8ced8] underline-offset-4 hover:bg-transparent hover:text-white hover:underline"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-6xl px-5 pb-16 pt-8 sm:px-6 md:px-8 md:pb-24 md:pt-10">
        {navbarEnabled && (
          <div className="mb-10">
            <TemplateNavbar
              items={sections}
              className={cn("rounded-none border-0 bg-transparent", hairline)}
              linkClassName={cn("rounded-none px-0 py-3 text-sm transition-colors hover:text-[#0b1220]", mute)}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-4">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
        </div>

        {customSections.length > 0 && (
          <div className={cn("mt-4 grid gap-12 border-t pt-12 md:grid-cols-2", hairline)}>
            {customSections.map((cs) => (
              <section key={cs.id}>
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn("font-medium", ink)}
                  textClassName={cn("text-sm", mute)}
                  chipClassName={cn("rounded-none border px-2 py-0.5 text-xs", hairline, mute)}
                  buttonClassName={moreButton}
                />
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className={cn("font-[family-name:var(--font-corporate-serif)] text-2xl font-medium tracking-[-0.015em] md:text-[1.75rem]", ink)}>
        {children}
      </h2>
      <Separator className="mt-4 bg-[#0b1220]/12" />
    </div>
  );
}

function HeroContactLine({ portfolio }: { portfolio: PortfolioData["portfolio"] }) {
  const items = [
    portfolio.location ? { key: "location", label: portfolio.location } : null,
    portfolio.contactEmail
      ? { key: "email", label: portfolio.contactEmail, href: `mailto:${portfolio.contactEmail}` }
      : null,
    portfolio.phone ? { key: "phone", label: portfolio.phone, href: `tel:${portfolio.phone}` } : null,
    portfolio.websiteUrl
      ? {
          key: "website",
          label: portfolio.websiteUrl.replace(/^https?:\/\//, ""),
          href: portfolio.websiteUrl,
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; href?: string }>;

  if (items.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-sm leading-6 text-[#c8ced8]">
      {items.map((item) =>
        item.href ? (
          <a
            key={item.key}
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="max-w-full [overflow-wrap:anywhere] underline-offset-4 hover:text-white hover:underline"
          >
            {item.label}
          </a>
        ) : (
          <span key={item.key} className="max-w-full [overflow-wrap:anywhere]">
            {item.label}
          </span>
        ),
      )}
    </div>
  );
}

function formatArticleDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}
