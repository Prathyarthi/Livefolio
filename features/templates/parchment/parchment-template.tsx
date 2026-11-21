import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CollapsibleList } from "../collapsible-list";
import {
  ArticleSourceLabel,
  RichText,
  DescriptionBlock,
  TechChip,
  TemplateNavbar,
  buildTemplateSections,
  SocialPills,
  HeroProfileButtons,
  hasNonHeroSocialProfiles,
  ContactChips,
  CustomSectionItems,
  ProfileLinksSection,
  ProjectActions,
  PROJECT_CARD,
  HERO_TITLE_BASE,
  TEMPLATE_CONTAINER,
  getSectionLabels,
} from "../shared";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import { GitHubContributionHeatmap, parseContributionCalendar } from "../github-contribution-heatmap";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";

/**
 * Parchment — manuscript archive
 * Palette: warm rag paper, iron-gall ink #2c2a24, olive shelf marks, restrained accent.
 * Type: Cormorant Garamond for folio headings, Source Sans 3 for catalog text.
 * Layout: margin rules and folio notes; lead project reads like a preserved plate.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-parchment-display",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-parchment-sans",
});

const ink = "text-[#2c2a24]";
const mute = "text-[#6d6759]";
const paper = "bg-[#e8ddc6]";
const sheet = "bg-[#f3ead7]";
const hairline = "border-[#2c2a24]/16";
const olive = "#6f7651";
const moreBtn =
  "mt-7 self-start rounded-none border-b border-[#2c2a24]/40 bg-transparent px-0 py-1 font-sans text-sm text-[#6d6759] transition-colors hover:border-[var(--lf-accent)] hover:text-[#2c2a24]";

export function ParchmentTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("parchment", portfolio.customization);
  const labels = getSectionLabels(portfolio.customization);
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const groupedSkills = groupSkillsByCategory(skills);

  const githubProfile = socialProfiles.find((p) => p.platform.toLowerCase() === "github");
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(githubStats?.contributionCalendar);
  const featuredProjects = projects.filter((project) => project.featured);
  const visibleProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...projects.filter((p) => !p.featured)]
      : projects;

  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("parchment"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading folio="LinkedIn">{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: `flex flex-col gap-3 pl-5 text-base leading-8 ${mute} marker:text-[#6f7651]`,
        aboutParagraph: `text-base leading-8 ${mute}`,
        postList: `flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed ${ink}`,
        postParagraph: `text-sm leading-relaxed ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${mute}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${mute} marker:text-[#6f7651]`,
        card: `border ${hairline} ${sheet} p-5`,
        title: `font-[family-name:var(--font-parchment-display)] text-2xl font-semibold ${ink}`,
        text: `text-sm leading-7 ${mute}`,
        muted: `text-sm ${mute}`,
        chip: `border ${hairline} bg-[#ebe0c9] px-2.5 py-1 text-sm ${mute}`,
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: `scroll-mt-28 border-t ${hairline} pt-12`,
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading folio="Note">{labels.about}</SectionHeading>
        <div className="relative max-w-[44rem] pl-5 before:absolute before:left-0 before:top-1 before:h-[calc(100%-0.5rem)] before:w-px before:bg-[#b5aa8e]">
          <DescriptionBlock
            text={portfolio.summary}
            paragraphClassName={cn("text-lg leading-8", mute)}
            listClassName={cn("flex flex-col gap-3 pl-5 text-lg leading-8 marker:text-[#6f7651]", mute)}
          />
        </div>
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className={cn("scroll-mt-28 min-w-0 border-t pt-12", hairline)}>
        <SectionHeading folio="Plate">{labels.projects}</SectionHeading>

        <CollapsibleList initial={4} wrapperClassName="grid grid-cols-1 gap-6 @lg:grid-cols-2" buttonClassName={moreBtn}>
          {visibleProjects.map((project) => (
            <article key={project.id} className={cn(PROJECT_CARD, "border bg-[#f3ead7] p-4", hairline)}>
              <div className="border border-[#2c2a24]/20 bg-[#efe3cc] p-2">
                <TemplateProjectPreview
                  templateId="parchment"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  className="h-full w-full object-cover object-top sepia-[0.12] contrast-[1.03]"
                  accentColor={primaryColor}
                />
              </div>
              <div className="pt-5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className={cn("font-[family-name:var(--font-parchment-display)] text-2xl font-semibold leading-tight", ink)}>
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && (
                    <Badge variant="outline" className="rounded-none border-[#6f7651]/50 bg-[#6f7651]/10 px-2 py-0 text-[11px] font-medium tracking-normal text-[#4f5937]">
                      Featured
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-2 text-sm leading-6", mute)}
                    listClassName={cn("mt-2 flex flex-col gap-1.5 pl-5 text-sm leading-6", mute)}
                  />
                )}
                {project.techStack.length > 0 && <p className={cn("mt-3 text-xs", mute)}>{project.techStack.slice(0, 6).join("; ")}</p>}
                <div className="mt-4">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName="rounded-none border border-[#2c2a24]/25 bg-transparent px-3 py-1.5 text-xs font-medium text-[#2c2a24] hover:bg-[#2c2a24]/5"
                    sourceClassName="rounded-none px-3 py-1.5 text-xs font-medium text-[#6d6759] hover:text-[#2c2a24]"
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
        <SectionHeading folio="Chronicle">{labels.experience}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {experiences.map((exp) => (
            <article key={exp.id} className={cn("grid grid-cols-1 gap-3 border-t py-7 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-9", hairline)}>
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>{formatDateRange(exp.startDate, exp.endDate) || "—"}</p>
              <div className="min-w-0">
                <h3 className={cn("font-[family-name:var(--font-parchment-display)] text-2xl font-semibold leading-tight", ink)}><RichText text={exp.role} /></h3>
                <p className="mt-1 text-sm text-[#6f7651]">
                  <RichText text={exp.company} />
                  {exp.location ? <span className={mute}>; <RichText text={exp.location} /></span> : null}
                </p>
                {exp.description && (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-4 max-w-[43rem] text-sm leading-7", mute)}
                    listClassName={cn("mt-4 flex max-w-[43rem] flex-col gap-2 pl-5 text-sm leading-7", mute)}
                  />
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education" className={cn("border-t pt-12", hairline)}>
        <SectionHeading folio="Register">{labels.education}</SectionHeading>
        <CollapsibleList initial={3} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article key={edu.id} className={cn("grid grid-cols-1 gap-3 border-t py-6 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-9", hairline)}>
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>{formatDateRange(edu.startDate, edu.endDate) || "—"}</p>
              <div>
                <h3 className={cn("font-[family-name:var(--font-parchment-display)] text-xl font-semibold", ink)}>
                  <RichText text={edu.degree} />{edu.field ? <span className={mute}> in <RichText text={edu.field} /></span> : null}
                </h3>
                <p className={cn("mt-1 text-sm", mute)}><RichText text={edu.institution} /></p>
                {edu.gpa && <Badge variant="outline" className="mt-3 rounded-none border-[#6f7651]/45 bg-[#6f7651]/10 px-2 py-0 text-xs font-medium text-[#4f5937]">{edu.gpa}</Badge>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" className={cn("border-t pt-12", hairline)}>
        <SectionHeading folio="Index">{labels.skills}</SectionHeading>
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 @md:grid-cols-2">
          {Object.entries(groupedSkills).map(([category, items]) => (
            <div key={category} className="min-w-0 border-l border-[#b5aa8e] pl-4">
              <h3 className={cn("mb-3 font-[family-name:var(--font-parchment-display)] text-xl font-semibold", ink)}>{category}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <TechChip key={skill} name={skill} className="border border-[#2c2a24]/14 bg-[#ebe0c9] px-2.5 py-1 text-xs text-[#6d6759]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications" className={cn("border-t pt-12", hairline)}>
        <SectionHeading folio="Seal">{labels.certifications}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="grid grid-cols-1 gap-4 @md:grid-cols-2" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article key={cert.id} className={cn("border bg-[#f3ead7] p-5", hairline)}>
              <h3 className={cn("text-base font-medium", ink)}>{cert.url ? <a href={cert.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">{cert.name}</a> : cert.name}</h3>
              <p className={cn("mt-1 text-sm", mute)}>{cert.issuer}{cert.issueDate ? `; ${new Date(cert.issueDate).getFullYear()}` : null}</p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements" className={cn("border-t pt-12", hairline)}>
        <SectionHeading folio="Marginalia">{labels.achievements}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {achievements.map((ach) => (
            <article key={ach.id} className={cn("flex items-start gap-4 border-t py-5", hairline)}>
              <span className="mt-2 h-px w-8 shrink-0 bg-[#6f7651]" />
              <div className="min-w-0">
                <h3 className={cn("text-sm leading-6", ink)}><RichText text={ach.title} /></h3>
                {ach.date && <p className={cn("mt-1 text-xs", mute)}>{new Date(ach.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="articles" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading folio="Reading">{labels.articles}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {articles.map((article) => (
            <article key={article.id} className={cn("border-t py-5", hairline)}>
              <ArticleSourceLabel source={article.source} className={cn("mb-1 opacity-70", mute)} />
              <div className="flex flex-col gap-1 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8">
                <h3 className={cn("font-[family-name:var(--font-parchment-display)] text-xl font-semibold", ink)}>
                  <a href={article.url} data-lf-track="article" data-lf-label={stripRichTextToPlain(article.title)} data-lf-id={article.id} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    <RichText text={article.title} />
                  </a>
                </h3>
                <p className={cn("shrink-0 text-sm tabular-nums", mute)}>
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null}
                  {article.readTime != null ? <span>{article.publishedAt ? "; " : null}{article.readTime} min</span> : null}
                </p>
              </div>
              {article.description && <p className={cn("mt-2 max-w-[42rem] text-sm leading-6", mute)}><RichText text={article.description} /></p>}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading folio="Address">{labels.profiles}</SectionHeading>
        <div className={cn("border bg-[#f3ead7] p-6", hairline)}>
          <ProfileLinksSection
            portfolio={portfolio}
            profiles={socialProfiles}
            chipClassName="border border-[#2c2a24]/14 bg-[#ebe0c9] px-2.5 py-1 text-sm text-[#6d6759]"
            pillClassName="border border-[#2c2a24]/20 bg-transparent px-2.5 py-1.5 text-sm text-[#2c2a24] transition-colors hover:bg-[#2c2a24]/5"
            titleClassName={ink}
            textClassName={mute}
          />
        </div>
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className={cn("border-t pt-12", hairline)}>
        <SectionHeading folio="Calendar">{labels.github}</SectionHeading>
        <div className="overflow-x-auto border border-[#2c2a24]/16 bg-[#f3ead7] p-5">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="corporate"
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
        cormorant.variable,
        sourceSans.variable,
        "min-h-screen font-[family-name:var(--font-parchment-sans)] antialiased selection:bg-[var(--lf-accent)] selection:text-[#f3ead7]",
        paper,
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="relative mx-auto min-w-0 max-w-6xl overflow-x-clip px-5 pb-16 pt-8 sm:px-6 md:px-8 md:pb-28 md:pt-14">
        <div
          className="pointer-events-none absolute inset-x-5 top-6 h-24 border-x border-t border-[#b5aa8e]/70 md:inset-x-8"
          aria-hidden
        />
        <div className="relative border-x border-[#b5aa8e]/70 bg-[#f3ead7] px-5 py-8 shadow-[0_28px_80px_rgba(44,42,36,0.16)] sm:px-8 md:px-12 md:py-12">
          <header className="min-w-0 border-b border-[#b5aa8e] pb-10">
            <h1 className={cn(HERO_TITLE_BASE, "max-w-[52rem] font-[family-name:var(--font-parchment-display)] text-5xl font-semibold leading-[0.95] tracking-[-0.035em] @sm:text-6xl @md:text-7xl @lg:text-8xl", ink)}>
              <RichText text={portfolio.title} />
            </h1>
            {portfolio.headline && (
              <p className={cn("mt-6 max-w-[38rem] text-lg leading-8 @md:text-xl", mute)}>
                <RichText text={portfolio.headline} />
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <ContactChips portfolio={portfolio} chipClassName="border-b border-[#2c2a24]/20 px-0 py-0.5 text-sm text-[#6d6759]" />
              <HeroProfileButtons profiles={socialProfiles} className="border border-[#2c2a24]/18 bg-[#ebe0c9] px-3 py-1.5 text-sm text-[#2c2a24] transition-colors hover:bg-[#2c2a24]/5" />
              {hasNonHeroSocialProfiles(socialProfiles) && (
                <SocialPills profiles={socialProfiles} showUsername excludeHeroPlatforms className="border-b border-transparent px-0 py-0.5 text-sm text-[#6d6759] transition-colors hover:border-[#2c2a24]/30 hover:text-[#2c2a24]" />
              )}
            </div>
          </header>

          {navbarEnabled && (
            <div className="mt-6">
              <TemplateNavbar
                items={sections}
                className="rounded-none border-x-0 border-b border-t-0 border-[#b5aa8e] bg-transparent backdrop-blur-none"
                linkClassName="rounded-none px-0 py-3 text-sm text-[#6d6759] transition-colors hover:text-[#2c2a24]"
              />
            </div>
          )}

          <main className="mt-12 flex min-w-0 flex-col gap-4 md:mt-16">
            {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
          </main>

          {customSections.length > 0 && (
            <div className={cn("mt-4 grid gap-10 border-t pt-12 @md:grid-cols-2", hairline)}>
              {customSections.map((cs) => (
                <section key={cs.id}>
                  <SectionHeading folio="Appendix">{cs.label}</SectionHeading>
                  <CustomSectionItems
                    items={cs.items}
                    titleClassName={cn("font-[family-name:var(--font-parchment-display)] text-xl font-semibold", ink)}
                    textClassName={cn("text-sm leading-6", mute)}
                    chipClassName="border border-[#2c2a24]/14 bg-[#ebe0c9] px-2.5 py-1 text-xs text-[#6d6759]"
                    buttonClassName={moreBtn}
                  />
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children, folio }: { children: React.ReactNode; folio: string }) {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-[minmax(4rem,7rem)_1fr] items-end gap-4">
        <p className="font-[family-name:var(--font-parchment-display)] text-base italic text-[#6f7651]">{folio}</p>
        <h2 className={cn("font-[family-name:var(--font-parchment-display)] text-3xl font-semibold leading-none tracking-[-0.02em] md:text-4xl", ink)}>
          {children}
        </h2>
      </div>
      <Separator className="mt-4 bg-[#b5aa8e]" />
    </div>
  );
}
