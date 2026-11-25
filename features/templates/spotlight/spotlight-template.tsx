"use client";

import { useMemo, useState } from "react";
import { Fredoka, Nunito } from "next/font/google";
import { Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { resolveAccentColor, accentRootStyle } from "@/features/templates/template-accent-palettes";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";
import { stripRichTextToPlain } from "@/lib/rich-text";
import type { PortfolioData } from "../types";
import { cn } from "@/lib/utils";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "../github-contribution-heatmap";
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
  PROJECT_CARD,
  HERO_TITLE_BASE,
  SocialPills,
  hasNonHeroSocialProfiles,
  TEMPLATE_CONTAINER,
  getSectionLabels,
} from "../shared";
import { CollapsibleList } from "../collapsible-list";
import { formatDateRange, groupSkillsByCategory } from "../utils";
import { getTemplateSectionLayout } from "../section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "../section-order";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-spotlight-display",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-spotlight-sans",
});

const mint = "bg-[#fbfffe]";
const ink = "text-[#17231f]";
const muted = "text-[#66756f]";
const line = "border-[#17231f]/12";
const paper = "border-[#17231f]/12 bg-white";
const moreButton =
  "mt-6 self-start rounded-full border border-[#17231f]/15 bg-white px-5 py-2 text-sm font-semibold text-[#17231f] transition-colors hover:border-[var(--lf-accent)] hover:bg-[color-mix(in_srgb,var(--lf-accent)_16%,white)]";

