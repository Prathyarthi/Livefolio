import { Schibsted_Grotesk } from "next/font/google";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";
import { GitHubContributionHeatmap, parseContributionCalendar } from "../github-contribution-heatmap";
import { CollapsibleList } from "../collapsible-list";
import { getTemplateSectionLayout } from "../section-layouts";
import { renderSections, resolveSectionLayout, type ReorderableSectionKey } from "../section-order";
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
  PROJECT_CARD,
  HERO_TITLE_BASE,
  SocialPills,
  TechChip,
  TemplateNavbar,
  TEMPLATE_CONTAINER,
  getSectionLabels,
  hasNonHeroSocialProfiles,
} from "../shared";

/**
 * Terracotta - cooler adobe portfolio. Paper #f6f1ea, deep umber ink, Schibsted Grotesk, and cooler clay #8f5a45 as signal only, avoiding the cream/serif/Claude terracotta cliché.
 */
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-terracotta" });

const ink = "text-[#27231f]";
const mute = "text-[#6f665d]";
const hairline = "border-[#27231f]/12";
const moreBtn = "mt-8 self-start rounded-none border-b border-[#27231f]/30 bg-transparent px-0 py-1.5 text-sm font-medium text-[#6f665d] hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]";

export function TerracottaTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("terracotta", portfolio.customization);
  const labels = getSectionLabels(portfolio.customization);
  const groupedSkills = groupSkillsByCategory(skills);
  const githubProfile = socialProfiles.find((profile) => profile.platform.toLowerCase() === "github");
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(githubStats?.contributionCalendar);
  const featuredProjects = projects.filter((project) => project.featured);
  const visibleProjects = featuredProjects.length > 0 ? [...featuredProjects, ...projects.filter((p) => !p.featured)] : projects;
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const resolved = resolveSectionLayout(getTemplateSectionLayout("terracotta"), portfolio.customization);

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
        aboutList: `flex flex-col gap-3 pl-5 text-base leading-8 ${mute} marker:text-[var(--lf-accent)]`,
        aboutParagraph: `text-base leading-8 ${mute}`,
        postList: `list-disc flex flex-col gap-2 pl-5 text-sm leading-relaxed ${ink}`,
        postParagraph: `text-sm leading-relaxed ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${mute}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${mute} marker:text-[var(--lf-accent)]`,
        card: `border border-[#27231f]/12 bg-[#fffaf3] p-5`,
        title: ` text-xl font-semibold ${ink}`,
        text: `text-sm leading-7 ${mute}`,
        muted: `text-sm ${mute}`,
        chip: `rounded-none border ${hairline} bg-[#f6f1ea] px-2.5 py-1 text-sm ${mute}`,
        link: "text-sm font-medium text-[var(--lf-accent)] underline-offset-4 hover:underline",
        section: `scroll-mt-28 border-t ${hairline} pt-12 first:border-t-0`,
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary ? (
      <section key="about" id="about" className={cn("scroll-mt-28 border-t pt-12 first:border-t-0", hairline)}>
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={portfolio.summary}
          paragraphClassName={cn("text-lg leading-8", mute)}
          listClassName={cn("flex flex-col gap-3 pl-5 text-lg leading-8 marker:text-[var(--lf-accent)]", mute)}
        />
      </section>
    ) : null,

    projects: visibleProjects.length > 0 ? (
      <section key="projects" id="work" className={cn("scroll-mt-28 min-w-0 border-t pt-12 first:border-t-0", hairline)}>
        <SectionHeading>{labels.projects}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="grid grid-cols-1 gap-6 @lg:grid-cols-2" buttonClassName={moreBtn}>
          {visibleProjects.map((project) => (
            <article key={project.id} className={cn(PROJECT_CARD, "min-w-0 border-l-2 border-[var(--lf-accent)]/60 bg-[#fffaf3] p-4")}>
              <TemplateProjectPreview
                templateId="terracotta"
                liveUrl={project.liveUrl ?? null}
                imageUrl={project.imageUrl ?? null}
                projectId={project.id}
                livePreviewProjectIds={livePreviewProjectIds}
                alt={stripRichTextToPlain(project.title)}
                loading="lazy"
                containerClassName="overflow-hidden bg-[#e6ddd2]"
                className="h-full w-full object-cover object-top saturate-[0.92]"
                accentColor={primaryColor}
              />
              <div className="min-w-0 pt-5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-xl font-semibold tracking-[-0.03em]"><RichText text={project.title} /></h3>
                  {project.featured && <Badge variant="outline" className="h-auto rounded-none border-[var(--lf-accent)]/50 bg-transparent px-2 py-0.5 text-xs font-normal text-[var(--lf-accent)]">Featured</Badge>}
                </div>
                {project.description && (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("mt-2 text-sm leading-6", mute)}
                    listClassName={cn("mt-2 space-y-1.5 pl-5 text-sm leading-6 marker:text-[var(--lf-accent)]", mute)}
                  />
                )}
                {project.techStack.length > 0 && <TechList items={project.techStack.slice(0, 6)} compact />}
                <div className="mt-4 min-w-0">
                  <ProjectActions liveUrl={project.liveUrl} sourceUrl={project.sourceUrl} label={stripRichTextToPlain(project.title)} projectId={project.id} liveClassName="rounded-none bg-[#27231f] px-3 py-1.5 text-xs font-medium text-[#f6f1ea] hover:bg-[var(--lf-accent)]" sourceClassName="rounded-none px-3 py-1.5 text-xs font-medium text-[#6f665d] hover:underline" />
                </div>
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className={cn("scroll-mt-28 border-t pt-12 first:border-t-0", hairline)}>
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {experiences.map((exp) => (
            <article key={exp.id} className={cn("grid grid-cols-1 gap-3 border-t py-7 first:border-t-0 first:pt-0 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-10", hairline)}>
              <p className={cn("pt-1 text-sm tabular-nums", mute)}>{formatDateRange(exp.startDate, exp.endDate) || ""}</p>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold tracking-[-0.03em]"><RichText text={exp.role} /></h3>
                <p className="mt-1 text-sm text-[var(--lf-accent)]"><RichText text={exp.company} />{exp.location ? <span className={mute}> / <RichText text={exp.location} /></span> : null}</p>
                {exp.description && <DescriptionBlock text={exp.description} paragraphClassName={cn("mt-4 max-w-[42rem] text-sm leading-7", mute)} listClassName={cn("mt-4 flex max-w-[42rem] flex-col gap-2 pl-5 text-sm leading-7", mute)} />}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="articles" className={cn("scroll-mt-28 border-t pt-12 first:border-t-0", hairline)}>
        <SectionHeading>{labels.articles}</SectionHeading>
        <CollapsibleList initial={4} wrapperClassName="grid grid-cols-1 gap-5 @md:grid-cols-2" buttonClassName={moreBtn}>
          {articles.map((article) => (
            <article key={article.id} className="border-l-2 border-[var(--lf-accent)]/60 bg-[#fffaf3] p-5">
              <ArticleSourceLabel source={article.source} className={cn("mb-2", mute)} />
              <h3 className="text-lg font-semibold tracking-[-0.025em]"><a href={article.url} data-lf-track="article" data-lf-label={stripRichTextToPlain(article.title)} data-lf-id={article.id} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline"><RichText text={article.title} /></a></h3>
              {article.description && <p className={cn("mt-3 text-sm leading-6", mute)}><RichText text={article.description} /></p>}
              <p className={cn("mt-4 text-xs", mute)}>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null}{article.publishedAt && article.readTime != null ? " / " : null}{article.readTime != null ? `${article.readTime} min` : null}</p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" className={cn("border-t pt-12 first:border-t-0", hairline)}>
        <SectionHeading>{labels.skills}</SectionHeading>
        <div className="grid min-w-0 gap-5 @md:grid-cols-2">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category} className="min-w-0 border border-[#27231f]/12 bg-[#fffaf3] p-4">
              <h3 className="mb-2 text-sm font-semibold text-[var(--lf-accent)]">{category}</h3>
              <TechList items={names} compact />
            </div>
          ))}
        </div>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education" className={cn("border-t pt-12 first:border-t-0", hairline)}>
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList initial={3} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {educations.map((edu) => (
            <article key={edu.id} className={cn("border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <h3 className="text-xl font-semibold tracking-[-0.03em]"><RichText text={edu.degree} />{edu.field ? <> in <RichText text={edu.field} /></> : null}</h3>
              <p className={cn("mt-1 text-sm", mute)}><RichText text={edu.institution} />{formatDateRange(edu.startDate, edu.endDate) ? ` / ${formatDateRange(edu.startDate, edu.endDate)}` : ""}</p>
              {edu.gpa ? <p className={cn("mt-1 text-xs", mute)}>{edu.gpa}</p> : null}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications" className={cn("border-t pt-12 first:border-t-0", hairline)}>
        <SectionHeading>{labels.certifications}</SectionHeading>
        <CollapsibleList initial={3} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {certifications.map((cert) => (
            <article key={cert.id} className={cn("border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <h3 className="text-base font-medium">{cert.url ? <a href={cert.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{cert.name}</a> : cert.name}</h3>
              <p className={cn("mt-1 text-sm", mute)}>{cert.issuer}{cert.issueDate ? ` / ${new Date(cert.issueDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}</p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements" className={cn("border-t pt-12 first:border-t-0", hairline)}>
        <SectionHeading>{labels.achievements}</SectionHeading>
        <CollapsibleList initial={3} wrapperClassName="flex flex-col" buttonClassName={moreBtn}>
          {achievements.map((ach) => (
            <article key={ach.id} className={cn("flex items-start gap-3 border-t py-5 first:border-t-0 first:pt-0", hairline)}>
              <Trophy className="mt-0.5 size-4 shrink-0 text-[var(--lf-accent)]" aria-hidden />
              <div><h3 className="text-base font-medium"><RichText text={ach.title} /></h3>{ach.date ? <p className={cn("mt-1 text-xs", mute)}>{new Date(ach.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p> : null}</div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className={cn("scroll-mt-28 border-t pt-12 first:border-t-0", hairline)}>
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection portfolio={portfolio} profiles={socialProfiles} chipClassName="rounded-none border border-[#27231f]/12 bg-[#fffaf3] px-3 py-1.5 text-sm text-[#6f665d]" pillClassName="rounded-none border border-[#27231f]/12 bg-[#fffaf3] px-3 py-1.5 text-sm text-[#27231f] hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]" titleClassName={ink} textClassName={mute} />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" className={cn("scroll-mt-28 min-w-0 border-t pt-12 first:border-t-0", hairline)}>
        <SectionHeading>{labels.github}</SectionHeading>
        <div className="min-w-0">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="minimal"
            stretch
            className="mt-0 border-0 pt-0"
            frameClassName="rounded-none border-0 bg-transparent p-0 shadow-none"
            label={null}
          />
        </div>
      </section>
    ) : null,
  };

  return (
    <div className={cn(TEMPLATE_CONTAINER, schibsted.variable, "min-h-screen bg-[#f6f1ea] font-[family-name:var(--font-terracotta)] antialiased", ink)} style={accentRootStyle(primaryColor)}>
      
      <div className="relative mx-auto min-w-0 max-w-6xl overflow-x-clip px-5 pb-16 pt-8 sm:px-7 md:pb-28 md:pt-12">
        {navbarEnabled && <TemplateNavbar items={sections} className="mb-14 rounded-none border-y border-[#27231f]/12 bg-transparent" linkClassName="rounded-none px-0 py-3 text-sm text-[#6f665d] hover:text-[var(--lf-accent)]" />}
        <header className="grid min-w-0 gap-10 pb-4 @lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <h1 className={cn(HERO_TITLE_BASE, "text-5xl font-semibold leading-[1.01] tracking-[-0.065em] @sm:text-6xl @lg:text-8xl", ink)}><RichText text={portfolio.title} /></h1>
            {portfolio.headline && <p className={cn("mt-6 max-w-[38rem] text-xl leading-8 @md:text-2xl", mute)}><RichText text={portfolio.headline} /></p>}
          </div>
          <div className="self-end bg-[#fffaf3] p-5">
            <ContactChips portfolio={portfolio} chipClassName="rounded-none bg-transparent px-0 py-0 text-sm text-[#6f665d]" />
            <div className="mt-4 flex flex-wrap gap-2">
              <HeroProfileButtons profiles={socialProfiles} className="rounded-none border border-[#27231f]/12 bg-transparent px-3 py-1.5 text-sm text-[#27231f] hover:border-[var(--lf-accent)]" />
              {hasNonHeroSocialProfiles(socialProfiles) && <SocialPills profiles={socialProfiles} showUsername excludeHeroPlatforms className="rounded-none border border-[#27231f]/12 bg-transparent px-3 py-1.5 text-sm text-[#27231f] hover:border-[var(--lf-accent)]" />}
            </div>
          </div>
        </header>
        <main className="mt-14 flex min-w-0 flex-col gap-14">{renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}</main>
        {customSections.length > 0 && (
          <div className={cn("mt-14 grid gap-10 border-t pt-12 @md:grid-cols-2", hairline)}>
            {customSections.map((cs) => (
              <section key={cs.id}>
                <SectionHeading>{cs.label}</SectionHeading>
                <CustomSectionItems items={cs.items} titleClassName="font-semibold text-[#27231f]" textClassName={cn("text-sm", mute)} chipClassName="mr-2 mt-2 inline-block rounded-none border border-[#27231f]/12 bg-[#fffaf3] px-2 py-0.5 text-xs text-[#6f665d]" buttonClassName={moreBtn} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <div className="mb-8"><h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#27231f] @md:text-3xl">{children}</h2><Separator className="mt-4 bg-[#27231f]/12" /></div>;
}

function TechList({ items, compact = false }: { items: string[]; compact?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-wrap gap-1.5", compact ? "mt-4" : "mt-5")}>
      {items.map((tech) => (
        <TechChip
          key={tech}
          name={tech}
          className="max-w-full min-w-0 rounded-none border border-[#27231f]/12 bg-[#f6f1ea] px-2 py-0.5 text-xs text-[#6f665d]"
        />
      ))}
    </div>
  );
}
