"use client";

import React, { useEffect, useRef, useState } from "react";
import { stripRichTextToPlain } from "@/lib/rich-text";
import { TemplateProjectPreview } from "@/components/template-project-preview";
import { GithubIcon, PlatformIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatDateRange,
  groupSkillsByCategory,
  sortExperiencesNewestFirst,
} from "../utils";
import type { PortfolioData } from "@/features/templates/types";
import {
  GitHubContributionHeatmap,
  parseContributionCalendar,
} from "@/features/templates/github-contribution-heatmap";
import { ArticleSourceLabel, RichText,
  buildTemplateSections,
  ContactChips,
  CustomSectionItems,
  DescriptionBlock,
  HeroProfileButtons,
  ProfileLinksSection,
  ProjectActions,
  PROJECT_CARD,
  PROJECT_CARD_BODY,
  PROJECT_CARD_HEADER,
  PROJECT_CARD_META,
  PROJECT_CARD_TITLE,
  HERO_HEADER_COLUMN,
  HERO_HEADLINE_SCALE,
  HERO_TITLE_BASE,
  HERO_TITLE_SCALE_7XL,
  PROJECTS_GRID_2,
  PROJECTS_GRID_3,
  TEMPLATE_CONTAINER,
  TechChip,
  TechIcon,
  getSectionLabels,
  SocialPills,
  hasNonHeroSocialProfiles,
  visibleSocialProfiles,
} from "@/features/templates/shared";
import { CollapsibleList } from "@/features/templates/collapsible-list";
import { getTemplateSectionLayout } from "@/features/templates/section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "@/features/templates/section-order";
import { accentRootStyle, resolveAccentColor } from "@/features/templates/template-accent-palettes";
import styles from "./synapse-template.module.css";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Menu,
  Trophy,
  X,
} from "lucide-react";
import { LinkedInSection } from "@/features/templates/components/linkedin-section";

interface AppProps {
  data: PortfolioData;
}

const SHELL = "max-w-6xl mx-auto px-4 @sm:px-6 @md:px-12";
const SECTION_Y = "py-12";
const MUTED = "text-gray-500";
const INK = "text-[#09090b]";
const DATE = "text-sm font-bold text-[var(--lf-accent)]";
const CARD =
  "bg-white border border-black/10";
const ACCENT_HOVER =
  "hover:text-[var(--lf-accent)] hover:border-[var(--lf-accent)]";
const COLLAPSE_BTN =
  "mt-8 w-full py-3 rounded-xl border border-black/10 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-[var(--lf-accent)] hover:border-[var(--lf-accent)] transition-colors";

