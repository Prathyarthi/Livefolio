"use client";

import React, { useState, useEffect, useRef } from "react";
import { TemplateProjectPreview } from "@/components/template-project-preview";
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
import {
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
  TEMPLATE_CONTAINER,
  getSectionLabels,
} from "@/features/templates/shared";
import { CollapsibleList } from "@/features/templates/collapsible-list";
import { getTemplateSectionLayout } from "@/features/templates/section-layouts";
import {
  renderSections,
  resolveSectionLayout,
  type ReorderableSectionKey,
} from "@/features/templates/section-order";
import { resolveAccentColor } from "@/features/templates/template-accent-palettes";
import styles from "./maximalist-template.module.css";
import {
  Terminal as TerminalIcon,
  Code,
  Zap,
  Trophy,
  Award,
  Calendar,
  ExternalLink,
  Menu,
  X,
  Star,
  GitFork,
  Activity,
  ArrowUp,
  Copy,
  Check,
  RefreshCw,
  CornerDownLeft,
  FileText,
} from "lucide-react";

type Article = PortfolioData["articles"][number];

function getInitials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function displayDate(dateStr: string | null, fallback = "N/A"): string {
  return formatDate(dateStr) || fallback;
}



interface AppProps {
  data: PortfolioData;
}

export function MaximalistTemplate({ data: initialData }: AppProps) {
  // Local state so the JSON inspector can experiment without mutating props.
  const [data, setData] = useState<PortfolioData>(initialData);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("about");

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleResetData = () => {
    setData(initialData);
  };

  const livePreviewProjectIds = data.livePreviewProjectIds ?? [];
  const githubProfile = data.socialProfiles.find(
    (p) => p.platform.toLowerCase() === "github"
  );
  const githubStats = githubProfile?.cachedStats as Record<string, unknown> | null;
  const contributionCalendar = parseContributionCalendar(
    githubStats?.contributionCalendar
  );
  const { hasProfiles, navbarEnabled, sections } = buildTemplateSections(data);
  const navItems = navbarEnabled ? sections : [];
  const navSectionIds = navItems.map((section) => section.id).join(",");
  const navSectionIdsRef = useRef(navSectionIds);
  navSectionIdsRef.current = navSectionIds;
  const labels = getSectionLabels(data.portfolio.customization);
  const primaryColor = resolveAccentColor(
    "maximalist",
    data.portfolio.customization,
  );
  const resolved = resolveSectionLayout(
    getTemplateSectionLayout("maximalist"),
    data.portfolio.customization,
  );
  const featuredProjects = data.projects.filter((project) => project.featured);
  const visibleProjects =
    featuredProjects.length > 0
      ? [...featuredProjects, ...data.projects.filter((p) => !p.featured)]
      : data.projects;

  const topSkills = data.skills.slice(0, 6).map((s) => s.name).filter(Boolean);
  const experiences = sortExperiencesNewestFirst(data.experiences);
  const latestExperience = experiences[0];
  const marqueeItems = [
    data.portfolio.headline
      ? `⚡ ${data.portfolio.title} — ${data.portfolio.headline}`
      : data.portfolio.title
        ? `⚡ ${data.portfolio.title}`
        : null,
    data.portfolio.location ? `📍 ${data.portfolio.location}` : null,
    latestExperience
      ? `💼 ${latestExperience.role} @ ${latestExperience.company}`
      : null,
    topSkills.length > 0 ? `🔥 ${topSkills.join(" / ")}` : null,
    data.portfolio.contactEmail ? `🚀 ${data.portfolio.contactEmail}` : null,
  ].filter((item): item is string => Boolean(item?.trim()));

  // Scroll spy for active navbar highlighting
  useEffect(() => {
    const handleScroll = () => {
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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const blocks: Partial<Record<ReorderableSectionKey, React.ReactNode>> = {
    about: null,
    experience: experiences.length > 0
      ? (
        <section key="experience" id="experience" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
        {/* Ambient Radial Background Glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[color-mix(in_srgb,var(--lf-accent)_15%,transparent)] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b-4 border-white pb-6">
            <div>
              <SectionHeading>{labels.experience}</SectionHeading>
            </div>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute left-8 top-6 bottom-6 w-1 bg-[var(--lf-accent)] pointer-events-none" />
            <CollapsibleList
              initial={4}
              wrapperClassName="space-y-10"
              buttonClassName="mt-8 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[var(--lf-accent)] hover:text-black transition-colors neo-shadow"
            >
              {experiences.map((exp, index) => {
                const isCurrent = exp.endDate === null;

                const cardStyle = index === 0
                  ? 'bg-white text-black sm:rotate-[-1deg] hover:rotate-0 transition-transform duration-300 border-4 border-black neo-shadow-white'
                  : index === 1
                    ? 'bg-[var(--lf-accent)] text-black sm:rotate-[1deg] hover:rotate-0 transition-transform duration-300 border-4 border-white neo-shadow'
                    : 'bg-black text-white sm:rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300 border-4 border-white neo-shadow';

                return (
                  <div key={exp.id} className="relative lg:pl-16">

                    <div className="hidden lg:flex absolute left-4 top-6 -translate-x-1/2 w-9 h-9 bg-[var(--lf-accent)] border-2 border-white items-center justify-center text-black font-mono font-black text-xs neo-shadow z-10">
                      0{index + 1}
                    </div>

                    <div className={`${cardStyle} p-6 sm:p-8 transition-all group`}>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-current">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-3xl font-black uppercase tracking-tight">
                              {exp.company}
                            </span>
                            {isCurrent && (
                              <span className="bg-[var(--lf-accent)] text-black px-2 py-0.5 text-[10px] font-mono font-black uppercase border border-current">
                                PRESENT ROLE
                              </span>
                            )}
                            {exp.location && (
                              <span className="bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase border border-white">
                                {exp.location}
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-black uppercase tracking-tight opacity-90 font-mono">
                            {exp.role}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-xs">
                          <div className="bg-black text-white px-3 py-1.5 font-bold flex items-center gap-2 border border-white">
                            <Calendar className="w-3.5 h-3.5 text-[var(--lf-accent)]" />
                            <span>
                              {formatDateRange(exp.startDate, exp.endDate) || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {exp.description && (
                        <div className="mt-5">
                          <DescriptionBlock
                            text={exp.description}
                            paragraphClassName="text-sm font-bold leading-relaxed"
                            listClassName="space-y-2 pl-5 text-sm font-bold leading-relaxed marker:text-current"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CollapsibleList>
          </div>

        </div>
      </section>
      )
      : null,
    projects: visibleProjects.length > 0
      ? (
        <section key="projects" id="work" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
        {/* Ambient Radial Background Glow */}
        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b-4 border-white pb-6">
            <div>
              <SectionHeading>{labels.projects}</SectionHeading>
            </div>
          </div>

          <CollapsibleList
            initial={4}
            wrapperClassName={cn(PROJECTS_GRID_2, "gap-8")}
            buttonClassName="@md:col-span-2 mt-4 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[var(--lf-accent)] hover:text-black transition-colors neo-shadow"
          >
            {visibleProjects.map((proj, projIdx) => {
              const isEven = projIdx % 2 === 0;
              const slantClass = isEven
                ? 'sm:rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300'
                : 'sm:rotate-[0.5deg] hover:rotate-0 transition-transform duration-300';

              return (
                <div
                  key={proj.id}
                  className={cn(
                    PROJECT_CARD,
                    "bg-black border-4 border-white hover:border-[var(--lf-accent)] neo-shadow transition-all group flex flex-col justify-between",
                    slantClass
                  )}
                >
                  <div>

                    <div className="relative overflow-hidden border-b-4 border-white bg-black">
                      <TemplateProjectPreview
                        templateId="maximalist"
                        liveUrl={proj.liveUrl}
                        projectId={proj.id}
                        livePreviewProjectIds={livePreviewProjectIds}
                        alt={proj.title}
                        loading="lazy"
                        accentColor={primaryColor}
                        containerClassName="bg-black"
                        className="grayscale contrast-125 transition-all duration-300 group-hover:scale-105 group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                      {proj.featured && (
                        <div className="absolute top-3 left-3 bg-white text-black font-mono font-black text-[10px] px-2.5 py-1 border border-black italic uppercase">
                          Featured
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex items-center gap-2 font-mono text-xs">
                        {!!proj.githubStars && (
                          <span className="bg-black text-yellow-400 border-2 border-white px-2.5 py-1 flex items-center gap-1 font-black">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span>{proj.githubStars}</span>
                          </span>
                        )}
                        {!!proj.githubForks && (
                          <span className="bg-black text-[var(--lf-accent)] border-2 border-white px-2.5 py-1 flex items-center gap-1 font-black">
                            <GitFork className="w-3.5 h-3.5" />
                            <span>{proj.githubForks}</span>
                          </span>
                        )}
                      </div>

                      {proj.language && (
                        <div className="absolute bottom-3 left-3 bg-[var(--lf-accent)] text-black border border-black px-2.5 py-0.5 font-mono text-xs font-black uppercase">
                          {proj.language}
                        </div>
                      )}
                    </div>

                    <div className={cn(PROJECT_CARD_BODY, "space-y-4")}>
                      <div className={PROJECT_CARD_HEADER}>
                        <div className={PROJECT_CARD_META}>
                          <h3 className={cn(PROJECT_CARD_TITLE, "text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-[var(--lf-accent)] transition-colors")}>
                            {proj.title}
                          </h3>
                        </div>
                      </div>

                      {proj.description && (
                        <DescriptionBlock
                          text={proj.description}
                          paragraphClassName="text-slate-200 text-sm font-bold"
                          listClassName="space-y-2 pl-5 text-slate-200 text-sm font-bold marker:text-[var(--lf-accent)]"
                        />
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                        {proj.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2.5 py-1 bg-white/10 text-white border border-white/30 font-mono text-[10px] font-black uppercase"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>

                  <div className="px-6 py-4 bg-white/5 border-t-4 border-white font-mono text-xs">
                    <ProjectActions
                      liveUrl={proj.liveUrl}
                      sourceUrl={proj.sourceUrl}
                      liveClassName="flex-1 py-2.5 bg-[var(--lf-accent)] hover:bg-white text-black font-black border-2 border-white flex items-center justify-center gap-2 neo-shadow transition-all hover:-translate-y-0.5 uppercase"
                      sourceClassName="flex-1 py-2.5 bg-black hover:bg-white hover:text-black text-white font-black border-2 border-white flex items-center justify-center gap-2 transition-colors uppercase"
                    />
                  </div>

                </div>
              );
            })}
          </CollapsibleList>

        </div>
      </section>
      )
      : null,
    skills: data.skills.length > 0
      ? <SkillsSectionComponent data={data} labels={labels} />
      : null,
    education: data.educations.length > 0
      ? (
        <section key="education" id="education" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mb-12 border-b-4 border-white pb-6">
              <SectionHeading>{labels.education}</SectionHeading>
            </div>
            <CollapsibleList
              initial={4}
              wrapperClassName="space-y-6"
              buttonClassName="mt-8 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[var(--lf-accent)] hover:text-black transition-colors neo-shadow"
            >
              {data.educations.map((edu) => (
                <div
                  key={edu.id}
                  className="bg-black border-4 border-white neo-shadow p-6 space-y-3"
                >
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    {edu.degree}
                    {edu.field && <span className="text-[var(--lf-accent)]"> in {edu.field}</span>}
                  </h3>
                  <p className="font-mono text-sm font-bold text-slate-300">{edu.institution}</p>
                  {(edu.startDate || edu.endDate) && (
                    <p className="inline-block bg-[var(--lf-accent)] text-black px-2 py-1 font-mono text-xs font-black uppercase">
                      {formatDateRange(edu.startDate, edu.endDate)}
                    </p>
                  )}
                  {edu.gpa && <p className="font-mono text-xs font-bold text-slate-400">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </CollapsibleList>
          </div>
        </section>
      )
      : null,
    articles: data.articles.length > 0 ? (
      <ArticlesSectionComponent
        data={data}
        labels={labels}
        onOpenArticle={setSelectedArticle}
      />
    ) : null,
    certifications: data.certifications.length > 0 ? (
      <CertificationsSectionComponent data={data} labels={labels} />
    ) : null,
    achievements: data.achievements.length > 0
      ? (
        <section key="achievements" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
        {/* Ambient Radial Glow */}
        <div className="absolute top-[-50px] left-[-50px] w-80 h-80 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b-4 border-white pb-6">
            <div>
              <SectionHeading>{labels.achievements}</SectionHeading>
            </div>
          </div>

          <CollapsibleList
            initial={4}
            wrapperClassName="space-y-3 mb-12"
            buttonClassName="mt-4 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[var(--lf-accent)] hover:text-black transition-colors neo-shadow"
          >
            {data.achievements.map((ach) => (
              <div
                key={ach.id}
                className="flex items-center gap-3 border-4 border-white bg-black px-4 py-3 neo-shadow"
              >
                <Trophy className="w-4 h-4 shrink-0 text-[var(--lf-accent)]" />
                <h3 className="min-w-0 text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  {ach.title}
                </h3>
              </div>
            ))}
          </CollapsibleList>

        </div>
      </section>
      )
      : null,
    profiles: hasProfiles
      ? (
        <section key="profiles" id="profiles" className="py-16 bg-black border-b-4 border-white scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 border-b-4 border-white pb-6">
              <SectionHeading>{labels.profiles}</SectionHeading>
            </div>
            <ProfileLinksSection
              portfolio={data.portfolio}
              profiles={data.socialProfiles}
              chipClassName="px-3 py-1.5 bg-black border-2 border-white font-mono text-[10px] font-black uppercase text-slate-300"
              pillClassName="px-3 py-1.5 bg-white text-black border-2 border-black font-mono text-xs font-black uppercase neo-shadow hover:bg-[var(--lf-accent)] transition-colors"
              titleClassName="font-mono text-sm font-black uppercase text-[var(--lf-accent)]"
              textClassName="text-slate-300 text-sm font-bold"
            />
          </div>
        </section>
      )
      : null,
    github: contributionCalendar
      ? (
        <section key="github" className="py-16 bg-black border-b-4 border-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <SectionHeading>{labels.github.toUpperCase()}</SectionHeading>
            </div>
            <div className="overflow-x-auto">
              <div className="mx-auto w-max max-w-full">
                <GitHubContributionHeatmap
                  calendar={contributionCalendar}
                  profileUrl={githubProfile?.url}
                  username={githubProfile?.username}
                />
              </div>
            </div>
          </div>
        </section>
      )
      : null,
  };

  return (
    <div
      className={cn(
        TEMPLATE_CONTAINER,
        styles.root,
        "min-w-0 overflow-x-hidden bg-[#0A0A0B] text-white font-sans selection:bg-[var(--lf-accent)] selection:text-black"
      )}
      style={{ ["--lf-accent" as string]: primaryColor }}
    >

      {/* 1. TOP KINETIC MARQUEE BANNER */}
      {marqueeItems.length > 0 && (
        <div className="bg-[var(--lf-accent)] text-black font-mono text-[11px] sm:text-xs font-black py-1.5 px-4 border-b-4 border-white overflow-hidden select-none">
          <div
            className="animate-marquee whitespace-nowrap flex items-center uppercase"
            style={{
              
              animationDuration: `${Math.max(18, marqueeItems.join("").length * 0.12)}s`,
            }}
          >
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center gap-6 sm:gap-8 pr-6 sm:pr-8"
                aria-hidden={copy === 1}
              >
                {marqueeItems.map((item, index) => (
                  <React.Fragment key={`${copy}-${index}`}>
                    <span>{item}</span>
                    <span aria-hidden>•</span>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b-4 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">

          {/* Logo */}
          <a href="#about" className="flex items-center gap-3 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[var(--lf-accent)] text-black font-mono font-black text-lg sm:text-xl flex items-center justify-center border-2 border-white neo-shadow group-hover:bg-white transition-colors">
              {getInitials(data.portfolio.title)}
            </div>
            <div className="flex flex-col">
              <span className="font-black font-mono text-sm sm:text-base tracking-tighter text-white uppercase group-hover:text-[var(--lf-accent)] transition-colors">
                {data.portfolio.title}
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          {navItems.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 font-mono text-xs font-black uppercase">
              {navItems.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    className={`px-3 py-1.5 transition-all border-2 ${isActive
                        ? 'bg-[var(--lf-accent)] text-black border-white neo-shadow'
                        : 'border-transparent text-slate-300 hover:text-white hover:border-white/40'
                      }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* Right Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs font-black">
            <button
              onClick={() => setIsTerminalOpen(true)}
              className="px-3.5 py-2 bg-white text-black border-2 border-black neo-shadow hover:bg-[var(--lf-accent)] transition-all flex items-center gap-1.5 uppercase"
              title="Open CLI Terminal"
            >
              <TerminalIcon className="w-4 h-4" />
              <span>CLI</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          {navItems.length > 0 && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 bg-[var(--lf-accent)] text-black border-2 border-white neo-shadow font-black"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && navItems.length > 0 && (
          <div className="lg:hidden border-t-4 border-white bg-black p-4 space-y-3 font-mono text-xs font-black uppercase">
            {navItems.map((link, index) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 bg-white/10 hover:bg-[var(--lf-accent)] hover:text-black border-2 border-white transition-colors"
              >
                {String(index + 1).padStart(2, "0")} // {link.label}
              </a>
            ))}

            <div className="pt-2 grid gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsTerminalOpen(true);
                }}
                className="py-2.5 bg-white text-black border-2 border-black font-black text-center flex items-center justify-center gap-2"
              >
                <TerminalIcon className="w-4 h-4" />
                <span>TERMINAL CLI</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 3. HERO SECTION */}
      <section id="about" className="py-12 sm:py-20 border-b-4 border-white relative overflow-hidden bg-grid-pattern">
        {/* Ambient Radial Background Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[color-mix(in_srgb,var(--lf-accent)_20%,transparent)] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Main Info Box */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8">

              {/* Display Header */}
              <div className={cn(HERO_HEADER_COLUMN, "border-b-4 border-white pb-6 space-y-3")}>
                <h1
                  className={cn(
                    HERO_TITLE_BASE,
                    HERO_TITLE_SCALE_7XL,
                    "font-black leading-[0.88] sm:leading-[0.82] tracking-tighter uppercase text-white"
                  )}
                >
                  {data.portfolio.title}
                </h1>
                {data.portfolio.headline && (
                  <p
                    className={cn(
                      HERO_HEADLINE_SCALE,
                      "font-black tracking-[0.1em] sm:tracking-[0.15em] uppercase text-[var(--lf-accent)]"
                    )}
                  >
                    {data.portfolio.headline}
                  </p>
                )}
              </div>

              {/* Summary Text */}
              {!resolved.isHidden("about") && data.portfolio.summary && (
                <DescriptionBlock
                  text={data.portfolio.summary}
                  paragraphClassName="text-slate-200 text-base sm:text-lg font-bold leading-relaxed max-w-3xl"
                  listClassName="space-y-2 pl-5 text-slate-200 text-base sm:text-lg font-bold leading-relaxed max-w-3xl marker:text-[var(--lf-accent)]"
                />
              )}

              <ContactChips
                portfolio={data.portfolio}
                chipClassName="px-3 py-1.5 bg-black border-2 border-white font-mono text-[10px] font-black uppercase text-slate-300"
              />
              <HeroProfileButtons
                profiles={data.socialProfiles}
                className="px-4 py-2 bg-white text-black border-2 border-black font-mono text-xs font-black uppercase neo-shadow hover:bg-[var(--lf-accent)] transition-colors"
              />
            </div>

          </div>
        </div>
      </section>


      {renderSections(resolved, "full", blocks)}

      {data.customSections.length > 0 && (
        <section className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {data.customSections.map((sec) => (
              <div key={sec.id} className="bg-black border-4 border-[var(--lf-accent)] p-8 neo-shadow mb-8">
                <SectionHeading>{sec.label}</SectionHeading>
                <CustomSectionItems
                  items={sec.items}
                  titleClassName="font-mono text-sm font-black text-[var(--lf-accent)] uppercase"
                  textClassName="text-slate-300 text-xs font-bold"
                  chipClassName="px-2 py-0.5 bg-white/10 border border-white/20 font-mono text-[10px] text-white uppercase"
                  buttonClassName="mt-4 font-mono text-xs font-black uppercase text-[var(--lf-accent)] hover:text-white transition-colors"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 11. FOOTER SECTION */}
      <footer id="contact" className="bg-black border-t-4 border-white relative overflow-hidden">

        {marqueeItems.length > 0 && (
          <div className="bg-[var(--lf-accent)] text-black font-mono text-xs font-black py-2.5 border-b-4 border-white select-none overflow-hidden uppercase">
            <div
              className="animate-marquee-reverse whitespace-nowrap flex items-center"
              style={{
                animationDuration: `${Math.max(18, marqueeItems.join("").length * 0.12)}s`,
              }}
            >
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="flex shrink-0 items-center gap-8 pr-8"
                  aria-hidden={copy === 1}
                >
                  {marqueeItems.map((item, index) => (
                    <React.Fragment key={`${copy}-${index}`}>
                      <span>{item}</span>
                      <span aria-hidden>•</span>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-6">
            {/* 1. Full name — one line, never truncated */}
            <div className="flex shrink-0 items-center gap-2">
              <div className="w-10 h-10 shrink-0 bg-[var(--lf-accent)] border-2 border-white font-mono font-black text-black flex items-center justify-center neo-shadow text-lg">
                {getInitials(data.portfolio.title)}
              </div>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight uppercase whitespace-nowrap">
                {data.portfolio.title}
              </span>
            </div>

            {/* 2. Navigation jumps — stacked column */}
            {navItems.length > 0 && (
              <div className="shrink-0 space-y-2 font-mono text-xs">
                <div className="text-[var(--lf-accent)] font-black uppercase tracking-widest whitespace-nowrap">
                  {"// NAVIGATION JUMPS"}
                </div>
                <ul className="flex flex-col gap-1.5 text-white font-bold">
                  {navItems.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="hover:text-[var(--lf-accent)] transition-colors whitespace-nowrap"
                      >
                        → {section.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. Back to top */}
            <a
              href="#about"
              className="shrink-0 self-start md:self-center px-4 py-2 bg-white text-black hover:bg-[var(--lf-accent)] font-black border-2 border-black neo-shadow flex items-center gap-2 transition-all uppercase font-mono text-xs"
            >
              <span>BACK TO TOP</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>

      {/* 12. MODALS */}
      {isTerminalOpen && (
        <TerminalContactModal data={data} onClose={() => setIsTerminalOpen(false)} />
      )}

      {isInspectorOpen && (
        <DataInspectorModal
          data={data}
          setData={setData}
          onClose={() => setIsInspectorOpen(false)}
          onResetData={handleResetData}
        />
      )}

      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}

    </div>
  );
}

/* =========================================================================
   INLINE SUB-COMPONENTS
   ========================================================================= */

// 1. SKILLS SECTION COMPONENT
function SkillsSectionComponent({
  data,
  labels,
}: {
  data: PortfolioData;
  labels: ReturnType<typeof getSectionLabels>;
}) {
  const groupedSkills = groupSkillsByCategory(data.skills);

  return (
    <section key="skills" id="skills" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--lf-accent)_10%,transparent)] rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b-4 border-white pb-6">
          <div>
            <SectionHeading>{labels.skills}</SectionHeading>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedSkills).map(([category, names]) => (
            <div key={category}>
              <h3 className="mb-4 font-mono text-xs font-black uppercase tracking-widest text-[var(--lf-accent)]">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {names.map((name, sIdx) => {
                  const slantClass = sIdx % 2 === 0
                    ? 'sm:rotate-[0.5deg] hover:rotate-0 transition-transform duration-300'
                    : 'sm:rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300';
                  return (
                    <div
                      key={`${category}-${name}`}
                      className={`p-5 bg-black border-4 border-white hover:border-[var(--lf-accent)] neo-shadow transition-all group relative overflow-hidden ${slantClass}`}
                    >
                      <div className="text-2xl font-black text-white group-hover:text-[var(--lf-accent)] transition-colors font-mono tracking-tight uppercase">
                        {name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 3. ARTICLES SECTION COMPONENT
function ArticlesSectionComponent({
  data,
  labels,
  onOpenArticle,
}: {
  data: PortfolioData;
  labels: ReturnType<typeof getSectionLabels>;
  onOpenArticle: (article: Article) => void;
}) {
  if (data.articles.length === 0) return null;

  return (
    <section key="articles" id="articles" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden">
      <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-6">
          <SectionHeading>{labels.articles}</SectionHeading>

          <CollapsibleList
            initial={4}
            wrapperClassName="space-y-6"
            buttonClassName="mt-4 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[var(--lf-accent)] hover:text-black transition-colors neo-shadow"
          >
            {data.articles.map((art, idx) => {
              const slantClass = idx % 2 === 0
                ? 'sm:rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300'
                : 'sm:rotate-[0.5deg] hover:rotate-0 transition-transform duration-300';

              return (
                <div
                  key={art.id}
                  className={`bg-black border-4 border-white hover:border-[var(--lf-accent)] neo-shadow p-6 transition-all group space-y-4 ${slantClass}`}
                >
                  <div className="flex items-center justify-between font-mono text-xs text-slate-300">
                    {art.publishedAt && (
                      <div className="flex items-center gap-1 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[var(--lf-accent)]" />
                        <span>{displayDate(art.publishedAt)}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-3xl font-black text-white group-hover:text-[var(--lf-accent)] transition-colors uppercase tracking-tight italic">
                    {art.title}
                  </h3>

                  {art.description && (
                    <DescriptionBlock
                      text={art.description}
                      paragraphClassName="text-slate-200 text-sm font-bold leading-relaxed"
                      listClassName="space-y-2 pl-5 text-slate-200 text-sm font-bold leading-relaxed marker:text-[var(--lf-accent)]"
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-black pt-2">
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-[var(--lf-accent)] hover:bg-white text-black font-black border-2 border-black flex items-center gap-2 neo-shadow transition-all uppercase"
                      data-lf-track="article"
                      data-lf-label={art.title}
                      data-lf-id={art.id}
                    >
                      <span>READ ARTICLE</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {art.description ? (
                      <button
                        type="button"
                        onClick={() => onOpenArticle(art)}
                        className="px-4 py-2.5 bg-black hover:bg-white hover:text-black text-white font-black border-2 border-white flex items-center gap-2 transition-colors uppercase"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>QUICK PREVIEW</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CollapsibleList>
        </div>
      </div>
    </section>
  );
}

function CertificationsSectionComponent({
  data,
  labels,
}: {
  data: PortfolioData;
  labels: ReturnType<typeof getSectionLabels>;
}) {
  if (data.certifications.length === 0) return null;

  return (
    <section key="certifications" id="certifications" className="py-16 bg-[#0A0A0B] bg-grid-pattern border-b-4 border-white relative overflow-hidden scroll-mt-24">
      <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-6">
          <SectionHeading>{labels.certifications}</SectionHeading>

          <CollapsibleList
            initial={4}
            wrapperClassName="space-y-4"
            buttonClassName="mt-4 w-full py-3 bg-black border-4 border-white font-mono text-xs font-black uppercase text-white hover:bg-[var(--lf-accent)] hover:text-black transition-colors neo-shadow"
          >
            {data.certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-black border-4 border-white neo-shadow p-5 space-y-3 sm:rotate-[0.5deg] hover:rotate-0 transition-transform duration-300"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xl font-black text-white uppercase">
                    {cert.url ? (
                      <a href={cert.url} target="_blank" rel="noreferrer" className="hover:text-[var(--lf-accent)]">
                        {cert.name}
                      </a>
                    ) : (
                      cert.name
                    )}
                  </span>
                  <span className="bg-[var(--lf-accent)] text-black font-mono px-2 py-0.5 font-black uppercase border border-black text-[10px]">
                    {cert.issuer}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
                  {cert.issueDate && <span>ISSUED: {displayDate(cert.issueDate)}</span>}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--lf-accent)] hover:underline font-black"
                    >
                      VERIFY CERTIFICATE →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CollapsibleList>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex min-w-0 items-start gap-2 sm:gap-3 text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
      <span className="mt-1.5 sm:mt-2 h-2.5 w-5 sm:h-3 sm:w-8 bg-[var(--lf-accent)] shrink-0" />
      <span className="min-w-0 break-words [overflow-wrap:anywhere] leading-[1.05]">
        {children}
      </span>
    </h2>
  );
}

// 4. TERMINAL CONTACT MODAL
function TerminalContactModal({ data, onClose }: { data: PortfolioData; onClose: () => void }) {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<{ cmd: string; output: React.ReactNode }[]>([
    {
      cmd: 'welcome',
      output: (
        <div className="space-y-1 text-slate-300">
          <div className="text-[var(--lf-accent)] font-black">{data.portfolio.title} INTERACTIVE TERMINAL [v2.4.0]</div>
          <div>Type <span className="text-yellow-400 font-bold">help</span> to list available commands or <span className="text-[var(--lf-accent)] font-bold">contact</span> to reach out directly.</div>
        </div>
      ),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCmd = input.trim().toLowerCase();
    if (!cleanCmd) return;

    let output: React.ReactNode = null;

    switch (cleanCmd) {
      case 'help':
        output = (
          <div className="space-y-1 text-xs">
            <div className="text-yellow-400 font-black">AVAILABLE COMMANDS:</div>
            <div>• <span className="text-[var(--lf-accent)] font-bold">bio</span> : Summary</div>
            <div>• <span className="text-[var(--lf-accent)] font-bold">experience</span> : Career timeline & roles</div>
            <div>• <span className="text-[var(--lf-accent)] font-bold">projects</span> : Repos & tech stack</div>
            <div>• <span className="text-[var(--lf-accent)] font-bold">skills</span> : Full language & framework matrix</div>
            <div>• <span className="text-[var(--lf-accent)] font-bold">contact</span> : Email & phone details</div>
            <div>• <span className="text-[var(--lf-accent)] font-bold">clear</span> : Clear terminal screen</div>
          </div>
        );
        break;

      case 'bio':
        output = (
          <div className="text-slate-200">
            <div className="text-[var(--lf-accent)] font-bold">{data.portfolio.title}</div>
            <div>{data.portfolio.summary}</div>
          </div>
        );
        break;

      case 'experience':
        output = (
          <div className="space-y-2 text-slate-200">
            {sortExperiencesNewestFirst(data.experiences).map((exp) => (
              <div key={exp.id} className="border-l-2 border-[var(--lf-accent)] pl-2">
                <div className="font-bold text-[var(--lf-accent)]">{exp.company} — {exp.role}</div>
                <div className="text-slate-400 text-[11px]">{formatDateRange(exp.startDate, exp.endDate) || "N/A"}</div>
                <div className="text-slate-300 mt-1 text-[11px] whitespace-pre-line">{exp.description}</div>
              </div>
            ))}
          </div>
        );
        break;

      case 'projects':
        output = (
          <div className="space-y-2 text-slate-200">
            {data.projects.map((p) => (
              <div key={p.id}>
                <div className="font-bold text-white">{p.title}</div>
                {p.description && (
                  <div className="text-slate-300 text-[11px]">{p.description}</div>
                )}
                {p.techStack.length > 0 && (
                  <div className="text-[var(--lf-accent)] text-[11px]">
                    Stack: {p.techStack.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
        break;

      case 'skills':
        output = (
          <div className="text-slate-200">
            <div className="font-bold text-[var(--lf-accent)]">SKILL MATRIX:</div>
            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-1 text-[11px] mt-1">
              {data.skills.map((s) => (
                <div key={s.id}>
                  • <span className="font-bold text-white">{s.name}</span>
                  {s.category ? <span className="text-slate-400"> ({s.category})</span> : null}
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case 'contact':
      case 'hire':
        output = (
          <div className="text-slate-200 space-y-1">
            <div className="text-[var(--lf-accent)] font-bold">CONTACT DIRECT:</div>
            {data.portfolio.contactEmail ? (
              <div>Email: <a href={`mailto:${data.portfolio.contactEmail}`} className="text-[var(--lf-accent)] underline">{data.portfolio.contactEmail}</a></div>
            ) : (
              <div>Email: N/A</div>
            )}
            {data.portfolio.phone && <div>Phone: {data.portfolio.phone}</div>}
            {data.portfolio.location && <div>Location: {data.portfolio.location}</div>}
          </div>
        );
        break;

      case 'clear':
        setLogs([]);
        setInput('');
        return;

      default:
        output = (
          <div className="text-red-400">
            Command not recognized: &apos;{cleanCmd}&apos;. Type{" "}
            <span className="text-yellow-400 font-bold">help</span> for commands.
          </div>
        );
    }

    setLogs((prev) => [...prev, { cmd: input, output }]);
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border-4 border-white rounded-none max-w-3xl w-full p-4 sm:p-6 neo-shadow flex flex-col max-h-[90vh] text-slate-200 font-mono text-xs space-y-4">

        <div className="flex items-center justify-between pb-3 border-b-2 border-white">
          <div className="flex items-center gap-2 text-[var(--lf-accent)] font-black text-sm">
            <TerminalIcon className="w-4 h-4 animate-pulse" />
            <span>{data.portfolio.title} CLI TERMINAL</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white text-black hover:bg-[var(--lf-accent)] font-black border border-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 bg-black p-4 border-2 border-white/40 overflow-y-auto space-y-4 min-h-[220px]">
          {logs.map((log, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[var(--lf-accent)]">$</span>
                <span className="text-white font-bold">{log.cmd}</span>
              </div>
              <div className="pl-4">{log.output}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleCommand} className="flex items-center gap-2">
          <span className="text-[var(--lf-accent)] font-black text-base">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type 'help', 'bio', 'projects', 'contact'..."
            className="flex-1 bg-black border-2 border-white px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[var(--lf-accent)]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--lf-accent)] hover:bg-white text-black font-black border-2 border-black neo-shadow flex items-center gap-1 shrink-0 uppercase"
          >
            <span>RUN</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
}

// 5. DATA INSPECTOR MODAL
function DataInspectorModal({
  data,
  setData,
  onClose,
  onResetData,
}: {
  data: PortfolioData;
  setData: React.Dispatch<React.SetStateAction<PortfolioData>>;
  onClose: () => void;
  onResetData: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setData(parsed);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON syntax. Please check formatting.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border-4 border-white max-w-3xl w-full p-4 sm:p-6 neo-shadow space-y-4 font-mono text-xs text-slate-200 max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between pb-3 border-b-2 border-white">
          <div className="flex items-center gap-2 text-[var(--lf-accent)] font-black text-sm">
            <Code className="w-4 h-4" />
            <span>PORTFOLIO DATA INSPECTOR</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white text-black hover:bg-[var(--lf-accent)] font-black border border-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 space-y-2 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between text-slate-300 font-bold text-[11px]">
            <span>RAW JSON DATA OBJECT:</span>
            <button
              onClick={handleCopy}
              className="text-[var(--lf-accent)] hover:text-white flex items-center gap-1 font-black"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED!' : 'COPY JSON'}</span>
            </button>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="flex-1 w-full bg-black p-3 border-2 border-white/60 font-mono text-[11px] text-emerald-400 focus:outline-none focus:border-[var(--lf-accent)] overflow-y-auto"
            rows={12}
          />

          {jsonError && (
            <div className="text-red-400 font-bold bg-red-950 p-2 border border-red-500">
              ⚠️ {jsonError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t-2 border-white">
          <button
            onClick={onResetData}
            className="px-3 py-2 bg-black hover:bg-white hover:text-black text-white font-black border-2 border-white flex items-center gap-1.5 text-xs uppercase"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET DEFAULTS</span>
          </button>

          <button
            onClick={handleApplyJson}
            className="px-5 py-2.5 bg-[var(--lf-accent)] hover:bg-white text-black font-black border-2 border-black neo-shadow text-xs uppercase"
          >
            UPDATE LIVE PORTFOLIO
          </button>
        </div>

      </div>
    </div>
  );
}

// 6. ARTICLE MODAL
function ArticleModal({
  article,
  onClose,
}: {
  article: Article;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border-4 border-white max-w-3xl w-full p-6 neo-shadow space-y-4 font-mono text-xs text-slate-200 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between pb-3 border-b-2 border-white">
          <span className="text-[var(--lf-accent)] font-black text-sm uppercase">{"// PUBLICATION PREVIEW"}</span>
          <button
            onClick={onClose}
            className="p-1 bg-white text-black hover:bg-[var(--lf-accent)] font-black border border-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic">
          {article.title}
        </h2>

        {article.publishedAt && (
          <div className="flex items-center gap-1 text-slate-400 font-bold">
            <Calendar className="w-3.5 h-3.5 text-[var(--lf-accent)]" />
            <span>{displayDate(article.publishedAt)}</span>
            {article.readTime != null && (
              <span className="ml-2">{article.readTime} min read</span>
            )}
          </div>
        )}

        {article.description && (
          <DescriptionBlock
            text={article.description}
            paragraphClassName="text-slate-300 font-sans text-sm leading-relaxed"
            listClassName="space-y-2 list-disc list-inside text-slate-200 font-sans text-xs"
          />
        )}

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 border border-white/30 text-[10px] font-black uppercase text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="pt-4 border-t-2 border-white flex justify-end">
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-[var(--lf-accent)] text-black font-black border-2 border-black neo-shadow uppercase"
            data-lf-track="article"
            data-lf-label={article.title}
            data-lf-id={article.id}
          >
            READ FULL ARTICLE →
          </a>
        </div>

      </div>
    </div>
  );
}