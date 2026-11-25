import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
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
  HERO_TITLE_BASE,
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
 * Paper — letterpress sheet
 * Color: off-white cotton #fbfaf4, ink #25231f, graphite #6d685f, rule #25231f/14
 * Type: Source Serif 4 for headings + Source Sans 3 for body/UI
 * Layout: narrow sheet, one lead project, timeline rows, quiet borders as tooth
 */
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-paper-display",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-paper-sans",
});

const ink = "text-[#25231f]";
const mute = "text-[#6d685f]";
const hairline = "border-[#25231f]/14";
const moreBtn =
  "mt-6 self-start rounded-none border border-[#25231f]/18 bg-transparent px-3 py-1.5 text-sm text-[#6d685f] shadow-none hover:bg-[#25231f]/[0.035] hover:text-[#25231f]";

export function PaperTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("paper", portfolio.customization);
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
    getTemplateSectionLayout("paper"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: `flex flex-col gap-3 pl-5 text-base leading-8 ${mute} marker:text-[#25231f]/30`,
        aboutParagraph: `text-base leading-8 ${mute}`,
        postList: `list-disc flex flex-col gap-2 pl-5 text-sm leading-7 ${ink}`,
        postParagraph: `text-sm leading-7 ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${mute}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${mute} marker:text-[#25231f]/30`,
        section: `scroll-mt-28 border-t ${hairline} pt-12`,
        card: `rounded-none border ${hairline} bg-[#fffef9] p-5 shadow-[0_1px_0_rgba(37,35,31,0.04)]`,
        title: `font-[family-name:var(--font-paper-display)] text-xl font-semibold ${ink}`,
        text: `text-sm leading-7 ${mute}`,
        muted: `text-sm ${mute}`,
        chip: `rounded-none border ${hairline} bg-transparent px-2 py-0.5 text-sm ${mute}`,
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
          paragraphClassName={cn("whitespace-pre-line text-lg leading-9", mute)}
          listClassName={cn("flex flex-col gap-3 pl-5 text-lg leading-8", mute, "marker:text-[#25231f]/30")}
        />
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className={cn("scroll-mt-28 min-w-0 border-t pt-12", hairline)}>
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              className={cn(
                "grid min-w-0 grid-cols-1 gap-4 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-[minmax(0,28rem)_1fr] @md:gap-8",
                hairline,
              )}
            >
              <div className={cn("min-w-0 w-full overflow-hidden border bg-[#fffef9] p-1 shadow-[0_1px_0_rgba(37,35,31,0.05)]", hairline)}>
                <TemplateProjectPreview
                  templateId="paper"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  containerClassName="aspect-[8/5] w-full bg-[#f7f4ea]"
                  accentColor={primaryColor}
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className={cn("font-[family-name:var(--font-paper-display)] text-xl font-semibold", ink)}>
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && <PaperBadge>Featured</PaperBadge>}
                </div>
                {project.language && (
                  <p className={cn("mt-1 text-sm", mute)}>{project.language}</p>
                )}
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-2 max-w-[34rem] text-sm leading-7", mute)}
                    listClassName={cn("mt-2 flex max-w-[34rem] flex-col gap-1.5 pl-5 text-sm leading-6", mute)}
                  />
                )}
                {project.techStack.length > 0 && (
                  <p className={cn("mt-3 text-xs leading-5", mute)}>
                    {project.techStack.slice(0, 7).join(" / ")}
                  </p>
                )}
                <div className="mt-4">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName={cn("rounded-none border bg-transparent px-3 py-1.5 text-xs font-medium hover:bg-[#25231f]/[0.035]", hairline, ink)}
                    sourceClassName={cn("rounded-none px-3 py-1.5 text-xs font-medium underline-offset-4 hover:underline", mute)}
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
              className={cn(
                "grid grid-cols-1 gap-2 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-[8.5rem_minmax(0,1fr)] @md:gap-10",
                hairline,
              )}
            >
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>
                {formatDateRange(exp.startDate, exp.endDate) || "—"}
              </p>
              <div className="min-w-0">
                <h3 className={cn("font-[family-name:var(--font-paper-display)] text-xl font-semibold", ink)}>
                  <RichText text={exp.role} />
                </h3>
                <p className={cn("mt-1 text-sm", mute)}>
                  <span className="text-[var(--lf-accent)]">
                    <RichText text={exp.company} />
                  </span>
                  {exp.location ? (
                    <span>
                      {" / "}
                      <RichText text={exp.location} />
                    </span>
                  ) : null}
                </p>
                {exp.description && (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-4 max-w-[38rem] text-sm leading-7", mute)}
                    listClassName={cn("mt-4 flex max-w-[38rem] flex-col gap-2 pl-5 text-sm leading-7", mute)}
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
            <article key={article.id} className={cn("border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <ArticleSourceLabel source={article.source} className={cn("mb-1 opacity-75", mute)} />
              <div className="flex min-w-0 flex-col gap-1 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8">
                <h3 className={cn("font-[family-name:var(--font-paper-display)] text-lg font-semibold", ink)}>
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
                      {article.publishedAt ? " / " : null}
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
      <section key="skills" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="flex flex-col gap-6">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category}>
              <h3 className={cn("mb-2 text-sm", mute)}>{category}</h3>
              <div className={cn("flex max-w-[40rem] flex-wrap gap-x-4 gap-y-2 text-base leading-7", ink)}>
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
              className={cn("grid grid-cols-1 gap-2 border-t py-6 first:border-t-0 first:pt-0 @md:grid-cols-[8.5rem_minmax(0,1fr)] @md:gap-10", hairline)}
            >
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>
                {formatDateRange(edu.startDate, edu.endDate) || "—"}
              </p>
              <div>
                <h3 className={cn("font-[family-name:var(--font-paper-display)] text-lg font-semibold", ink)}>
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
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article key={cert.id} className={cn("border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <h3 className={cn("text-base font-medium", ink)}>
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
              <p className={cn("text-sm leading-7", ink)}>
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
          pillClassName={cn("rounded-none border px-2.5 py-1 text-sm transition-colors hover:bg-[#25231f]/[0.035]", hairline, ink)}
          titleClassName={ink}
          textClassName={mute}
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.openSource}</SectionHeading>
        <div className="min-w-0 overflow-x-auto pb-4 custom-scrollbar">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="minimal"
            stretch
            className="mt-0 border-0 pt-0"
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
        sourceSerif.variable,
        sourceSans.variable,
        "min-h-screen bg-[#f1efe6] font-[family-name:var(--font-paper-sans)] antialiased selection:bg-[var(--lf-accent)] selection:text-[#fbfaf4]",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="px-3 py-3 @md:px-6 @md:py-6">
        <main className="mx-auto min-w-0 max-w-6xl overflow-x-clip border border-[#25231f]/12 bg-[#fbfaf4] px-5 pb-16 pt-10 shadow-[0_1px_0_rgba(37,35,31,0.05),0_22px_70px_rgba(37,35,31,0.08)] @sm:px-7 @md:px-10 @md:pb-24 @md:pt-14">
          <header className="min-w-0">
            <div className={cn("mb-8 border-b pb-5", hairline)}>
              <p className={cn("max-w-[16rem] text-sm leading-6", mute)}>
                Portfolio sheet
              </p>
            </div>
            <h1
              className={cn(
                HERO_TITLE_BASE,
                "font-[family-name:var(--font-paper-display)] text-4xl font-semibold leading-[1.04] tracking-[-0.035em] @sm:text-5xl @md:text-6xl",
                ink,
              )}
            >
              <RichText text={portfolio.title} />
            </h1>
            {portfolio.headline && (
              <p className={cn("mt-5 max-w-[34rem] font-[family-name:var(--font-paper-display)] text-xl leading-8 @md:text-2xl", mute)}>
                <RichText text={portfolio.headline} />
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <ContactChips
                portfolio={portfolio}
                chipClassName={cn("rounded-none border-0 bg-transparent px-0 py-0 text-sm underline-offset-4 hover:underline", mute)}
              />
              <HeroProfileButtons
                profiles={socialProfiles}
                className={cn("rounded-none border px-3 py-1.5 text-sm transition-colors hover:bg-[#25231f]/[0.035]", hairline, ink)}
              />
              {hasNonHeroSocialProfiles(socialProfiles) && (
                <SocialPills
                  profiles={socialProfiles}
                  showUsername
                  excludeHeroPlatforms
                  className={cn("rounded-none border px-2.5 py-1 text-sm transition-colors hover:bg-[#25231f]/[0.035]", hairline, mute)}
                />
              )}
            </div>
          </header>

          {navbarEnabled && (
            <div className="mt-8">
              <TemplateNavbar
                items={sections}
                className={cn("rounded-none border-0 bg-transparent", hairline)}
                linkClassName={cn("rounded-none px-0 py-1.5 text-sm transition-colors hover:text-[#25231f]", mute)}
              />
            </div>
          )}

          <div className="mt-2 flex min-w-0 flex-col gap-2">
            {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
          </div>

          {customSections.length > 0 && (
            <div className={cn("mt-2 flex flex-col gap-12 border-t pt-12", hairline)}>
              {customSections.map((cs) => (
                <section key={cs.id} className="scroll-mt-28">
                  <SectionHeading>{cs.label}</SectionHeading>
                  <CustomSectionItems
                    items={cs.items}
                    titleClassName={cn("font-[family-name:var(--font-paper-display)] text-lg font-semibold", ink)}
                    textClassName={cn("text-sm leading-7", mute)}
                    chipClassName={cn("rounded-none border px-2 py-0.5 text-xs", hairline, mute)}
                    buttonClassName={moreBtn}
                  />
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function PaperBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="h-auto rounded-none border-[var(--lf-accent)]/45 bg-transparent px-1.5 py-0 font-sans text-[11px] font-medium tracking-normal text-[var(--lf-accent)]"
    >
      {children}
    </Badge>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2
        className={cn(
          "font-[family-name:var(--font-paper-display)] text-2xl font-semibold leading-tight tracking-[-0.015em] @md:text-[1.7rem]",
          ink,
        )}
      >
        {children}
      </h2>
      <Separator className="mt-4 bg-[#25231f]/14" />
    </div>
  );
}
