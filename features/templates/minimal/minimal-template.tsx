import { Inter_Tight, Newsreader } from "next/font/google";
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
import { LinkedInSection } from "@/features/templates/components/linkedin-section";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";

/**
 * Minimal — gallery wall
 * Color: cool paper #f7f7f5 (not cream), ink #171614, mute #6a6760
 * Type: Newsreader (name / titles) + Inter Tight (UI)
 * Layout: long measure, one lead exhibit, indexes for the rest
 * Avoids the cream + terracotta + serif AI cluster
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-minimal-display",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-minimal-sans",
});

const ink = "text-[#171614]";
const mute = "text-[#6a6760]";
const hairline = "border-[#171614]/12";
const moreBtn =
  "mt-6 self-start rounded-none border-0 bg-transparent px-0 py-1.5 font-sans text-sm text-[#6a6760] underline-offset-4 hover:text-[#171614] hover:underline";

export function MinimalTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("minimal", portfolio.customization);
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
  const orderedProjects = visibleProjects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("minimal"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: `flex flex-col gap-3 pl-5 text-base leading-8 ${mute} marker:text-[#171614]/25`,
        aboutParagraph: `text-base leading-8 ${mute}`,
        postList: `list-disc flex flex-col gap-2 pl-5 text-sm leading-relaxed ${ink}`,
        postParagraph: `text-sm leading-relaxed ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${mute}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${mute} marker:text-[#171614]/25`,
        section: `scroll-mt-28 border-t ${hairline} pt-12`,
        card: `rounded-none border ${hairline} bg-white p-5`,
        title: `font-[family-name:var(--font-minimal-display)] text-xl font-medium ${ink}`,
        text: `text-sm leading-7 ${mute}`,
        muted: `text-sm ${mute}`,
        chip: `rounded-none border ${hairline} bg-transparent px-2.5 py-1 text-sm ${mute}`,
        link: "text-sm text-[var(--lf-accent)] underline-offset-4 hover:underline",
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName={cn("max-w-[38rem] whitespace-pre-line text-lg leading-8", mute)}
          listClassName={cn(
            "max-w-[38rem] flex flex-col gap-3 pl-5 text-lg leading-8",
            mute,
            "marker:text-[#171614]/25",
          )}
        />
      </section>
    ) : null,

    projects: orderedProjects.length > 0 ? (
      <section key="projects" id="work" className={cn("scroll-mt-28 min-w-0 border-t pt-12", hairline)}>
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {orderedProjects.map((project) => (
            <article
              key={project.id}
              className={cn(
                "grid min-w-0 grid-cols-1 gap-4 border-t py-7 @md:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_auto] @md:items-start @md:gap-8",
                hairline,
              )}
            >
              <div className={cn("overflow-hidden border", hairline)}>
                <TemplateProjectPreview
                  templateId="minimal"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  accentColor={primaryColor}
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3
                    className={cn(
                      "font-[family-name:var(--font-minimal-display)] text-xl font-medium",
                      ink,
                    )}
                  >
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && (
                    <Badge
                      variant="outline"
                      className="h-auto rounded-none border-[var(--lf-accent)]/50 bg-transparent px-1.5 py-0 font-sans text-[11px] font-medium tracking-normal text-[var(--lf-accent)]"
                    >
                      Featured
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-2 max-w-[34rem] text-sm leading-6", mute)}
                    listClassName={cn("mt-2 max-w-[34rem] flex flex-col gap-1.5 pl-5 text-sm leading-6", mute)}
                  />
                )}
                {project.techStack.length > 0 && (
                  <p className={cn("mt-3 text-xs", mute)}>
                    {project.techStack.slice(0, 6).join(" · ")}
                  </p>
                )}
              </div>
              <div className="shrink-0 @md:pt-1">
                <ProjectActions
                  liveUrl={project.liveUrl}
                  sourceUrl={project.sourceUrl}
                  label={stripRichTextToPlain(project.title)}
                  projectId={project.id}
                  liveClassName={cn(
                    "rounded-none border bg-transparent px-3 py-1.5 text-xs font-medium hover:bg-[#171614]/[0.04]",
                    hairline,
                    ink,
                  )}
                  sourceClassName={cn("rounded-none px-3 py-1.5 text-xs font-medium hover:underline", mute)}
                />
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section
        key="experience"
        id="experience"
        className={cn("scroll-mt-28 border-t pt-12", hairline)}
      >
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {experiences.map((exp) => (
            <article
              key={exp.id}
              className={cn(
                "grid grid-cols-1 gap-2 border-t py-7 @md:grid-cols-[8.5rem_minmax(0,1fr)] @md:gap-10",
                hairline,
              )}
            >
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>
                {formatDateRange(exp.startDate, exp.endDate) || "—"}
              </p>
              <div>
                <h3
                  className={cn(
                    "font-[family-name:var(--font-minimal-display)] text-xl font-medium",
                    ink,
                  )}
                >
                  <RichText text={exp.role} />
                </h3>
                <p className="mt-1 text-sm">
                  <span className="text-[var(--lf-accent)]">
                    <RichText text={exp.company} />
                  </span>
                  {exp.location ? (
                    <span className={mute}>
                      {" · "}
                      <RichText text={exp.location} />
                    </span>
                  ) : null}
                </p>
                {exp.description && (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-4 max-w-[36rem] text-sm leading-7", mute)}
                    listClassName={cn("mt-4 max-w-[36rem] flex flex-col gap-2 pl-5 text-sm leading-7", mute)}
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
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {articles.map((article) => (
            <article key={article.id} className={cn("border-t py-5", hairline)}>
              <ArticleSourceLabel source={article.source} className={cn("mb-1 opacity-80", mute)} />
              <div className="flex flex-col gap-1 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8">
                <h3
                  className={cn(
                    "font-[family-name:var(--font-minimal-display)] text-lg font-medium",
                    ink,
                  )}
                >
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
                <p className={cn("shrink-0 text-sm tabular-nums", mute)}>
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
                <p className={cn("mt-2 max-w-[36rem] text-sm leading-6", mute)}>{article.description}</p>
              )}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="flex flex-col gap-6">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category}>
              <h3 className={cn("mb-2 text-sm", mute)}>{category}</h3>
              <p className={cn("max-w-[40rem] text-base leading-7", ink)}>{names.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article
              key={edu.id}
              className={cn(
                "grid grid-cols-1 gap-2 border-t py-6 @md:grid-cols-[8.5rem_minmax(0,1fr)] @md:gap-10",
                hairline,
              )}
            >
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>
                {formatDateRange(edu.startDate, edu.endDate) || "—"}
              </p>
              <div>
                <h3
                  className={cn(
                    "font-[family-name:var(--font-minimal-display)] text-lg font-medium",
                    ink,
                  )}
                >
                  <RichText text={edu.degree} />
                  {edu.field && (
                    <span className={mute}>
                      {" "}
                      in <RichText text={edu.field} />
                    </span>
                  )}
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
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article key={cert.id} className={cn("border-t py-5", hairline)}>
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
              <p className={cn("mt-1 text-sm", mute)}>
                {cert.issuer}
                {cert.issueDate
                  ? ` · ${new Date(cert.issueDate).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}`
                  : null}
              </p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {achievements.map((ach) => (
            <article key={ach.id} className={cn("flex items-start gap-3 border-t py-5", hairline)}>
              <Trophy className="mt-0.5 size-4 shrink-0 text-[var(--lf-accent)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm leading-relaxed", ink)}>
                  <RichText text={ach.title} />
                </p>
                {ach.date && (
                  <p className={cn("mt-1 text-xs", mute)}>
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
      <section key="profiles" id="profiles" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName={cn("rounded-none border px-2.5 py-1 text-sm", hairline, mute)}
          pillClassName={cn(
            "rounded-none border px-2.5 py-1 text-sm transition-colors hover:bg-[#171614]/[0.04]",
            hairline,
            ink,
          )}
          titleClassName={ink}
          textClassName={mute}
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.github}</SectionHeading>
        <GitHubContributionHeatmap
          calendar={contributionCalendar}
          profileUrl={githubProfile?.url}
          username={githubProfile?.username}
          variant="minimal"
          label={labels.github}
        />
      </section>
    ) : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        newsreader.variable,
        interTight.variable,
        "min-h-screen bg-[#f7f7f5] font-[family-name:var(--font-minimal-sans)] antialiased",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="relative mx-auto min-w-0 max-w-[44rem] overflow-x-clip px-5 pb-16 pt-12 sm:px-6 md:pb-28 md:pt-20">
        <header className="min-w-0">
          <h1
            className={cn(
              HERO_TITLE_BASE,
              "font-[family-name:var(--font-minimal-display)] text-4xl font-medium leading-[1.08] tracking-[-0.03em] @sm:text-5xl @md:text-6xl",
              ink,
            )}
          >
            <RichText text={portfolio.title} />
          </h1>
          {portfolio.headline && (
            <p className={cn("mt-5 max-w-[28rem] text-lg leading-8", mute)}>
              <RichText text={portfolio.headline} />
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <ContactChips
              portfolio={portfolio}
              chipClassName={cn(
                "rounded-none border-0 bg-transparent px-0 py-0 text-sm underline-offset-4 hover:underline",
                mute,
              )}
            />
            <HeroProfileButtons
              profiles={socialProfiles}
              className={cn(
                "rounded-none border px-3 py-1.5 text-sm transition-colors hover:bg-[#171614]/[0.04]",
                hairline,
                ink,
              )}
            />
            {hasNonHeroSocialProfiles(socialProfiles) && (
              <SocialPills
                profiles={socialProfiles}
                showUsername
                excludeHeroPlatforms
                className={cn(
                  "rounded-none border px-2.5 py-1 text-sm transition-colors hover:bg-[#171614]/[0.04]",
                  hairline,
                  mute,
                )}
              />
            )}
          </div>
        </header>

        {navbarEnabled && (
          <div className="mt-12">
            <TemplateNavbar
              items={sections}
              className={cn("rounded-none border-x-0 border-b border-t-0 bg-transparent", hairline)}
              linkClassName={cn(
                "rounded-none px-0 py-3 text-sm transition-colors hover:text-[#171614]",
                mute,
              )}
            />
          </div>
        )}

        <div className="mt-12 flex min-w-0 flex-col gap-2 md:mt-16">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
        </div>

        {customSections.length > 0 && (
          <div className={cn("mt-2 flex flex-col gap-12 border-t pt-12", hairline)}>
            {customSections.map((cs) => (
              <section key={cs.id}>
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn("font-medium", ink)}
                  textClassName={cn("text-sm", mute)}
                  chipClassName={cn("rounded-none border px-2 py-0.5 text-xs", hairline, mute)}
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
    <div className="mb-8">
      <h2
        className={cn(
          "font-[family-name:var(--font-minimal-display)] text-2xl font-medium tracking-tight md:text-[1.65rem]",
          ink,
        )}
      >
        {children}
      </h2>
      <Separator className="mt-4 bg-[#171614]/12" />
    </div>
  );
}