export function SpotlightTemplate({ data }: { data: PortfolioData }) {
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
  const primaryColor = resolveAccentColor("spotlight", portfolio.customization);
  const labels = getSectionLabels(portfolio.customization);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const navItems = useMemo(
    () => [
      { label: "Home", href: "#top" },
      ...sections.map((section) => ({ label: section.label, href: `#${section.id}` })),
      ...customSections.map((section) => ({ label: section.label, href: `#${section.id}` })),
    ],
    [sections, customSections],
  );
  const heroTagline = portfolio.customization?.heroTagline?.trim() || portfolio.headline;
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("spotlight"),
    portfolio.customization,
  );

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SpotlightSectionHeading title={labels.linkedin} />}
      classes={{
        aboutList: `flex flex-col gap-2 pl-5 text-base leading-7 ${muted} marker:text-[var(--lf-accent)]`,
        aboutParagraph: `text-base leading-7 ${muted}`,
        postList: `list-disc flex flex-col gap-2 pl-5 text-base font-semibold ${ink}`,
        postParagraph: `text-base font-semibold ${ink}`,
        descriptionParagraph: `text-sm leading-7 ${muted}`,
        descriptionList: `flex flex-col gap-2 pl-5 text-sm leading-7 ${muted} marker:text-[var(--lf-accent)]`,
        card: `rounded-[1.4rem] border ${paper} p-5`,
        title: `font-[family-name:var(--font-spotlight-display)] text-2xl font-semibold ${ink}`,
        text: `text-sm leading-7 ${muted}`,
        muted: `text-sm ${muted}`,
        chip: `rounded-full border border-[#17231f]/12 bg-[#fbfffe] px-3 py-1 text-sm ${ink}`,
        link: "text-sm font-semibold text-[#17231f] decoration-[var(--lf-accent)] decoration-2 underline-offset-4 hover:underline",
        section: "scroll-mt-28",
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: portfolio.summary?.trim() ? (
      <section key="about" id="about" className="scroll-mt-28">
        <SpotlightSectionHeading title={labels.about} />
        <div className={cn("rounded-[1.6rem] border p-6 @lg:p-8", paper)}>
          <p className="font-[family-name:var(--font-spotlight-display)] text-3xl font-semibold leading-tight text-[#17231f]">
            The short version
          </p>
          <div className="mt-6">
            <DescriptionBlock
              text={portfolio.summary}
              paragraphClassName={cn("text-lg leading-8", muted)}
              listClassName={cn("flex flex-col gap-3 pl-5 text-lg leading-8", muted, "marker:text-[var(--lf-accent)]")}
            />
          </div>
        </div>
      </section>
    ) : null,

    projects: orderedProjects.length > 0 ? (
      <section key="projects" id="work" className="scroll-mt-28">
        <SpotlightSectionHeading title={labels.projects} />
        <CollapsibleList initial={4} wrapperClassName="grid gap-5 @md:grid-cols-2" buttonClassName={cn(moreButton, "@md:col-span-2")}>
          {orderedProjects.map((project) => (
            <article key={project.id} className={cn(PROJECT_CARD, "overflow-hidden rounded-[1.5rem] border bg-white", line)}>
              <div className="bg-[#eefbf7] p-3">
                <div className="overflow-hidden rounded-[1rem] border border-[#17231f]/10 bg-white">
                  <TemplateProjectPreview
                    templateId="spotlight"
                    liveUrl={project.liveUrl ?? null}
                    imageUrl={project.imageUrl ?? null}
                    projectId={project.id}
                    livePreviewProjectIds={livePreviewProjectIds}
                    alt={stripRichTextToPlain(project.title)}
                    loading="lazy"
                    accentColor={primaryColor}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-[family-name:var(--font-spotlight-display)] text-2xl font-semibold tracking-[-0.03em] text-[#17231f]">
                    <RichText text={project.title} />
                  </h3>
                  {project.featured ? (
                    <Badge variant="outline" className="h-auto rounded-full border-[#17231f]/15 bg-[color-mix(in_srgb,var(--lf-accent)_28%,white)] px-2.5 py-0.5 font-sans text-xs font-semibold tracking-normal text-[#17231f]">
                      Featured
                    </Badge>
                  ) : null}
                </div>
                {project.language ? <p className={cn("text-sm font-semibold", muted)}>{project.language}</p> : null}
                {project.description ? (
                  <DescriptionBlock
                    text={project.description}
                    paragraphClassName={cn("text-sm leading-6", muted)}
                    listClassName={cn("flex flex-col gap-1.5 pl-5 text-sm leading-6", muted)}
                  />
                ) : null}
                {(project.techStack.length > 0 || project.githubStars !== null || project.githubForks !== null) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {project.techStack.slice(0, 6).map((tech) => (
                      <TechChip key={tech} name={tech} className="rounded-full border border-[#17231f]/12 bg-[#fbfffe] px-3 py-1 text-xs font-semibold text-[#66756f]" />
                    ))}
                    {project.githubStars !== null ? <span className={cn("text-xs font-semibold", muted)}>{project.githubStars} stars</span> : null}
                    {project.githubForks !== null ? <span className={cn("text-xs font-semibold", muted)}>{project.githubForks} forks</span> : null}
                  </div>
                ) : null}
                <ProjectActions
                  liveUrl={project.liveUrl}
                  sourceUrl={project.sourceUrl}
                  label={stripRichTextToPlain(project.title)}
                  projectId={project.id}
                  liveClassName="rounded-full bg-[#17231f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#24352f]"
                  sourceClassName="rounded-full border border-[#17231f]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#17231f] hover:border-[var(--lf-accent)]"
                />
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className="scroll-mt-28">
        <SpotlightSectionHeading title={labels.experience} />
        <CollapsibleList initial={4} wrapperClassName="flex flex-col" buttonClassName={moreButton}>
          {experiences.map((exp) => (
            <article key={exp.id} className={cn("grid gap-4 border-t py-5 first:border-t-0 first:pt-0 @md:grid-cols-[11rem_minmax(0,1fr)]", line)}>
              <p className={cn("text-sm font-semibold tabular-nums", muted)}>{formatDateRange(exp.startDate, exp.endDate) || "Undated"}</p>
              <div className="min-w-0">
                <h3 className="font-[family-name:var(--font-spotlight-display)] text-2xl font-semibold tracking-[-0.03em] text-[#17231f]"><RichText text={exp.role} /></h3>
                <p className="mt-1 text-sm font-semibold text-[var(--lf-accent)]">
                  <RichText text={exp.company} />
                  {exp.location ? (
                    <span className={muted}>
                      {" "}
                      / <RichText text={exp.location} />
                    </span>
                  ) : null}
                </p>
                {exp.description ? (
                  <DescriptionBlock
                    text={exp.description}
                    paragraphClassName={cn("mt-4 max-w-[42rem] text-sm leading-7", muted)}
                    listClassName={cn("mt-4 flex max-w-[42rem] flex-col gap-2 pl-5 text-sm leading-7", muted)}
                  />
                ) : null}
              </div>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    education: educations.length > 0 ? (
      <section key="education" id="education" className="scroll-mt-28">
        <SpotlightSectionHeading title={labels.education} />
        <CollapsibleList initial={4} wrapperClassName="grid gap-5 @md:grid-cols-2" buttonClassName={cn(moreButton, "@md:col-span-2")}>
          {educations.map((edu) => (
            <article key={edu.id} className={cn("rounded-[1.4rem] border p-5", paper)}>
              <h3 className="font-[family-name:var(--font-spotlight-display)] text-2xl font-semibold tracking-[-0.03em] text-[#17231f]">
                <RichText text={edu.degree} />
                {edu.field ? <> in <RichText text={edu.field} /></> : null}
              </h3>
              <p className={cn("mt-2 text-sm font-semibold", muted)}><RichText text={edu.institution} /></p>
              <p className={cn("mt-3 text-sm", muted)}>{formatDateRange(edu.startDate, edu.endDate) || "Undated"}</p>
              {edu.gpa ? <p className={cn("mt-2 text-sm", muted)}>{edu.gpa}</p> : null}
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    skills: skills.length > 0 ? (
      <section key="skills" id="skills" className="scroll-mt-28">
        <SpotlightSectionHeading title={labels.skills} />
        <div className={cn("grid gap-6 rounded-[1.6rem] border p-6 @md:grid-cols-2 @lg:grid-cols-3", paper)}>
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category} className="min-w-0">
              <h3 className="font-[family-name:var(--font-spotlight-display)] text-2xl font-semibold tracking-[-0.03em] text-[#17231f]">{category}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {names.map((name) => (
                  <TechChip key={name} name={name} className="rounded-full border border-[#17231f]/12 bg-[#fbfffe] px-3 py-1 text-sm font-semibold text-[#66756f]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    achievements: achievements.length > 0 ? (
      <section key="achievements" id="achievements" className="scroll-mt-28">
        <SpotlightSectionHeading title={labels.achievements} />
        <CollapsibleList initial={5} wrapperClassName="flex flex-col" buttonClassName={moreButton}>
          {achievements.map((achievement) => (
            <article key={achievement.id} className={cn("grid gap-3 border-t py-4 first:border-t-0 first:pt-0 @md:grid-cols-[minmax(0,1fr)_12rem]", line)}>
              <p className="font-[family-name:var(--font-spotlight-display)] text-2xl font-normal tracking-[-0.03em] text-[#17231f]">
                <RichText text={achievement.title} />
              </p>
              <p className={cn("text-sm font-normal @md:text-right", muted)}>
                {achievement.date
                  ? new Date(achievement.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "Achievement"}
              </p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    certifications: certifications.length > 0 ? (
      <section key="certifications" id="certifications" className="scroll-mt-28">
        <SpotlightSectionHeading title={labels.certifications} />
        <CollapsibleList initial={5} wrapperClassName="flex flex-col" buttonClassName={moreButton}>
          {certifications.map((certification) => (
            <article key={certification.id} className={cn("grid gap-3 border-t py-4 first:border-t-0 first:pt-0 @md:grid-cols-[minmax(0,1fr)_12rem]", line)}>
              <p className="font-[family-name:var(--font-spotlight-display)] text-2xl font-normal tracking-[-0.03em] text-[#17231f]">
                {certification.url ? (
                  <a
                    href={certification.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {certification.name}
                  </a>
                ) : (
                  certification.name
                )}
              </p>
              <p className={cn("text-sm font-normal @md:text-right", muted)}>
                {certification.issuer}
              </p>
            </article>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    articles: articles.length > 0 ? (
      <section key="articles" id="writing" className="scroll-mt-28">
        <SpotlightSectionHeading title={labels.articles} />
        <CollapsibleList initial={4} wrapperClassName="grid gap-5 @md:grid-cols-2" buttonClassName={cn(moreButton, "@md:col-span-2")}>
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.url}
              data-lf-track="article"
              data-lf-label={stripRichTextToPlain(article.title)}
              data-lf-id={article.id}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("block rounded-[1.4rem] border p-5 transition-colors hover:border-[var(--lf-accent)]", paper)}
            >
              <ArticleSourceLabel source={article.source} className={cn("mb-3", muted)} />
              <h3 className="font-[family-name:var(--font-spotlight-display)] text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#17231f]"><RichText text={article.title} /></h3>
              {article.description ? <p className={cn("mt-3 text-sm leading-6", muted)}><RichText text={article.description} /></p> : null}
              <p className={cn("mt-4 text-sm", muted)}>
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                  : null}
                {article.readTime != null ? `${article.publishedAt ? " / " : ""}${article.readTime} min read` : null}
              </p>
              {article.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="h-auto rounded-full border-[#17231f]/12 bg-[#fbfffe] px-2.5 py-0.5 font-sans text-xs font-semibold tracking-normal text-[#66756f]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </a>
          ))}
        </CollapsibleList>
      </section>
    ) : null,

    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className="scroll-mt-28">
        <SpotlightSectionHeading title={labels.profiles} />
        <ProfileLinksSection
          portfolio={portfolio}
          profiles={socialProfiles}
          chipClassName="rounded-full border border-[#17231f]/12 bg-[#fbfffe] px-3 py-1.5 text-sm font-semibold text-[#66756f]"
          pillClassName="rounded-full border border-[#17231f]/12 bg-[#fbfffe] px-3 py-1.5 text-sm font-semibold text-[#17231f] transition-colors hover:border-[var(--lf-accent)]"
          titleClassName="font-semibold text-[#17231f]"
          textClassName="text-sm text-[#66756f]"
        />
      </section>
    ) : null,

    github: contributionCalendar ? (
      <section key="github" id="activity" className="scroll-mt-28">
        <SpotlightSectionHeading title={labels.github} />
        <div className="min-w-0">
          <GitHubContributionHeatmap
            calendar={contributionCalendar}
            profileUrl={githubProfile?.url}
            username={githubProfile?.username}
            variant="minimal"
            stretch
            className="mt-0 border-0 pt-0"
            frameClassName="border-0 bg-transparent p-0 shadow-none"
            label={null}
          />
        </div>
      </section>
    ) : null,
  };

  return (
    <div
      id="top"
      className={cn(
        TEMPLATE_CONTAINER,
        fredoka.variable,
        nunito.variable,
        mint,
        "min-h-screen font-[family-name:var(--font-spotlight-sans)] antialiased selection:bg-[var(--lf-accent)] selection:text-[#17231f]",
        ink,
      )}
      style={accentRootStyle(primaryColor)}
    >
      {navbarEnabled ? (
      <header className="sticky top-0 z-20 border-b border-[#17231f]/10 bg-[#fbfffe]/92 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-end gap-4 px-5 py-4 sm:px-6 md:px-8">
          <div className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <a key={`${item.href}-${item.label}`} href={item.href} className="text-sm font-semibold text-[#66756f] underline-offset-4 hover:text-[#17231f] hover:decoration-[var(--lf-accent)] hover:decoration-2 hover:underline">
                {item.label}
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-full border border-[#17231f]/12 bg-white p-2 text-[#17231f] lg:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>
        {menuOpen ? (
          <div className="border-t border-[#17231f]/10 bg-[#fbfffe] px-5 py-4 lg:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-3">
              {navItems.map((item) => (
                <a key={`${item.href}-${item.label}-mobile`} href={item.href} className="text-base font-semibold text-[#17231f]" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </header>
      ) : null}

      <main className="mx-auto min-w-0 max-w-6xl px-5 pb-16 pt-5 sm:px-6 md:px-8 md:pb-24 md:pt-6">
        <section className="grid gap-8 pb-6 @lg:grid-cols-[minmax(0,1fr)_20rem] @lg:items-start">
          <div className="min-w-0">
            <h1 className={cn(HERO_TITLE_BASE, "max-w-[58rem] font-[family-name:var(--font-spotlight-display)] text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-[#17231f] @md:text-7xl @lg:text-8xl")}>
              <RichText text={portfolio.title} />
            </h1>
            {heroTagline ? (
              <p className="mt-6 max-w-[43rem] text-balance text-2xl font-semibold leading-tight text-[#17231f] @md:text-3xl">
                {heroTagline}
              </p>
            ) : null}
            {portfolio.headline && heroTagline !== portfolio.headline ? (
              <p className={cn("mt-4 max-w-[36rem] text-lg leading-8", muted)}>
                <RichText text={portfolio.headline} />
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <HeroProfileButtons
                profiles={socialProfiles}
                className="rounded-full bg-[#17231f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#24352f]"
              />
              {hasNonHeroSocialProfiles(socialProfiles) ? (
                <SocialPills
                  profiles={socialProfiles}
                  showUsername
                  excludeHeroPlatforms
                  className="rounded-full border border-[#17231f]/12 bg-white px-3 py-1.5 text-sm font-semibold text-[#66756f] transition-colors hover:border-[var(--lf-accent)] hover:text-[#17231f]"
                />
              ) : null}
            </div>
          </div>
          <aside className="rounded-[2rem] border border-[#17231f]/12 bg-white p-5">
            <div className="rounded-[1.4rem] bg-[color-mix(in_srgb,var(--lf-accent)_42%,white)] p-5">
              <p className="font-[family-name:var(--font-spotlight-display)] text-4xl font-semibold leading-none tracking-[-0.05em] text-[#17231f]">
                Built to feel usable before it is explained.
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <ContactChips
                portfolio={portfolio}
                chipClassName="rounded-full border border-[#17231f]/12 bg-[#fbfffe] px-3 py-1.5 text-sm font-semibold text-[#66756f]"
              />
            </div>
          </aside>
        </section>

        <div className="flex min-w-0 flex-col gap-14">
          {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}
        </div>

        {customSections.length > 0 ? (
          <div className="mt-14 grid gap-8 @md:grid-cols-2">
            {customSections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <SpotlightSectionHeading title={section.label} />
                <div className={cn("rounded-[1.4rem] border p-5", paper)}>
                  <CustomSectionItems
                    items={section.items}
                    titleClassName="text-lg font-semibold text-[#17231f]"
                    textClassName={cn("mt-2 text-sm leading-6", muted)}
                    chipClassName="rounded-full border border-[#17231f]/12 bg-[#fbfffe] px-2.5 py-1 text-xs font-semibold text-[#66756f]"
                    buttonClassName={moreButton}
                  />
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function SpotlightSectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-[family-name:var(--font-spotlight-display)] text-4xl font-semibold tracking-[-0.05em] text-[#17231f] @md:text-5xl">
        {title}
        <span className="text-[var(--lf-accent)]">.</span>
      </h2>
    </div>
  );
}
