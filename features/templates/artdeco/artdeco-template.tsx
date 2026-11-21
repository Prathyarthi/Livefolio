import { Cinzel, Inter } from "next/font/google";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArticleSourceLabel,
  RichText,
  buildTemplateSections,
  ContactChips,
  getSectionLabels,
  CustomSectionItems,
  DescriptionBlock,
  TechChip,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  PROJECT_CARD,
  HERO_TITLE_BASE,
  SocialPills,
  hasNonHeroSocialProfiles,
  TEMPLATE_CONTAINER,
  TemplateNavbar,
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
 * Art Deco — restrained black, ivory, and geometry
 * Palette: true black, warm ivory, muted gold, accent as a small jewel.
 * Type: Cinzel for architectural headings, Inter for contemporary readability.
 * Layout: vertical procession with chevron/fan motifs drawn only with CSS gradients and borders.
 */
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-artdeco-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-artdeco-sans",
});

const ink = "text-[#f1ead7]";
const mute = "text-[#b9ad90]";
const hairline = "border-[#c5a45c]/28";
const moreBtn =
  "mt-7 self-start rounded-none border border-[#c5a45c]/35 bg-transparent px-5 py-2 font-sans text-sm text-[#c5a45c] transition-colors hover:bg-[#c5a45c] hover:text-[#070705]";