function getInitials(title: string): string {
  const parts = stripRichTextToPlain(title).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function CertificationCard({
  cert,
  compact = false,
}: {
  cert: PortfolioData["certifications"][number];
  compact?: boolean;
}) {
  const date = formatDate(cert.issueDate);
  const inner = (
    <>
      <Trophy
        className={cn(
          "text-[var(--lf-accent)] shrink-0 mt-0.5",
          compact ? "w-4 h-4" : "w-5 h-5",
        )}
      />
      <div className={cn("min-w-0", !compact && "text-left")}>
        <p
          className={cn(
            INK,
            compact ? "font-medium text-sm leading-relaxed" : "font-medium leading-relaxed",
          )}
        >
          {cert.name}
        </p>
        {cert.issuer && (
          <p className="text-gray-600 font-medium text-sm mt-0.5">{cert.issuer}</p>
        )}
        {date && (
          <p className={cn(DATE, "mt-1")}>{date}</p>
        )}
      </div>
    </>
  );
  const className = compact
    ? cn(
        CARD,
        "flex items-start gap-3 rounded-2xl p-4 @sm:p-5 hover:border-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)] hover:shadow-lg hover:shadow-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] transition-all duration-300",
      )
    : cn(
        CARD,
        "inline-flex items-start gap-3 rounded-2xl p-5 hover:border-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)] hover:shadow-lg hover:shadow-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] hover:-translate-y-0.5 transition-all duration-300",
      );

  if (cert.url) {
    return (
      <a
        href={cert.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
}

function SectionHeading({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl @sm:text-4xl font-bold uppercase tracking-tight leading-tight !text-[#09090b]">
        {children}
      </h2>
      {subtitle && (
        <p className={cn(MUTED, "mt-3 @sm:mt-4 text-base @sm:text-lg max-w-2xl leading-relaxed")}>
          {subtitle}
        </p>
      )}
      <div className="h-1 w-16 bg-[var(--lf-accent)] mt-3 rounded-full" />
    </div>
  );
}

export function SynapseTemplate({ data: initialData }: AppProps) {
  const [data, setData] = useState<PortfolioData>(initialData);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("about");

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const livePreviewProjectIds = data.livePreviewProjectIds ?? [];
  const githubProfile = data.socialProfiles.find(
    (p) => p.platform.toLowerCase() === "github",
  );
  const mediumProfile = data.socialProfiles.find(
    (p) => p.platform.toLowerCase() === "medium",
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar,
  );
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const labels = getSectionLabels(data.portfolio.customization);
  const primaryColor = resolveAccentColor(
    "synapse",
    data.portfolio.customization,
  );
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("synapse"),
    data.portfolio.customization,
  );
  const featuredProjects = data.projects.filter((project) => project.featured);
  const visibleProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...data.projects.filter((p) => !p.featured)]
      : data.projects;
  const groupedSkills = groupSkillsByCategory(data.skills);
  const experiences = sortExperiencesNewestFirst(data.experiences);
  const visibleSocials = visibleSocialProfiles(data.socialProfiles, {
    excludeHeroPlatforms: true,
  });
  const navItems = navbarEnabled ? sections : [];
  const navSectionIds = navItems.map((section) => section.id).join(",");
  const navSectionIdsRef = useRef(navSectionIds);
  navSectionIdsRef.current = navSectionIds;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const scrollPos = window.scrollY + 200;
      for (const section of navSectionIdsRef.current.split(",").filter(Boolean)) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkedinSection = data.linkedin ? (
    <LinkedInSection
      data={data.linkedin}
      heading={<SectionHeading>{labels.linkedin}</SectionHeading>}
      classes={{
            aboutParagraph: cn(MUTED, "leading-relaxed text-sm @sm:text-base"),
            postList: cn("list-disc space-y-2 pl-5", INK, "font-medium text-sm leading-relaxed"),
            postParagraph: cn(INK, "font-medium text-sm leading-relaxed"),
            descriptionParagraph: cn(MUTED, "leading-relaxed text-sm @sm:text-base max-w-2xl"),
            descriptionList: cn(MUTED, "space-y-1.5 pl-5 leading-relaxed text-sm @sm:text-base max-w-2xl marker:text-[var(--lf-accent)]"),
          card: "rounded-2xl bg-white border border-black/10 p-5",
          title: cn(INK, "text-base @sm:text-lg @lg:text-xl font-bold leading-snug"),
          text: cn(MUTED, "leading-relaxed text-sm @sm:text-base"),
          muted: DATE,
          chip: "px-3 py-1.5 rounded-full bg-white border border-black/10 text-xs font-medium text-gray-600",
          link: "text-xs font-bold uppercase tracking-widest text-[var(--lf-accent)] hover:opacity-80",
          section: cn(SHELL, SECTION_Y, "scroll-mt-24"),
      }}
    />
  ) : null;

  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: data.portfolio.summary ? (
      <section key="about" id="about" className={cn(SHELL, SECTION_Y, "scroll-mt-24")}>
        <SectionHeading>{labels.about}</SectionHeading>
        <DescriptionBlock
          text={data.portfolio.summary}
          paragraphClassName={cn(MUTED, "text-base leading-relaxed @sm:text-lg")}
          listClassName={cn(MUTED, "space-y-2 pl-5 text-base leading-relaxed marker:text-[var(--lf-accent)] @sm:text-lg")}
        />
      </section>
    ) : null,
    skills: data.skills.length > 0 ? (
      <section key="skills" id="skills" className={cn(SHELL, SECTION_Y, "scroll-mt-24")}>
        <SectionHeading>
          {labels.skills}
        </SectionHeading>
        <div className="space-y-6 @sm:space-y-8">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category}>
              <p className="text-xs font-bold text-[var(--lf-accent)] uppercase tracking-widest mb-3 @sm:mb-4">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <span
                    key={`${category}-${name}`}
                    className={cn(
                      CARD,
                      "inline-flex items-center gap-1.5 px-3 py-1.5 @sm:px-4 @sm:py-2 rounded-full text-xs @sm:text-sm font-medium",
                      INK,
                      "hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)] hover:shadow-md hover:shadow-[color-mix(in_srgb,var(--lf-accent)_12%,transparent)] hover:-translate-y-0.5 transition-all duration-300 cursor-default",
                    )}
                  >
                    <TechIcon name={name} className="h-3.5 w-3.5" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ) : null,
    experience: experiences.length > 0 ? (
      <section key="experience" id="experience" className={cn(SHELL, SECTION_Y, "scroll-mt-24")}>
        <SectionHeading>{labels.experience}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-0"
          buttonClassName={COLLAPSE_BTN}
        >
          {experiences.map((exp, idx) => {
            const dateRange = formatDateRange(exp.startDate, exp.endDate);
            const isLast = idx === experiences.length - 1;
            return (
              <div
                key={exp.id}
                className="relative @md:grid @md:grid-cols-[180px_1fr] @md:gap-12"
              >
                <div className="hidden @md:block pt-1.5">
                  {dateRange && (
                    <p className={cn(DATE, "leading-relaxed")}>
                      {dateRange}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    "relative border-l border-black/10 pl-6 @sm:pl-8",
                    isLast ? "pb-0" : "pb-10 @sm:pb-12",
                  )}
                >
                  <div className="absolute top-1.5 -left-0 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--lf-accent)] border-4 border-white" />
                  {dateRange && (
                    <p className={cn(DATE, "@md:hidden mb-1")}>
                      {dateRange}
                    </p>
                  )}
                  <h3 className={cn(INK, "text-base @sm:text-lg @lg:text-xl font-bold leading-snug")}>
                    <RichText text={exp.role} />
                  </h3>
                  <p className="text-gray-600 font-medium mb-3 mt-0.5 text-sm @sm:text-base">
                    <RichText text={exp.company} />
                    {exp.location && (
                      <span className="text-gray-400 font-normal">
                        {" "}
                        · <RichText text={exp.location} />
                      </span>
                    )}
                  </p>
                  {exp.description && (
                    <DescriptionBlock
                      text={exp.description}
                      paragraphClassName={cn(MUTED, "leading-relaxed text-sm @sm:text-base max-w-2xl")}
                      listClassName={cn(MUTED, "space-y-1.5 pl-5 leading-relaxed text-sm @sm:text-base max-w-2xl marker:text-[var(--lf-accent)]")}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </CollapsibleList>
      </section>
    ) : null,
    projects: visibleProjects.length > 0 ? (
      <section
        key="projects"
        id="work"
        className={cn(SECTION_Y, "bg-gray-50/50 scroll-mt-24")}
      >
        <div className={SHELL}>
          <SectionHeading>
            {labels.projects}
          </SectionHeading>
          <CollapsibleList
            initial={4}
            wrapperClassName={cn(PROJECTS_GRID_2, "gap-5 @sm:gap-6 @md:gap-8")}
            buttonClassName={cn(COLLAPSE_BTN, "@md:col-span-2")}
          >
            {visibleProjects.map((proj) => (
              <div
                key={proj.id}
                className={cn(
                  PROJECT_CARD,
                  CARD,
                  "group relative rounded-2xl @sm:rounded-3xl hover:shadow-2xl hover:shadow-[color-mix(in_srgb,var(--lf-accent)_12%,transparent)] hover:border-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)] transition-all duration-500 flex flex-col",
                )}
              >
                <div className="relative overflow-hidden rounded-t-2xl @sm:rounded-t-3xl">
                  <TemplateProjectPreview
                    templateId="synapse"
                    liveUrl={proj.liveUrl}
                    imageUrl={proj.imageUrl}
                    projectId={proj.id}
                    livePreviewProjectIds={livePreviewProjectIds}
                    alt={stripRichTextToPlain(proj.title)}
                    loading="lazy"
                    accentColor={primaryColor}
                    containerClassName="aspect-[16/10] bg-gray-100"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className={cn(PROJECT_CARD_BODY, "min-w-0 px-5 @sm:px-7 pt-5 pb-6 @sm:pb-7 space-y-4 flex-1 flex flex-col")}>
                  <div className={cn(PROJECT_CARD_HEADER, "min-w-0")}>
                    <div className={cn(PROJECT_CARD_META, "min-w-0")}>
                      <h3 className={cn(PROJECT_CARD_TITLE, INK, "text-lg @sm:text-xl @lg:text-2xl font-bold leading-tight")}>
                        <RichText text={proj.title} />
                      </h3>
                    </div>
                    {proj.liveUrl ? (
                      <ExternalLink
                        size={18}
                        className="text-[#09090b] group-hover:text-[var(--lf-accent)] transition-colors shrink-0"
                      />
                    ) : proj.sourceUrl ? (
                      <GithubIcon className="h-[18px] w-[18px] text-[#09090b] group-hover:text-[var(--lf-accent)] transition-colors shrink-0" />
                    ) : null}
                  </div>
                  {proj.description && (
                    <div className="min-w-0">
                      <DescriptionBlock
                        text={proj.description}
                        paragraphClassName={cn(MUTED, "leading-relaxed text-sm [overflow-wrap:anywhere]")}
                        listClassName={cn(MUTED, "space-y-1.5 pl-5 leading-relaxed text-sm marker:text-[var(--lf-accent)] [overflow-wrap:anywhere]")}
                      />
                    </div>
                  )}
                  <div className="mt-auto flex min-w-0 flex-col gap-3">
                    {proj.techStack.length > 0 && (
                      <div className="flex min-w-0 flex-wrap gap-2">
                        {proj.techStack.map((tech) => (
                          <TechChip
                            key={tech}
                            name={tech}
                            className="rounded-md border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-[#18181b]"
                            iconClassName="h-4 w-4"
                          />
                        ))}
                      </div>
                    )}
                    <ProjectActions
                      liveUrl={proj.liveUrl}
                      sourceUrl={proj.sourceUrl}
                      label={stripRichTextToPlain(proj.title)}
                      projectId={proj.id}
                      liveClassName="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--lf-accent)] text-white hover:opacity-90 transition-opacity"
                      sourceClassName="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-black/10 bg-white text-[#09090b] hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)] transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CollapsibleList>
        </div>
      </section>
    ) : null,
    education: data.educations.length > 0 ? (
      <section key="education" id="education" className={cn(SHELL, SECTION_Y, "scroll-mt-24")}>
        <SectionHeading>{labels.education}</SectionHeading>
        <CollapsibleList
          initial={4}
          wrapperClassName="space-y-4"
          buttonClassName={COLLAPSE_BTN}
        >
          {data.educations.map((edu) => (
            <div
              key={edu.id}
              className={cn(CARD, "rounded-2xl p-5 @sm:p-6 space-y-2")}
            >
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-[var(--lf-accent)] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className={cn(INK, "text-lg font-bold leading-snug")}>
                    <RichText text={edu.degree} />
                    {edu.field ? ` in ${stripRichTextToPlain(edu.field)}` : ""}
                  </h3>
                  <p className="text-gray-600 font-medium text-sm mt-1">
                    <RichText text={edu.institution} />
                  </p>
                  {(edu.startDate || edu.endDate) && (
                    <p className={cn(DATE, "mt-2")}>
                      {formatDateRange(edu.startDate, edu.endDate)}
                    </p>
                  )}
                  {edu.gpa && (
                    <p className={cn(MUTED, "text-xs mt-1")}>{edu.gpa}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CollapsibleList>
      </section>
    ) : null,
    articles: data.articles.length > 0 ? (
      <section
        key="articles"
        id="articles"
        className={cn(SECTION_Y, "bg-gray-50/50 scroll-mt-24")}
      >
        <div className={SHELL}>
          <SectionHeading>
            {labels.articles}
          </SectionHeading>
          <CollapsibleList
            initial={6}
            wrapperClassName={cn(PROJECTS_GRID_3, "gap-5 @sm:gap-6")}
            buttonClassName={cn(COLLAPSE_BTN, "@md:col-span-2 @lg:col-span-3")}
          >
            {data.articles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  CARD,
                  "group rounded-2xl p-6 @sm:p-8 hover:border-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)] hover:shadow-xl hover:shadow-[color-mix(in_srgb,var(--lf-accent)_8%,transparent)] transition-all duration-300 flex flex-col",
                )}
                data-lf-track="article"
                data-lf-label={stripRichTextToPlain(article.title)}
              >
                <div className="flex items-center justify-between mb-5 @sm:mb-6 gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <ArticleSourceLabel source={article.source} />
                    {article.tags[0] && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[color-mix(in_srgb,var(--lf-accent)_12%,transparent)] text-[var(--lf-accent)] px-3 py-1 rounded-full">
                        {article.tags[0]}
                      </span>
                    )}
                  </div>
                  <BookOpen className="w-4 h-4 @sm:w-5 @sm:h-5 text-gray-400 group-hover:text-[var(--lf-accent)] transition-colors ml-auto" />
                </div>
                <h3 className={cn(INK, "text-base @sm:text-lg @lg:text-xl font-bold mb-3 leading-snug group-hover:text-[var(--lf-accent)] transition-colors")}>
                  <RichText text={article.title} />
                </h3>
                {article.description && (
                  <DescriptionBlock
                    text={article.description}
                    paragraphClassName={cn(MUTED, "leading-relaxed text-sm mb-5 @sm:mb-6 flex-1")}
                    listClassName={cn(MUTED, "space-y-1.5 pl-5 leading-relaxed text-sm mb-5 marker:text-[var(--lf-accent)]")}
                  />
                )}
                <div className="mt-auto flex items-center justify-between text-sm">
                  {article.publishedAt && (
                    <span className="text-gray-400">
                      {formatDate(article.publishedAt)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[var(--lf-accent)] font-medium text-xs @sm:text-sm ml-auto">
                    Read <ExternalLink size={13} />
                  </span>
                </div>
              </a>
            ))}
          </CollapsibleList>
          {mediumProfile?.url && (
            <div className="mt-10 @sm:mt-12 text-center">
              <a
                href={mediumProfile.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(INK, "inline-flex items-center gap-2 font-medium hover:text-[var(--lf-accent)] transition-colors text-sm @sm:text-base")}
                data-lf-track="social"
                data-lf-label="medium"
              >
                <PlatformIcon platform="medium" className="h-5 w-5" />
                View all posts on Medium
                <ChevronRight size={15} />
              </a>
            </div>
          )}
        </div>
      </section>
    ) : null,
    certifications: data.certifications.length > 0 ? (
      <section key="certifications" id="certifications" className={cn(SHELL, SECTION_Y, "scroll-mt-24")}>
        <SectionHeading>{labels.certifications}</SectionHeading>
        <div className="@md:hidden">
          <CollapsibleList
            initial={6}
            wrapperClassName="flex flex-col gap-4"
            buttonClassName={COLLAPSE_BTN}
          >
            {data.certifications.map((cert) => (
              <CertificationCard key={cert.id} cert={cert} compact />
            ))}
          </CollapsibleList>
        </div>
        <div className="relative hidden @md:block">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--lf-accent)_50%,transparent)] to-transparent -translate-x-px" />
          <CollapsibleList
            initial={6}
            wrapperClassName="space-y-10"
            buttonClassName={COLLAPSE_BTN}
          >
            {data.certifications.map((cert, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <div
                  key={cert.id}
                  className="relative grid grid-cols-2 gap-12 items-center"
                >
                  <span className="absolute left-1/2 -translate-x-1/2 top-6 w-3.5 h-3.5 rounded-full bg-[var(--lf-accent)] ring-4 ring-white shadow-md shadow-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)] z-10" />
                  <div className={isLeft ? "pr-12 text-right" : "col-start-2 pl-12"}>
                    <CertificationCard cert={cert} />
                  </div>
                </div>
              );
            })}
          </CollapsibleList>
        </div>
      </section>
    ) : null,
    achievements: data.achievements.length > 0 ? (
      <section
        key="achievements"
        id="achievements"
        className={cn(SHELL, SECTION_Y, "scroll-mt-24")}
      >
        <SectionHeading>{labels.achievements}</SectionHeading>
        <div className="@md:hidden">
        <CollapsibleList
          initial={6}
          wrapperClassName="flex flex-col gap-4"
          buttonClassName={COLLAPSE_BTN}
        >
          {data.achievements.map((item) => (
            <div
              key={item.id}
              className={cn(
                CARD,
                "flex items-start gap-3 rounded-2xl p-4 @sm:p-5 hover:border-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)] hover:shadow-lg hover:shadow-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] transition-all duration-300",
              )}
            >
              <Trophy className="w-4 h-4 text-[var(--lf-accent)] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className={cn(INK, "font-medium text-sm leading-relaxed")}>
                  <RichText text={item.title} />
                </p>
                {item.date && (
                  <p className={cn(DATE, "mt-1")}>
                    {formatDate(item.date)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CollapsibleList>
        </div>
        <div className="relative hidden @md:block">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--lf-accent)_50%,transparent)] to-transparent -translate-x-px" />
          <CollapsibleList
            initial={6}
            wrapperClassName="space-y-10"
            buttonClassName={COLLAPSE_BTN}
          >
            {data.achievements.map((item, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <div
                  key={item.id}
                  className="relative grid grid-cols-2 gap-12 items-center"
                >
                  <span className="absolute left-1/2 -translate-x-1/2 top-6 w-3.5 h-3.5 rounded-full bg-[var(--lf-accent)] ring-4 ring-white shadow-md shadow-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)] z-10" />
                  <div className={isLeft ? "pr-12 text-right" : "col-start-2 pl-12"}>
                    <div className={cn(CARD, "inline-flex items-start gap-3 rounded-2xl p-5 hover:border-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)] hover:shadow-lg hover:shadow-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] hover:-translate-y-0.5 transition-all duration-300")}>
                      <Trophy className="w-5 h-5 text-[var(--lf-accent)] shrink-0 mt-0.5" />
                      <div className="text-left">
                        <p className={cn(INK, "font-medium leading-relaxed")}>
                          <RichText text={item.title} />
                        </p>
                        {item.date && (
                          <p className={cn(DATE, "mt-1")}>
                            {formatDate(item.date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CollapsibleList>
        </div>
      </section>
    ) : null,
    profiles: hasProfiles ? (
      <section key="profiles" id="profiles" className={cn(SHELL, SECTION_Y, "scroll-mt-24")}>
        <SectionHeading>{labels.profiles}</SectionHeading>
        <ProfileLinksSection
          portfolio={data.portfolio}
          profiles={data.socialProfiles}
          chipClassName="px-3 py-1.5 rounded-full bg-white border border-black/10 text-xs font-medium text-gray-600"
          pillClassName="px-3 py-1.5 rounded-full bg-[color-mix(in_srgb,var(--lf-accent)_12%,transparent)] text-[var(--lf-accent)] text-xs font-bold hover:opacity-80 transition-opacity"
          titleClassName="text-sm font-bold text-[var(--lf-accent)] uppercase tracking-widest"
          textClassName={MUTED}
        />
      </section>
    ) : null,
    github: contributionCalendar ? (
      <section key="github" className={cn(SHELL, SECTION_Y, "scroll-mt-24")}>
        <SectionHeading>{labels.github}</SectionHeading>
        <GitHubContributionHeatmap
          calendar={contributionCalendar}
          profileUrl={githubProfile?.url}
          username={githubProfile?.username}
          variant="corporate"
          stretch
          className="mt-0 border-0 pt-0"
        />
      </section>
    ) : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        styles.root,
        "relative min-w-0 overflow-x-hidden bg-white text-[#09090b] font-sans transition-colors duration-300",
      )}
      style={accentRootStyle(primaryColor)}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] blob-blur rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-purple-400/10 blob-blur rounded-full" />
      </div>

      <nav
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled || mobileMenuOpen
            ? "py-3 @sm:py-4 bg-white/80 backdrop-blur-xl border-b border-black/5"
            : "py-4 @sm:py-6 bg-transparent",
        )}
      >
        <div className={cn(SHELL, "flex items-center justify-between gap-4")}>
          <a
            href="#about"
            className="flex shrink-0 items-center"
            aria-label={stripRichTextToPlain(data.portfolio.title)}
          >
            <span className="w-8 h-8 rounded-lg bg-[var(--lf-accent)] text-white text-xs font-bold flex items-center justify-center">
              {getInitials(data.portfolio.title)}
            </span>
          </a>

          {navItems.length > 0 && (
            <div className="hidden min-w-0 @4xl:flex flex-wrap justify-end gap-x-5 gap-y-2 @5xl:gap-x-8 items-center text-sm font-medium uppercase tracking-wide">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      "relative shrink-0 transition-colors duration-300 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-[var(--lf-accent)] after:transition-all after:duration-300",
                      isActive
                        ? "text-[var(--lf-accent)] after:w-full"
                        : "text-gray-500 hover:text-[var(--lf-accent)] after:w-0 hover:after:w-full",
                    )}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          )}

          {navItems.length > 0 && (
            <button
              type="button"
              className="@4xl:hidden text-[#09090b] p-2 rounded-full hover:bg-black/5 transition-colors focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>

        {mobileMenuOpen && navItems.length > 0 && (
          <div className="@4xl:hidden border-t border-black/5 bg-white/95 backdrop-blur-xl">
            <div className={cn(SHELL, "flex max-h-[70dvh] flex-col gap-1 overflow-y-auto py-3")}>
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-3 text-base font-bold uppercase transition-colors",
                    activeSection === item.id
                      ? "bg-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] text-[var(--lf-accent)]"
                      : cn(INK, "hover:bg-gray-50 hover:text-[var(--lf-accent)]"),
                  )}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="relative z-10">
        <section
          id="top"
          className={cn(SHELL, "min-h-0 flex items-center pt-8 pb-12 @sm:pt-10 @sm:pb-14 scroll-mt-24")}
        >
          <div className={cn(HERO_HEADER_COLUMN, "w-full space-y-4")}>
            <div className="max-w-3xl space-y-4">
            <h1
              className={cn(
                HERO_TITLE_BASE,
                HERO_TITLE_SCALE_7XL,
                "font-bold leading-tight tracking-tight !text-[#09090b]",
              )}
            >
              <RichText text={data.portfolio.title} />
            </h1>
            {data.portfolio.headline && (
              <h2 className={cn(HERO_HEADLINE_SCALE, "font-medium tracking-tight text-[var(--lf-accent)]")}>
                <RichText text={data.portfolio.headline} />
              </h2>
            )}
            </div>
            <ContactChips
              portfolio={data.portfolio}
              chipClassName="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-gray-600"
            />
            <div className="flex flex-wrap items-center gap-3 @sm:gap-4">
              {visibleProjects.length > 0 && (
                <a
                  href="#work"
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--lf-accent)] px-3 py-1.5 text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[color-mix(in_srgb,var(--lf-accent)_25%,transparent)] active:scale-[0.98]"
                >
                  View Projects <ChevronRight size={16} />
                </a>
              )}
              <HeroProfileButtons
                profiles={data.socialProfiles}
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]"
              />
              {hasNonHeroSocialProfiles(data.socialProfiles) && (
                <SocialPills
                  profiles={data.socialProfiles}
                  showUsername
                  excludeHeroPlatforms
                  className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold transition-colors hover:border-[var(--lf-accent)] hover:text-[var(--lf-accent)]"
                />
              )}
            </div>
          </div>
        </section>

        {renderSections(resolved, "full", { ...blocks, linkedin: linkedinSection })}

        {data.customSections.length > 0 && (
          <section className={cn(SHELL, SECTION_Y)}>
            {data.customSections.map((sec) => (
              <div key={sec.id} className={cn(CARD, "rounded-2xl p-6 @sm:p-8 mb-8")}>
                <SectionHeading>{sec.label}</SectionHeading>
                <CustomSectionItems
                  items={sec.items}
                  titleClassName="text-sm font-bold text-[var(--lf-accent)]"
                  textClassName={cn(MUTED, "text-sm")}
                  chipClassName="px-2 py-0.5 rounded-md bg-gray-50 border border-black/5 text-[10px] uppercase"
                  buttonClassName="mt-4 text-xs font-bold uppercase tracking-widest text-[var(--lf-accent)] hover:opacity-80"
                />
              </div>
            ))}
          </section>
        )}

        {visibleSocials.length > 0 && (
          <section id="contact" className={cn(SHELL, SECTION_Y, "scroll-mt-24")}>
            <div className="text-center bg-gradient-to-b from-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] to-transparent p-8 @sm:p-12 rounded-[32px] @sm:rounded-[40px] border border-[color-mix(in_srgb,var(--lf-accent)_12%,transparent)]">
              <h2 className="text-3xl @sm:text-4xl font-bold mb-4 @sm:mb-6 leading-tight !text-[#09090b]">
                Let&apos;s work together
              </h2>
              <p className={cn(MUTED, "text-base @sm:text-lg mb-8 @sm:mb-12 max-w-2xl mx-auto leading-relaxed")}>
                If you&apos;re building something that needs to ship, let&apos;s talk.
              </p>
              <div className="flex flex-col @sm:flex-row gap-4 @sm:gap-6 justify-center items-center">
                <div className="flex gap-3 @sm:gap-4">
                  {visibleSocials.slice(0, 5).map((profile) => (
                    <a
                      key={`${profile.platform}-${profile.url}`}
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={profile.platform}
                      className={cn(
                        CARD,
                        ACCENT_HOVER,
                        "w-12 h-12 @sm:w-14 @sm:h-14 rounded-xl @sm:rounded-2xl flex items-center justify-center hover:bg-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] transition-colors",
                      )}
                      data-lf-track="social"
                      data-lf-label={profile.platform}
                    >
                      <PlatformIcon
                        platform={profile.platform}
                        className="h-5 w-5 text-[#09090b]"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="py-8 @sm:py-12 border-t border-black/5">
        <div className={cn(SHELL, "flex flex-col @sm:flex-row justify-between items-center gap-4 @sm:gap-6 text-center @sm:text-left")}>
          <div className={cn(MUTED, "text-xs @sm:text-sm")}>
            © {new Date().getFullYear()} <RichText text={data.portfolio.title} />. Crafted with precision.
          </div>
          {visibleSocials.length > 0 && (
            <div className={cn(MUTED, "flex flex-wrap justify-center gap-5 @sm:gap-8 text-xs @sm:text-sm font-medium")}>
              {visibleSocials.map((profile) => (
                <a
                  key={`${profile.platform}-${profile.url}`}
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#09090b] transition-colors capitalize"
                  data-lf-track="social"
                  data-lf-label={profile.platform}
                >
                  {profile.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default SynapseTemplate;
