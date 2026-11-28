import { Inter_Tight } from "next/font/google";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import { CollapsibleList } from "../collapsible-list";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import {
  ArticleSourceLabel,
  RichText,
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  TechChip,
  HERO_HEADER_COLUMN,
  HERO_HEADLINE_SCALE,
  HERO_TITLE_BASE,
  HERO_TITLE_SCALE_7XL,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  SocialPills,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
  getSectionLabels,
  hasNonHeroSocialProfiles,
} from "../shared";
import type { PortfolioData } from "../types";
import { formatDateRange, groupSkillsByCategory } from "../utils";

/**
 * Monochrome — ink study
 * Color: white #fff, black #000, gray scale only; accent appears only as one featured signal
 * Type: Inter Tight throughout, with strong weight contrast
 * Layout: photography-forward project lead, hairline rules, no pill inventory
 */
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-monochrome-sans",
});

const ink = "text-black";
const mute = "text-neutral-600";
const pale = "text-neutral-400";
const hairline = "border-neutral-200";
const strongRule = "border-black";
const moreBtn =
  "mt-7 self-start rounded-none border border-black bg-white px-4 py-2 text-sm font-medium text-black shadow-none hover:bg-black hover:text-white";

export function MonochromeTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("monochrome", portfolio.customization);
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
    getTemplateSectionLayout("monochrome"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: "flex flex-col gap-3 pl-5 text-xl font-medium leading-8 text-black marker:text-neutral-400",
        aboutParagraph: "text-xl font-medium leading-8 text-black",
        postList: "list-disc flex flex-col gap-2 pl-5 text-base font-semibold leading-7 text-black",
        postParagraph: "text-base font-semibold leading-7 text-black",
        descriptionParagraph: "text-sm leading-7 text-neutral-600",
        descriptionList: "flex flex-col gap-2 pl-5 text-sm leading-7 text-neutral-600 marker:text-neutral-400",
        section: "scroll-mt-28 border-t border-neutral-200 pt-12",
        card: "rounded-none border border-neutral-200 bg-white p-5",
        title: "text-xl font-black tracking-[-0.02em] text-black",
        text: "text-sm leading-7 text-neutral-600",
        muted: "text-sm text-neutral-400",
        chip: "rounded-none border border-neutral-300 bg-white px-2 py-0.5 text-sm text-neutral-600",
        link: "text-sm font-medium text-black underline-offset-4 hover:underline",
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName="whitespace-pre-line text-2xl font-medium leading-tight tracking-[-0.025em] text-black @md:text-3xl"
          listClassName="flex flex-col gap-3 pl-6 text-2xl font-medium leading-tight tracking-[-0.025em] text-black marker:text-neutral-400 @md:text-3xl"
        />
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className={cn("scroll-mt-28 min-w-0 border-t pt-12", strongRule)}>
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              className={cn(
                "grid min-w-0 grid-cols-1 gap-4 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-2 @md:items-start @md:gap-8",
                hairline,
              )}
            >
              <div className="min-w-0 w-full overflow-hidden border border-neutral-200 bg-neutral-100">
                <TemplateProjectPreview
                  templateId="monochrome"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  containerClassName="aspect-[8/5] w-full bg-neutral-100"
                  className="h-full w-full object-cover object-top"
                  accentColor={primaryColor}
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-2xl font-black leading-none tracking-[-0.045em] text-black">
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && <FeaturedBadge />}
                </div>
                {project.language && <p className={cn("mt-2 text-sm", mute)}>{project.language}</p>}
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-2 text-sm leading-6", mute)}
                    listClassName={cn("mt-2 flex flex-col gap-1.5 pl-5 text-sm leading-6 marker:text-neutral-400", mute)}
                  />
                )}
                {project.techStack.length > 0 && (
                  <p className={cn("mt-3 text-xs leading-5", mute)}>
                    {project.techStack.slice(0, 6).join(" / ")}
                  </p>
                )}
                <div className="mt-4">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName="rounded-none border border-black bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white"
                    sourceClassName="rounded-none px-3 py-1.5 text-xs font-medium text-neutral-600 underline-offset-4 hover:text-black hover:underline"
                  />
                </div>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {experiences.map((exp) => (
            <article
              key={exp.id}
              className={cn("grid grid-cols-1 gap-3 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-10", hairline)}
            >
              <p className={cn("pt-1 text-sm tabular-nums", pale)}>
                {formatDateRange(exp.startDate, exp.endDate) || "—"}
              </p>
              <div className="min-w-0">
                <h3 className="text-2xl font-black leading-none tracking-[-0.04em] text-black">
                  <RichText text={exp.role} />
                </h3>
                <p className="mt-2 text-sm text-[var(--lf-accent)]">
                  <RichText text={exp.company} />
                  {exp.location ? (
                    <span className={mute}>
                      {" / "}
                      <RichText text={exp.location} />
                    </span>
                  ) : null}
                </p>
                {exp.description && (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-4 max-w-[44rem] text-sm leading-7", mute)}
                    listClassName={cn("mt-4 flex max-w-[44rem] flex-col gap-2 pl-5 text-sm leading-7 marker:text-neutral-400", mute)}
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
        <CollapsibleList initial={4} wrapperClassName="grid grid-cols-1 gap-x-8 gap-y-10 @md:grid-cols-2" buttonClassName={cn("col-span-full", moreBtn)}>
          {articles.map((article) => (
            <article key={article.id} className="flex min-w-0 flex-col">
              <ArticleSourceLabel source={article.source} className={cn("mb-2 opacity-70", mute)} />
              <h3 className="text-2xl font-black leading-none tracking-[-0.045em] text-black">
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
              {article.description && (
                <p className={cn("mt-3 grow text-sm leading-6", mute)}><RichText text={article.description} /></p>
              )}
              <p className={cn("mt-5 border-t border-neutral-200 pt-3 text-sm tabular-nums", pale)}>
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : null}
                {article.readTime != null ? (
                  <span>
                    {article.publishedAt ? " / " : null}
                    {article.readTime} min
                  </span>
                ) : null}
              </p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="grid grid-cols-1 gap-8 @md:grid-cols-2">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category} className="min-w-0 border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0">
              <h3 className={cn("mb-3 text-sm font-medium", pale)}>{category}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-lg font-semibold leading-7 tracking-[-0.02em] text-black">
                {names.map((name) => (
                  <TechChip key={name} name={name} />
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
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article
              key={edu.id}
              className={cn("grid grid-cols-1 gap-3 border-t py-6 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-10", hairline)}
            >
              <p className={cn("pt-1 text-sm tabular-nums", pale)}>
                {formatDateRange(edu.startDate, edu.endDate) || "—"}
              </p>
              <div>
                <h3 className="text-xl font-black leading-tight tracking-[-0.035em] text-black">
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
                {edu.gpa && <p className={cn("mt-2 text-xs", pale)}>{edu.gpa}</p>}
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
            <article key={cert.id} className={cn("border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <h3 className="text-base font-semibold text-black">
                {cert.url ? (
                  <a href={cert.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                    {cert.name}
                  </a>
                ) : (
                  cert.name
                )}
              </h3>
              <p className={cn("mt-1 text-sm", mute)}>
                {cert.issuer}
                {cert.issueDate
                  ? ` / ${new Date(cert.issueDate).toLocaleDateString("en-US", {
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
            <article key={ach.id} className={cn("border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <p className="text-base font-semibold leading-7 text-black">
                <RichText text={ach.title} />
              </p>
              {ach.date && (
                <p className={cn("mt-1 text-xs", pale)}>
                  {new Date(ach.date).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
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
          chipClassName="rounded-none border border-neutral-300 px-2.5 py-1 text-sm text-neutral-600"
          pillClassName="rounded-none border border-black px-2.5 py-1 text-sm text-black transition-colors hover:bg-black hover:text-white"
          titleClassName="text-black"
          textClassName="text-neutral-600"
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.github}</SectionHeading>
        <div className="min-w-0 overflow-x-auto pb-4 custom-scrollbar">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="minimal"
            stretch
            className="mt-0 border-0 pt-0"
            frameClassName="rounded-none border-neutral-200 bg-white"
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
        interTight.variable,
        "min-h-screen bg-white font-[family-name:var(--font-monochrome-sans)] text-black antialiased selection:bg-black selection:text-white",
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="mx-auto min-w-0 max-w-6xl overflow-x-clip px-4 pb-16 pt-6 @md:px-8 @md:pb-28 @md:pt-10">
        {navbarEnabled && (
          <div className="mb-14 border-b border-black pb-4">
            <div className="flex min-w-0 flex-col gap-3 @md:flex-row @md:items-baseline @md:justify-between @md:gap-6">
              <p className="shrink-0 text-sm font-semibold tracking-tight text-black">
                {stripRichTextToPlain(portfolio.title).split(/\s+/).filter(Boolean)[0]}
              </p>
              <TemplateNavbar
                items={sections}
                className="min-w-0 rounded-none border-0 bg-transparent"
                linkClassName="rounded-none px-0 py-0 text-sm font-medium text-neutral-600 hover:text-black"
              />
            </div>
          </div>
        )}

        <header className="grid min-w-0 grid-cols-1 gap-10 @lg:grid-cols-[minmax(0,1fr)_20rem] @lg:items-end">
          <div className={cn(HERO_HEADER_COLUMN, "max-w-3xl space-y-4")}>
            <h1
              className={cn(
                HERO_TITLE_BASE,
                HERO_TITLE_SCALE_7XL,
                "max-w-[14ch] font-black leading-tight tracking-[-0.05em]",
                ink,
              )}
            >
              <RichText text={portfolio.title} />
            </h1>
            {portfolio.headline && (
              <p className={cn(HERO_HEADLINE_SCALE, "max-w-[36rem] font-medium text-neutral-600")}>
                <RichText text={portfolio.headline} />
              </p>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3 border-t border-black pt-4 @lg:border-t-0 @lg:pt-0">
            <ContactChips
              portfolio={portfolio}
              chipClassName="rounded-sm border border-neutral-300 bg-white px-2.5 py-1 text-left text-sm text-neutral-700 transition-colors hover:border-black hover:text-black"
            />
            <HeroProfileButtons
              profiles={socialProfiles}
              className="rounded-none border border-black bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white"
            />
            {hasNonHeroSocialProfiles(socialProfiles) && (
              <SocialPills
                profiles={socialProfiles}
                showUsername
                excludeHeroPlatforms
                className="rounded-none border border-neutral-300 px-2.5 py-1 text-sm text-neutral-600 transition-colors hover:border-black hover:text-black"
              />
            )}
          </div>
        </header>

        <div className="mt-16 flex min-w-0 flex-col gap-4 @md:mt-24">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
        </div>

        {customSections.length > 0 && (
          <div className={cn("mt-4 grid gap-12 border-t pt-12 @md:grid-cols-2", hairline)}>
            {customSections.map((cs) => (
              <section key={cs.id} className="scroll-mt-28">
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName="font-semibold text-black"
                  textClassName="text-sm leading-7 text-neutral-600"
                  chipClassName="rounded-none border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600"
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

function FeaturedBadge() {
  return (
    <Badge
      variant="outline"
      className="h-auto rounded-none border-[var(--lf-accent)] bg-white px-1.5 py-0 text-[11px] font-semibold tracking-normal text-[var(--lf-accent)]"
    >
      Featured
    </Badge>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-black leading-none tracking-[-0.05em] text-black @md:text-4xl">
        {children}
      </h2>
      <Separator className="mt-4 bg-neutral-200" />
    </div>
  );
}