export function ArtDecoTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("artdeco", portfolio.customization);
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
    getTemplateSectionLayout("artdeco"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: `flex flex-col gap-3 pl-5 text-base leading-8 ${mute} marker:text-[#c5a45c]`,
        aboutParagraph: `text-base leading-8 ${mute}`,
        postList: `flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed ${ink}`,
        postParagraph: `text-sm leading-relaxed ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${mute}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${mute} marker:text-[#c5a45c]`,
        card: `border ${hairline} bg-[#10100d] p-5`,
        title: `font-[family-name:var(--font-artdeco-display)] text-xl ${ink}`,
        text: `text-sm leading-7 ${mute}`,
        muted: `text-sm ${mute}`,
        chip: `border ${hairline} px-2.5 py-1 text-sm text-[#c5a45c]`,
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: `scroll-mt-28 border-t ${hairline} pt-12`,
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.about}</SectionHeading>
        <div className="mx-auto max-w-[44rem] text-center">
          <DescriptionBlock
            text={portfolio.summary}
            paragraphClassName={cn("text-lg leading-8", mute)}
            listClassName={cn("flex flex-col gap-3 pl-5 text-left text-lg leading-8 marker:text-[#c5a45c]", mute)}
          />
        </div>
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className={cn("scroll-mt-28 min-w-0 border-t pt-12", hairline)}>
        <SectionHeading>{labels.projects}</SectionHeading>

        <CollapsibleList initial={4} wrapperClassName="grid grid-cols-1 gap-6 @lg:grid-cols-2" buttonClassName={moreBtn}>
          {visibleProjects.map((project) => (
            <article key={project.id} className={cn(PROJECT_CARD, "border bg-[#10100d] p-3", hairline)}>
              <div className="border border-[#c5a45c]/18 p-2">
                <div className="relative overflow-hidden border border-[#c5a45c]/22 bg-black">
                  <TemplateProjectPreview
                    templateId="artdeco"
                    liveUrl={project.liveUrl ?? null}
                    imageUrl={project.imageUrl ?? null}
                    projectId={project.id}
                    livePreviewProjectIds={livePreviewProjectIds}
                    alt={stripRichTextToPlain(project.title)}
                    loading="lazy"
                    className="h-full w-full object-cover object-top grayscale-[0.15] contrast-[1.08]"
                    accentColor={primaryColor}
                  />
                </div>
                <div className="pt-5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className={cn("font-[family-name:var(--font-artdeco-display)] text-xl tracking-[-0.01em]", ink)}>
                      <RichText text={project.title} />
                    </h3>
                    {project.featured && (
                      <Badge variant="outline" className="rounded-none border-[#c5a45c]/50 bg-[#c5a45c]/10 px-2 py-0 text-[11px] font-medium tracking-normal text-[#c5a45c]">
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
                  {project.techStack.length > 0 && <p className={cn("mt-3 text-xs", mute)}>{project.techStack.slice(0, 6).join(" / ")}</p>}
                  <div className="mt-4">
                    <ProjectActions
                      liveUrl={project.liveUrl}
                      sourceUrl={project.sourceUrl}
                      label={stripRichTextToPlain(project.title)}
                      projectId={project.id}
                      liveClassName="rounded-none border border-[#c5a45c]/40 bg-transparent px-3 py-1.5 text-xs font-medium text-[#c5a45c] hover:bg-[#c5a45c]/10"
                      sourceClassName="rounded-none px-3 py-1.5 text-xs font-medium text-[#b9ad90] hover:text-[#f1ead7]"
                    />
                  </div>
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
            <article key={exp.id} className={cn("grid grid-cols-1 gap-3 border-t py-7 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-10", hairline)}>
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>{formatDateRange(exp.startDate, exp.endDate) || "—"}</p>
              <div className="min-w-0">
                <h3 className={cn("font-[family-name:var(--font-artdeco-display)] text-xl", ink)}><RichText text={exp.role} /></h3>
                <p className="mt-1 text-sm text-[#c5a45c]">
                  <RichText text={exp.company} />
                  {exp.location ? <span className={mute}> / <RichText text={exp.location} /></span> : null}
                </p>
                {exp.description && (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-4 max-w-[42rem] text-sm leading-7", mute)}
                    listClassName={cn("mt-4 flex max-w-[42rem] flex-col gap-2 pl-5 text-sm leading-7", mute)}
                  />
                )}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="grid grid-cols-1 gap-5 @md:grid-cols-2">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category} className={cn("border bg-[#10100d] p-5", hairline)}>
              <h3 className={cn("mb-4 font-[family-name:var(--font-artdeco-display)] text-lg", ink)}>{category}</h3>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <TechChip key={name} name={name} className="border border-[#c5a45c]/22 px-2.5 py-1 text-xs text-[#b9ad90]" />
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
        <CollapsibleList initial={3} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article key={edu.id} className={cn("grid grid-cols-1 gap-3 border-t py-6 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-10", hairline)}>
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>{formatDateRange(edu.startDate, edu.endDate) || "—"}</p>
              <div>
                <h3 className={cn("font-[family-name:var(--font-artdeco-display)] text-lg", ink)}>
                  <RichText text={edu.degree} />{edu.field ? <span className={mute}> in <RichText text={edu.field} /></span> : null}
                </h3>
                <p className={cn("mt-1 text-sm", mute)}><RichText text={edu.institution} /></p>
                {edu.gpa && <Badge variant="outline" className="mt-3 rounded-none border-[#c5a45c]/45 bg-[#c5a45c]/10 px-2 py-0 text-xs font-medium text-[#c5a45c]">{edu.gpa}</Badge>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="grid grid-cols-1 gap-4 @md:grid-cols-2" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article key={cert.id} className={cn("border bg-[#10100d] p-5", hairline)}>
              <h3 className={cn("text-base font-medium", ink)}>{cert.url ? <a href={cert.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{cert.name}</a> : cert.name}</h3>
              <p className={cn("mt-1 text-sm", mute)}>{cert.issuer}{cert.issueDate ? ` / ${new Date(cert.issueDate).getFullYear()}` : null}</p>
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
            <article key={ach.id} className={cn("flex items-start gap-4 border-t py-5", hairline)}>
              <span className="mt-1.5 size-3 shrink-0 rotate-45 border border-[#c5a45c]" />
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
      <section key="articles" id="writing" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {articles.map((article) => (
            <article key={article.id} className={cn("border-t py-5", hairline)}>
              <ArticleSourceLabel source={article.source} className={cn("mb-1 opacity-70", mute)} />
              <div className="flex flex-col gap-1 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8">
                <h3 className={cn("font-[family-name:var(--font-artdeco-display)] text-lg", ink)}>
                  <a href={article.url} data-lf-track="article" data-lf-label={stripRichTextToPlain(article.title)} data-lf-id={article.id} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                    <RichText text={article.title} />
                  </a>
                </h3>
                <p className={cn("shrink-0 text-sm tabular-nums", mute)}>
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null}
                  {article.readTime != null ? <span>{article.publishedAt ? " / " : null}{article.readTime} min</span> : null}
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
        <SectionHeading>{labels.profiles}</SectionHeading>
        <div className={cn("border bg-[#10100d] p-6", hairline)}>
          <ProfileLinksSection
            portfolio={portfolio}
            profiles={socialProfiles}
            chipClassName="border border-[#c5a45c]/22 px-2.5 py-1 text-sm text-[#b9ad90]"
            pillClassName="border border-[#c5a45c]/35 px-2.5 py-1.5 text-sm text-[#c5a45c] transition-colors hover:bg-[#c5a45c]/10"
            titleClassName={ink}
            textClassName={mute}
          />
        </div>
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className={cn("border-t pt-12", hairline)}>
        <SectionHeading>{labels.github}</SectionHeading>
        <div className="overflow-x-auto border border-[#c5a45c]/28 bg-[#10100d] p-5">
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
        cinzel.variable,
        inter.variable,
        "min-h-screen bg-[#070705] font-[family-name:var(--font-artdeco-sans)] antialiased selection:bg-[var(--lf-accent)] selection:text-[#070705]",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="pointer-events-none fixed inset-0 opacity-[0.08]" style={decoPattern} aria-hidden />
      <div className="relative mx-auto min-w-0 max-w-6xl overflow-x-clip px-5 pb-16 pt-10 sm:px-6 md:px-8 md:pb-28 md:pt-14">
        <header className="relative mx-auto max-w-4xl border border-[#c5a45c]/28 bg-[#10100d]/90 px-5 py-10 text-center sm:px-8 md:px-12 md:py-14">
          <div className="mx-auto mb-8 h-16 w-40" style={fanPattern} aria-hidden />
          <h1 className={cn(HERO_TITLE_BASE, "font-[family-name:var(--font-artdeco-display)] text-4xl leading-[1.02] tracking-[-0.025em] @sm:text-5xl @md:text-6xl @lg:text-7xl", ink)}>
            <RichText text={portfolio.title} />
          </h1>
          {portfolio.headline && (
            <p className={cn("mx-auto mt-6 max-w-[38rem] text-base leading-8 @md:text-lg", mute)}>
              <RichText text={portfolio.headline} />
            </p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            <ContactChips portfolio={portfolio} chipClassName="border border-[#c5a45c]/22 px-3 py-1 text-sm text-[#b9ad90]" />
            <HeroProfileButtons profiles={socialProfiles} className="border border-[#c5a45c]/35 px-3 py-1.5 text-sm text-[#c5a45c] transition-colors hover:bg-[#c5a45c]/10" />
            {hasNonHeroSocialProfiles(socialProfiles) && (
              <SocialPills profiles={socialProfiles} showUsername excludeHeroPlatforms className="px-2 py-1 text-sm text-[#b9ad90] transition-colors hover:text-[#f1ead7]" />
            )}
          </div>
        </header>

        {navbarEnabled && (
          <div className="sticky top-6 z-30 mt-8 flex justify-center">
            <TemplateNavbar
              items={sections}
              className="w-full max-w-3xl rounded-none border-[#c5a45c]/28 bg-[#070705]/88"
              linkClassName="rounded-none px-4 py-2 text-sm text-[#b9ad90] transition-colors hover:text-[#f1ead7]"
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
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn("font-[family-name:var(--font-artdeco-display)] text-lg", ink)}
                  textClassName={cn("text-sm leading-6", mute)}
                  chipClassName="border border-[#c5a45c]/22 px-2.5 py-1 text-xs text-[#b9ad90]"
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

const decoPattern = {
  backgroundImage:
    "repeating-linear-gradient(135deg, transparent 0 18px, #c5a45c 18px 19px, transparent 19px 36px), repeating-linear-gradient(45deg, transparent 0 18px, #c5a45c 18px 19px, transparent 19px 36px)",
  backgroundSize: "72px 72px",
} satisfies React.CSSProperties;

const fanPattern = {
  backgroundImage:
    "repeating-radial-gradient(ellipse at 50% 100%, transparent 0 13px, #c5a45c 14px 15px, transparent 16px 28px)",
  borderBottom: "1px solid #c5a45c",
} satisfies React.CSSProperties;

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-9 text-center", className)}>
      <div className="mx-auto mb-4 h-6 w-24" style={fanPattern} aria-hidden />
      <h2 className={cn("font-[family-name:var(--font-artdeco-display)] text-2xl leading-tight tracking-[-0.01em] md:text-3xl", ink)}>
        {children}
      </h2>
      <Separator className="mx-auto mt-5 max-w-sm bg-[#c5a45c]/28" />
    </div>
  );
}
