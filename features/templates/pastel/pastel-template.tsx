import { Inter, Quicksand } from "next/font/google";
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
  HERO_TITLE_BASE,
  SocialPills,
  hasNonHeroSocialProfiles,
  TEMPLATE_CONTAINER,
} from "../shared";
import { PastelNavbar } from "./pastel-navbar";
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
 * Pastel — adult candy on cool paper
 * Palette: cool gray sheet, graphite text, blush/mint/lilac as tiny wayfinding signals.
 * Type: Quicksand for warm display, Inter for crisp body and controls.
 * Layout: a generous lead project followed by timeline/index sections rather than a soft card kit.
 */
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-pastel-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-pastel-sans",
});

const ink = "text-[#2f343a]";
const mute = "text-[#68717b]";
const paper = "bg-[#f4f5f7]";
const surface = "bg-[#fbfbfc]";
const hairline = "border-[#2f343a]/10";
const blush = "#d9a8b0";
const mint = "#a8cbbb";
const lilac = "#b8b3d9";
const moreBtn =
  "mt-6 self-start rounded-full border border-[#2f343a]/10 bg-[#fbfbfc] px-4 py-2 font-sans text-sm text-[#68717b] transition-colors hover:border-[var(--lf-accent)]/35 hover:text-[#2f343a]";

export function PastelTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("pastel", portfolio.customization);
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
    getTemplateSectionLayout("pastel"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading tone="lilac">{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: `flex flex-col gap-3 pl-5 text-base leading-8 ${mute} marker:text-[var(--lf-accent)]`,
        aboutParagraph: `text-base leading-8 ${mute}`,
        postList: `flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed ${ink}`,
        postParagraph: `text-sm leading-relaxed ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${mute}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${mute} marker:text-[var(--lf-accent)]`,
        card: `rounded-[1.5rem] border ${hairline} ${surface} p-5 shadow-[0_18px_40px_rgba(47,52,58,0.06)]`,
        title: `font-[family-name:var(--font-pastel-display)] text-xl font-semibold ${ink}`,
        text: `text-sm leading-7 ${mute}`,
        muted: `text-sm ${mute}`,
        chip: `rounded-full border ${hairline} bg-white px-3 py-1 text-sm ${mute}`,
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: `scroll-mt-28 border-t ${hairline} pt-12`,
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading tone="blush">{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName={cn("text-lg leading-8", mute)}
          listClassName={cn("flex flex-col gap-3 pl-5 text-lg leading-8 marker:text-[var(--lf-accent)]", mute)}
        />
      </section>
    ) : null,

    projects: orderedProjects.length > 0 ? (
      <section key="projects" id="work" className={cn("scroll-mt-28 min-w-0 border-t pt-12", hairline)}>
        <SectionHeading tone="mint">{labels.projects}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {orderedProjects.map((project) => (
            <article
              key={project.id}
              className={cn(
                "grid min-w-0 grid-cols-1 gap-4 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-2 @md:items-start @md:gap-8",
                hairline,
              )}
            >
              <div className="min-w-0 w-full overflow-hidden rounded-[1.25rem] bg-[#edf1f0]">
                <TemplateProjectPreview
                  templateId="pastel"
                  liveUrl={project.liveUrl ?? null}
                  imageUrl={project.imageUrl ?? null}
                  projectId={project.id}
                  livePreviewProjectIds={livePreviewProjectIds}
                  alt={stripRichTextToPlain(project.title)}
                  loading="lazy"
                  containerClassName="aspect-[8/5] w-full bg-[#edf1f0]"
                  accentColor={primaryColor}
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className={cn("font-[family-name:var(--font-pastel-display)] text-xl font-semibold tracking-[-0.02em]", ink)}>
                    <RichText text={project.title} />
                  </h3>
                  {project.featured && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-[#d9a8b0]/60 bg-[#d9a8b0]/15 px-2 py-0 text-[11px] font-medium tracking-normal text-[#8b5961]"
                    >
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
                {project.techStack.length > 0 && (
                  <p className={cn("mt-3 text-xs", mute)}>{project.techStack.slice(0, 5).join(" / ")}</p>
                )}
                <div className="mt-4">
                  <ProjectActions
                    liveUrl={project.liveUrl}
                    sourceUrl={project.sourceUrl}
                    label={stripRichTextToPlain(project.title)}
                    projectId={project.id}
                    liveClassName="rounded-full border border-[#2f343a]/10 bg-white px-3 py-1.5 text-xs font-medium text-[#2f343a] hover:border-[var(--lf-accent)]/40"
                    sourceClassName="rounded-full px-3 py-1.5 text-xs font-medium text-[#68717b] hover:text-[#2f343a]"
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
        <SectionHeading tone="lilac">{labels.experience}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {experiences.map((exp) => (
            <article key={exp.id} className={cn("grid grid-cols-1 gap-3 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-8", hairline)}>
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>{formatDateRange(exp.startDate, exp.endDate) || "Present"}</p>
              <div className="min-w-0">
                <h3 className={cn("font-[family-name:var(--font-pastel-display)] text-xl font-semibold", ink)}><RichText text={exp.role} /></h3>
                <p className="mt-1 text-sm text-[var(--lf-accent)]">
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
        <SectionHeading tone="mint">{labels.skills}</SectionHeading>
        <div className="grid grid-cols-1 gap-5 @md:grid-cols-2">
          {Object.entries(groupedSkills).map(([category, names], index) => (
            <div key={category} className={cn("rounded-[1.5rem] border bg-[#fbfbfc] p-5", hairline)}>
              <h3 className={cn("mb-3 font-[family-name:var(--font-pastel-display)] text-base font-semibold", ink)}>
                <span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: [blush, mint, lilac][index % 3] }} />
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <TechChip key={name} name={name} className="rounded-full bg-[#eef0f4] px-3 py-1 text-xs text-[#68717b]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education" className={cn("border-t pt-12", hairline)}>
        <SectionHeading tone="blush">{labels.education}</SectionHeading>
        <CollapsibleList initial={3} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article key={edu.id} className={cn("grid grid-cols-1 gap-3 border-t py-6 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-8", hairline)}>
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>{formatDateRange(edu.startDate, edu.endDate) || "—"}</p>
              <div>
                <h3 className={cn("font-[family-name:var(--font-pastel-display)] text-lg font-semibold", ink)}>
                  <RichText text={edu.degree} />{edu.field ? <> in <RichText text={edu.field} /></> : null}
                </h3>
                <p className={cn("mt-1 text-sm", mute)}><RichText text={edu.institution} /></p>
                {edu.gpa && <Badge variant="outline" className="mt-3 rounded-full border-[#b8b3d9]/60 bg-[#b8b3d9]/15 px-2 py-0 text-xs font-medium text-[#68619a]">{edu.gpa}</Badge>}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications" className={cn("border-t pt-12", hairline)}>
        <SectionHeading tone="lilac">{labels.certifications}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="grid grid-cols-1 gap-3 @md:grid-cols-2" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article key={cert.id} className={cn("rounded-[1.25rem] border bg-[#fbfbfc] p-5", hairline)}>
              <h3 className={cn("text-base font-medium", ink)}>
                {cert.url ? <a href={cert.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{cert.name}</a> : cert.name}
              </h3>
              <p className={cn("mt-1 text-sm", mute)}>{cert.issuer}{cert.issueDate ? ` / ${new Date(cert.issueDate).getFullYear()}` : null}</p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements" className={cn("border-t pt-12", hairline)}>
        <SectionHeading tone="mint">{labels.achievements}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {achievements.map((ach) => (
            <article key={ach.id} className={cn("flex items-start gap-3 border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <span className="mt-2 size-2 shrink-0 rounded-full bg-[var(--lf-accent)]" />
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
        <SectionHeading tone="blush">{labels.articles}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {articles.map((article) => (
            <article key={article.id} className={cn("border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <ArticleSourceLabel source={article.source} className={cn("mb-1 opacity-70", mute)} />
              <div className="flex flex-col gap-2 @md:flex-row @md:items-baseline @md:justify-between @md:gap-8">
                <h3 className={cn("font-[family-name:var(--font-pastel-display)] text-lg font-semibold", ink)}>
                  <a href={article.url} data-lf-track="article" data-lf-label={stripRichTextToPlain(article.title)} data-lf-id={article.id} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                    <RichText text={article.title} />
                  </a>
                </h3>
                <p className={cn("shrink-0 text-sm tabular-nums", mute)}>
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null}
                  {article.readTime != null ? <span>{article.publishedAt ? " / " : null}{article.readTime} min</span> : null}
                </p>
              </div>
              {article.description && <p className={cn("mt-2 max-w-[40rem] text-sm leading-6", mute)}><RichText text={article.description} /></p>}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className={cn("scroll-mt-28 border-t pt-12", hairline)}>
        <SectionHeading tone="lilac">{labels.profiles}</SectionHeading>
        <div className={cn("rounded-[2rem] border bg-[#fbfbfc] p-6", hairline)}>
          <ProfileLinksSection
            portfolio={portfolio}
            profiles={socialProfiles}
            chipClassName="rounded-full bg-[#eef0f4] px-3 py-1 text-sm text-[#68717b]"
            pillClassName="rounded-full border border-[#2f343a]/10 bg-white px-3 py-1.5 text-sm text-[#2f343a] transition-colors hover:border-[var(--lf-accent)]/40"
            titleClassName={ink}
            textClassName={mute}
          />
        </div>
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className={cn("min-w-0 border-t pt-12", hairline)}>
        <SectionHeading tone="mint">{labels.github}</SectionHeading>
        <div className="min-w-0 overflow-x-auto custom-scrollbar">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="minimal"
            stretch
            className="mt-0 border-0 pt-0"
            frameClassName="rounded-[1.5rem] border-[#2f343a]/10 bg-[#f4f5f7]"
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
        quicksand.variable,
        inter.variable,
        "min-h-screen font-[family-name:var(--font-pastel-sans)] antialiased selection:bg-[var(--lf-accent)] selection:text-white",
        paper,
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="relative mx-auto min-w-0 max-w-6xl overflow-x-clip px-5 pb-16 pt-10 sm:px-6 md:px-8 md:pb-28 md:pt-14">
        <div className="pointer-events-none absolute left-5 top-0 h-full w-px bg-linear-to-b from-[#d9a8b0]/45 via-[#a8cbbb]/35 to-[#b8b3d9]/40 md:left-8" />

        <header className="min-w-0 pl-5 pr-12 md:pl-8 @md:pr-0">
          <div className="mb-7 flex h-3 w-24 overflow-hidden rounded-full">
            <span className="flex-1 bg-[#d9a8b0]" />
            <span className="flex-1 bg-[#a8cbbb]" />
            <span className="flex-1 bg-[#b8b3d9]" />
          </div>
          <h1 className={cn(HERO_TITLE_BASE, "max-w-[48rem] font-[family-name:var(--font-pastel-display)] text-4xl font-semibold leading-[1.05] tracking-[-0.045em] @sm:text-5xl @md:text-6xl @lg:text-7xl", ink)}>
            <RichText text={portfolio.title} />
          </h1>
          {portfolio.headline && (
            <p className={cn("mt-5 max-w-[36rem] text-lg leading-8 @md:text-xl", mute)}>
              <RichText text={portfolio.headline} />
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <ContactChips portfolio={portfolio} chipClassName="rounded-full border border-[#2f343a]/12 bg-[#fbfbfc] px-3 py-1.5 text-sm text-[#68717b] shadow-[0_10px_30px_rgba(47,52,58,0.05)]" />
            <HeroProfileButtons profiles={socialProfiles} className="rounded-full border border-[#2f343a]/10 bg-[#fbfbfc] px-3 py-1.5 text-sm text-[#2f343a] transition-colors hover:border-[var(--lf-accent)]/40" />
            {hasNonHeroSocialProfiles(socialProfiles) && (
              <SocialPills profiles={socialProfiles} showUsername excludeHeroPlatforms className="rounded-full px-2.5 py-1 text-sm text-[#68717b] transition-colors hover:text-[#2f343a]" />
            )}
          </div>
        </header>

        {navbarEnabled && (
          <div className="min-w-0 pl-5 md:pl-8">
            <PastelNavbar items={sections} />
          </div>
        )}

        <div className="mt-2 flex min-w-0 flex-col gap-4 pl-5 md:pl-8">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
        </div>

        {customSections.length > 0 && (
          <div className={cn("mt-4 grid gap-8 border-t pt-12 pl-5 @md:grid-cols-2 md:pl-8", hairline)}>
            {customSections.map((cs, index) => (
              <section key={cs.id}>
                <SectionHeading tone={index % 2 === 0 ? "blush" : "mint"}>{cs.label}</SectionHeading>
                <CustomSectionItems
                  items={cs.items}
                  titleClassName={cn("font-[family-name:var(--font-pastel-display)] text-lg font-semibold", ink)}
                  textClassName={cn("text-sm leading-6", mute)}
                  chipClassName="rounded-full bg-[#eef0f4] px-3 py-1 text-xs text-[#68717b]"
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

function SectionHeading({
  children,
  className,
  tone = "blush",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "blush" | "mint" | "lilac";
}) {
  const toneColor = tone === "mint" ? mint : tone === "lilac" ? lilac : blush;

  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center gap-3">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: toneColor }} />
        <h2 className={cn("font-[family-name:var(--font-pastel-display)] text-2xl font-semibold tracking-[-0.02em] md:text-[1.8rem]", ink)}>
          {children}
        </h2>
      </div>
      <Separator className="mt-4 bg-[#2f343a]/10" />
    </div>
  );
}
